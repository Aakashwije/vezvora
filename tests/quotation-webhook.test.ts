import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import {
  parseDispatchPayload,
  timingSafeEquals,
  verifyCronRequest,
  verifyDispatchWebhook,
} from "../src/lib/quotation/scheduler.ts";

const CURRENT_KEY = "sig_current_test_key";
const NEXT_KEY = "sig_next_test_key";
const CALLBACK_URL = "https://vezvora.io/api/quotations/dispatch";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Build a QStash-shaped JWT: HS256 over the signing key, hashing the body. */
function signQStash(body: string, key: string, overrides: Record<string, unknown> = {}): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      iss: "Upstash",
      sub: CALLBACK_URL,
      iat: now,
      nbf: now - 5,
      exp: now + 300,
      jti: "test-jti",
      body: createHash("sha256").update(body).digest("base64url"),
      ...overrides,
    }),
  );
  const signature = createHmac("sha256", key).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function request(body: string, signature?: string): Request {
  return new Request(CALLBACK_URL, {
    method: "POST",
    headers: signature ? { "upstash-signature": signature } : {},
    body,
  });
}

function withKeys<T>(run: () => T, keys: { current?: string; next?: string } = {}): T {
  const previous = {
    current: process.env.QSTASH_CURRENT_SIGNING_KEY,
    next: process.env.QSTASH_NEXT_SIGNING_KEY,
  };
  if (keys.current === undefined) delete process.env.QSTASH_CURRENT_SIGNING_KEY;
  else process.env.QSTASH_CURRENT_SIGNING_KEY = keys.current;
  if (keys.next === undefined) delete process.env.QSTASH_NEXT_SIGNING_KEY;
  else process.env.QSTASH_NEXT_SIGNING_KEY = keys.next;

  try {
    return run();
  } finally {
    if (previous.current === undefined) delete process.env.QSTASH_CURRENT_SIGNING_KEY;
    else process.env.QSTASH_CURRENT_SIGNING_KEY = previous.current;
    if (previous.next === undefined) delete process.env.QSTASH_NEXT_SIGNING_KEY;
    else process.env.QSTASH_NEXT_SIGNING_KEY = previous.next;
  }
}

test("accepts a callback signed with the current signing key", async () => {
  const body = JSON.stringify({ quotationId: "qt_abc" });
  const result = await withKeys(
    () => verifyDispatchWebhook(request(body, signQStash(body, CURRENT_KEY))),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.body, body);
});

test("accepts a callback signed with the next key, so keys can be rotated", async () => {
  const body = JSON.stringify({ quotationId: "qt_abc" });
  const result = await withKeys(
    () => verifyDispatchWebhook(request(body, signQStash(body, NEXT_KEY))),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );
  assert.equal(result.ok, true);
});

test("rejects a signature made with the wrong key", async () => {
  const body = JSON.stringify({ quotationId: "qt_abc" });
  const result = await withKeys(
    () => verifyDispatchWebhook(request(body, signQStash(body, "an-attackers-key"))),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
});

test("rejects a valid signature attached to a tampered body", async () => {
  const signed = signQStash(JSON.stringify({ quotationId: "qt_abc" }), CURRENT_KEY);
  const result = await withKeys(
    () => verifyDispatchWebhook(request(JSON.stringify({ quotationId: "qt_someone_else" }), signed)),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
});

test("rejects an expired signature", async () => {
  const body = JSON.stringify({ quotationId: "qt_abc" });
  const past = Math.floor(Date.now() / 1000) - 3_600;
  const result = await withKeys(
    () =>
      verifyDispatchWebhook(
        request(body, signQStash(body, CURRENT_KEY, { exp: past, nbf: past - 60, iat: past - 60 })),
      ),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
});

test("rejects an unsigned callback", async () => {
  const result = await withKeys(
    () => verifyDispatchWebhook(request(JSON.stringify({ quotationId: "qt_abc" }))),
    { current: CURRENT_KEY, next: NEXT_KEY },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
  assert.match(result.reason, /Missing signature/);
});

test("fails closed when signing keys are not configured", async () => {
  const body = JSON.stringify({ quotationId: "qt_abc" });
  const result = await withKeys(() =>
    verifyDispatchWebhook(request(body, signQStash(body, CURRENT_KEY))),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 500);
  assert.match(result.reason, /not configured/);
});

/* --------------------------------------------------------------- cron auth */

function withCronSecret<T>(secret: string | undefined, run: () => T): T {
  const previousOwn = process.env.QUOTATION_CRON_SECRET;
  const previousVercel = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  if (secret === undefined) delete process.env.QUOTATION_CRON_SECRET;
  else process.env.QUOTATION_CRON_SECRET = secret;

  try {
    return run();
  } finally {
    if (previousOwn === undefined) delete process.env.QUOTATION_CRON_SECRET;
    else process.env.QUOTATION_CRON_SECRET = previousOwn;
    if (previousVercel === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousVercel;
  }
}

function cronRequest(authorization?: string): Request {
  return new Request("https://vezvora.io/api/quotations/cron", {
    headers: authorization ? { authorization } : {},
  });
}

test("the cron sweeper accepts the configured bearer secret", () => {
  const result = withCronSecret("s3cret", () => verifyCronRequest(cronRequest("Bearer s3cret")));
  assert.deepEqual(result, { ok: true });
});

test("the cron sweeper rejects a wrong or missing secret", () => {
  const wrong = withCronSecret("s3cret", () => verifyCronRequest(cronRequest("Bearer nope!!")));
  assert.equal(wrong.ok, false);
  if (!wrong.ok) assert.equal(wrong.status, 401);

  const missing = withCronSecret("s3cret", () => verifyCronRequest(cronRequest()));
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.status, 401);
});

test("the cron sweeper fails closed when no secret is configured", () => {
  const result = withCronSecret(undefined, () => verifyCronRequest(cronRequest("Bearer anything")));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 500);
});

test("secret comparison is length-safe and constant-time", () => {
  assert.equal(timingSafeEquals("abc", "abc"), true);
  assert.equal(timingSafeEquals("abc", "abd"), false);
  assert.equal(timingSafeEquals("abc", "abcd"), false);
  assert.equal(timingSafeEquals("", ""), true);
});

/* ------------------------------------------------------------- job payload */

test("parses only a well-formed job payload", () => {
  assert.deepEqual(parseDispatchPayload('{"quotationId":"qt_abc"}'), { quotationId: "qt_abc" });
  assert.equal(parseDispatchPayload('{"quotationId":123}'), null);
  assert.equal(parseDispatchPayload("{}"), null);
  assert.equal(parseDispatchPayload("not json"), null);
});

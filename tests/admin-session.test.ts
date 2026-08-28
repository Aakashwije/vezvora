import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createAdminPasswordHash, verifyAdminPassword } from "../src/lib/admin/password.ts";

function signTestSession(payload: { email: string; exp: number }, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyTestSession(token: string | undefined, secret: string) {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (sig !== expected) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { email: string; exp: number };
  return Date.now() > payload.exp ? null : payload;
}

test("verifies scrypt admin password hashes", () => {
  const previousHash = process.env.ADMIN_PASSWORD_HASH;
  const previousPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD_HASH = createAdminPasswordHash("correct-password", Buffer.alloc(16, 1));
  delete process.env.ADMIN_PASSWORD;

  assert.equal(verifyAdminPassword("correct-password"), true);
  assert.equal(verifyAdminPassword("wrong-password"), false);

  if (previousHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH = previousHash;
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousPassword;
});

test("rejects expired or tampered sessions", () => {
  const secret = "test-secret";

  const active = signTestSession({ email: "admin@example.com", exp: Date.now() + 60_000 }, secret);
  const expired = signTestSession({ email: "admin@example.com", exp: Date.now() - 1 }, secret);

  assert.ok(active);
  assert.equal(verifyTestSession(active, secret)?.email, "admin@example.com");
  assert.equal(verifyTestSession(`${active}x`, secret), null);
  assert.equal(verifyTestSession(expired, secret), null);
});

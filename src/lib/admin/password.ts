import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

function safeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyScryptPassword(password: string, encoded: string): boolean {
  const [, saltHex, hashHex] = encoded.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length || SCRYPT_KEY_LENGTH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createAdminPasswordHash(password: string, salt = randomBytes(16)): string {
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Verify against ADMIN_PASSWORD_HASH (`scrypt:<saltHex>:<hashHex>`) or dev fallback ADMIN_PASSWORD. */
export function verifyAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyScryptPassword(password, hash);

  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  return safeEqualString(password, configured);
}

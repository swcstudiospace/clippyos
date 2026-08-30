/**
 * Envelope encryption + timing-safe compares for operator secrets (SC-13, SC-28).
 * Ciphertext format: enc:v1:<iv>.<tag>.<ciphertext> (base64url, AES-256-GCM).
 * Plaintext already in the store is returned as-is so existing rows migrate on write.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const SECRET_ENVELOPE_PREFIX = "enc:v1:";

export function secretsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    const dummy = a.length ? a : Buffer.from([0]);
    timingSafeEqual(dummy, dummy);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function bearerSecretEqual(authorizationHeader: string, secret: string): boolean {
  return secretsEqual(authorizationHeader, `Bearer ${secret}`);
}

export function envelopeKeyBytes(
  env: Record<string, string | undefined> = process.env,
): Buffer | null {
  const raw = (env.OPERATOR_SECRETS_KEY || env.BETTER_AUTH_SECRET || "").trim();
  if (raw.length < 16) return null;
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(
  plaintext: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const key = envelopeKeyBytes(env);
  if (!key) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SECRET_ENVELOPE_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(
  stored: string,
  env: Record<string, string | undefined> = process.env,
): string {
  if (!stored.startsWith(SECRET_ENVELOPE_PREFIX)) return stored;
  const key = envelopeKeyBytes(env);
  if (!key) throw new Error("SECRETS_KEY_MISSING");
  const packed = stored.slice(SECRET_ENVELOPE_PREFIX.length);
  const [ivB64, tagB64, ctB64] = packed.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("SECRETS_ENVELOPE_INVALID");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}

export function looksEncryptedSecret(value: string): boolean {
  return value.startsWith(SECRET_ENVELOPE_PREFIX);
}

/** Workspace/operator keys that must be enveloped. JSON blobs and timestamps stay plaintext. */
export function isEncryptedSettingKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  if (/_(JSON|AT|STATE|URL|PATH|DAYS|MS|HEX)$/i.test(k)) return false;
  return /(?:^|_)(SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE_KEY)(?:_|$)/i.test(k);
}

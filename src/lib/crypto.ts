import crypto from "crypto";

const PREFIX = "enc:";

function keyFromEnv() {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) {
    return null;
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const key = keyFromEnv();
  if (!key) {
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX.slice(0, -1),
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const key = keyFromEnv();
  if (!key) {
    throw new Error("APP_ENCRYPTION_KEY is required to decrypt stored tokens.");
  }

  const [, ivPart, tagPart, encryptedPart] = value.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

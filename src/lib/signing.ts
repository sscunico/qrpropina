import crypto from "crypto";

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.APP_ENCRYPTION_KEY ||
    "qrpropina-local-session-secret"
  );
}

function signature(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function signJson(value: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function verifySignedJson<T extends Record<string, unknown>>(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [body, signed] = token.split(".");
  if (!body || !signed) {
    return null;
  }

  const expected = signature(body);
  const expectedBuffer = Buffer.from(expected);
  const signedBuffer = Buffer.from(signed);

  if (
    expectedBuffer.length !== signedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

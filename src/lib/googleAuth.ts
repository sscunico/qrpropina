import crypto from "crypto";
import { appUrl } from "@/lib/env";
import { safeNext } from "@/lib/auth";
import { signJson, verifySignedJson } from "@/lib/signing";

export const GOOGLE_OAUTH_STATE_COOKIE = "qrpropina_google_oauth_state";

type GoogleState = {
  nonce: string;
  next: string;
  exp: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type ValidGoogleTokenResponse = GoogleTokenResponse & {
  access_token: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export function googleOAuthIsConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return `${appUrl()}/api/auth/google/callback`;
}

export function createGoogleOAuthState(nextValue: string | null) {
  const next = safeNext(nextValue);
  const state = signJson({
    nonce: crypto.randomUUID(),
    next,
    exp: Date.now() + 10 * 60 * 1000
  });

  return { state, next };
}

export function readGoogleOAuthState(state: string | null, storedState: string | undefined | null) {
  if (!state || !storedState || state !== storedState) {
    return null;
  }

  const parsed = verifySignedJson<GoogleState>(state);
  if (!parsed || typeof parsed.next !== "string" || typeof parsed.exp !== "number") {
    return null;
  }

  if (parsed.exp < Date.now()) {
    return null;
  }

  return parsed;
}

export function googleAuthorizationUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("include_granted_scopes", "true");

  return url.toString();
}

export function googleAllowedEmails() {
  return (process.env.ADMIN_GOOGLE_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function exchangeGoogleCode(code: string): Promise<ValidGoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are missing.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code"
    })
  });

  const data = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google token exchange failed.");
  }

  return data as ValidGoogleTokenResponse;
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("Google userinfo lookup failed.");
  }

  return response.json() as Promise<GoogleUserInfo>;
}

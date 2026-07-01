import crypto from "crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { addPaymentEvent, updateCreatorMpTokensRecord, type Creator, type Tip } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  appUrl,
  isDemoCheckoutEnabled,
  mercadoLibreApiBaseUrl,
  mercadoPagoApiBaseUrl,
  mercadoPagoAuthBaseUrl,
  useSandboxLink
} from "@/lib/env";
import { centsToPesos } from "@/lib/money";
import { signJson, verifySignedJson } from "@/lib/signing";

type PreferenceBody = Parameters<Preference["create"]>[0]["body"];

type CreatePreferenceInput = {
  creator: Creator;
  tip: Tip;
  commissionPercent: number;
  payerEmail?: string | null;
};

type MercadoPagoOAuthState = {
  creatorId: string;
  nonce: string;
  exp: number;
};

type MercadoPagoOAuthCookie = {
  state: string;
  codeVerifier?: string | null;
  exp: number;
};

export type MercadoPagoAccount = {
  userId: string | null;
  nickname: string | null;
  email: string | null;
  siteId: string | null;
  firstName: string | null;
  lastName: string | null;
  countryId: string | null;
  permalink: string | null;
};

const OAUTH_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // renueva si vence en menos de 14 días

export const MERCADOPAGO_OAUTH_COOKIE = "qrpropina_mp_oauth";

function createMercadoPagoSdkClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000
    }
  });
}

function isPublicHttpsUrl(value: string) {
  return value.startsWith("https://");
}

export function getCreatorAccessToken(creator: Creator) {
  return decryptSecret(creator.mpAccessToken) || process.env.MERCADOPAGO_ACCESS_TOKEN || null;
}

export function sellerIsConnected(creator: Creator) {
  return Boolean(creator.mpAccessToken && creator.mpUserId);
}

export async function createMercadoPagoPreference({
  creator,
  tip,
  commissionPercent,
  payerEmail
}: CreatePreferenceInput) {
  if (isDemoCheckoutEnabled()) {
    const demoUrl = `${appUrl()}/pago/demo?tipId=${tip.id}`;
    void addPaymentEvent({
      tipId: tip.id,
      eventType: "mp.demo.checkout",
      payload: JSON.stringify({
        mode: "demo",
        note: "MP_ENABLE_DEMO_CHECKOUT=true — no se llamó a la API real",
        checkoutUrl: demoUrl,
        amountCents: tip.amountCents,
        platformFeeCents: tip.platformFeeCents,
        commissionPercent
      })
    }).catch(() => {});

    return {
      preferenceId: `demo-${tip.id}`,
      checkoutUrl: demoUrl
    };
  }

  if (!sellerIsConnected(creator)) {
    throw new Error("El creador debe conectar su cuenta de Mercado Pago antes de recibir propinas reales.");
  }

  let accessToken = decryptSecret(creator.mpAccessToken);
  if (!accessToken) {
    throw new Error("No se pudo leer el token de Mercado Pago del creador. Reconectá la cuenta.");
  }

  // Auto-refresh si el token vence en menos de 14 días
  if (creator.mpTokenExpiresAt) {
    const expiresAt = new Date(creator.mpTokenExpiresAt).getTime();
    if (expiresAt - Date.now() < TOKEN_REFRESH_THRESHOLD_MS) {
      try {
        const refreshed = await refreshCreatorOAuthToken(creator.mpRefreshToken);
        await updateCreatorMpTokensRecord(creator.id, refreshed);
        accessToken = refreshed.rawAccessToken;
      } catch {
        // Si falla el refresh, continúa con el token existente
      }
    }
  }

  const usingPlatformToken = false;

  const baseUrl = appUrl();
  const body: PreferenceBody = {
    items: [
      {
        id: creator.id,
        title: `Propina para ${creator.displayName}`,
        description: creator.locationName || creator.role || "Propina",
        quantity: 1,
        currency_id: tip.currency,
        unit_price: centsToPesos(tip.amountCents)
      }
    ],
    external_reference: tip.externalReference,
    metadata: {
      tip_id: tip.id,
      creator_id: creator.id,
      creator_mp_alias: creator.mpAlias || "",
      creator_mp_user_id: creator.mpUserId || "",
      commission_percent: commissionPercent,
      marketplace_fee_cents: tip.platformFeeCents
    }
  };

  if (isPublicHttpsUrl(baseUrl)) {
    body.back_urls = {
      success: `${baseUrl}/pago/exito?tipId=${tip.id}`,
      pending: `${baseUrl}/pago/pendiente?tipId=${tip.id}`,
      failure: `${baseUrl}/pago/error?tipId=${tip.id}`
    };
    body.auto_return = "approved";
    body.notification_url = `${baseUrl}/api/mercadopago/webhook?tipId=${tip.id}`;
  }

  if (payerEmail) {
    body.payer = { email: payerEmail };
  }

  if (tip.platformFeeCents > 0) {
    body.marketplace_fee = centsToPesos(tip.platformFeeCents);
  }

  // Restringe el pago a usuarios con cuenta MP (compatible con Split 1:1)
  body.purpose = "wallet_purchase";

  const mpPreferenceUrl = `${mercadoPagoApiBaseUrl()}/checkout/preferences`;

  const request = {
    url: mpPreferenceUrl,
    method: "POST",
    tokenSource: usingPlatformToken ? "platform (MERCADOPAGO_ACCESS_TOKEN)" : "creator OAuth",
    body
  };

  const client = createMercadoPagoSdkClient(accessToken);
  const preferenceClient = new Preference(client);
  let preference: Awaited<ReturnType<typeof preferenceClient.create>>;
  try {
    preference = await preferenceClient.create({ body });
  } catch (err) {
    void addPaymentEvent({
      tipId: tip.id,
      eventType: "mp.preference.error",
      payload: JSON.stringify({ request, response: { error: String(err) } })
    }).catch(() => {});
    throw err;
  }

  const checkoutUrl =
    useSandboxLink() && preference.sandbox_init_point
      ? preference.sandbox_init_point
      : preference.init_point || preference.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago did not return a checkout URL.");
  }

  if (!preference.id) {
    throw new Error("Mercado Pago did not return a preference ID.");
  }

  void addPaymentEvent({
    tipId: tip.id,
    eventType: "mp.preference",
    payload: JSON.stringify({
      request,
      response: {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        checkoutUrl
      }
    })
  }).catch(() => {});

  return {
    preferenceId: preference.id,
    checkoutUrl
  };
}

export function buildOAuthUrl(creatorId: string) {
  return buildOAuthRequest(creatorId).url;
}

function base64UrlSha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

function createCodeVerifier() {
  return crypto.randomBytes(64).toString("base64url");
}

function useMercadoPagoPkce() {
  return process.env.MERCADOPAGO_OAUTH_USE_PKCE === "true";
}

function cleanEnv(value: string | undefined) {
  return value?.trim() || "";
}

function mercadoPagoOAuthCredentials() {
  const clientId = cleanEnv(process.env.MERCADOPAGO_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.MERCADOPAGO_CLIENT_SECRET);
  const missing = [
    !clientId ? "MERCADOPAGO_CLIENT_ID" : null,
    !clientSecret ? "MERCADOPAGO_CLIENT_SECRET" : null
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Falta configurar ${missing.join(" y ")} para conectar Mercado Pago por OAuth.`);
  }

  return { clientId, clientSecret };
}

export function buildOAuthRequest(creatorId: string) {
  const { clientId } = mercadoPagoOAuthCredentials();
  const redirectUri = `${appUrl()}/api/mercadopago/oauth/callback`;
  const usePkce = useMercadoPagoPkce();
  const codeVerifier = usePkce ? createCodeVerifier() : null;
  const state = signJson({
    creatorId,
    nonce: crypto.randomUUID(),
    exp: Date.now() + OAUTH_TTL_MS
  });
  const url = new URL("/authorization", mercadoPagoAuthBaseUrl());
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  if (codeVerifier) {
    url.searchParams.set("code_challenge", base64UrlSha256(codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");
  }

  return {
    url: url.toString(),
    state,
    codeVerifier
  };
}

export function createOAuthCookieValue(input: { state: string; codeVerifier?: string | null }) {
  return signJson({
    state: input.state,
    codeVerifier: input.codeVerifier || null,
    exp: Date.now() + OAUTH_TTL_MS
  });
}

function parseOAuthCookie(value: string | undefined | null) {
  const parsed = verifySignedJson<MercadoPagoOAuthCookie>(value);
  if (
    !parsed ||
    typeof parsed.state !== "string" ||
    (typeof parsed.codeVerifier !== "string" && parsed.codeVerifier !== null && parsed.codeVerifier !== undefined) ||
    typeof parsed.exp !== "number" ||
    parsed.exp < Date.now()
  ) {
    return null;
  }

  return parsed;
}

export async function refreshCreatorOAuthToken(refreshTokenEncrypted: string | null) {
  const refreshToken = decryptSecret(refreshTokenEncrypted);
  if (!refreshToken) {
    throw new Error("No hay refresh token disponible. El creador debe volver a conectar su cuenta de Mercado Pago.");
  }

  const { clientId, clientSecret } = mercadoPagoOAuthCredentials();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await fetch(`${mercadoPagoApiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudo renovar el token de Mercado Pago (${response.status}): ${message}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null;

  return {
    accessToken: encryptSecret(data.access_token),
    refreshToken: encryptSecret(data.refresh_token),
    rawAccessToken: data.access_token,
    expiresAt
  };
}

export async function exchangeOAuthCode(code: string, codeVerifier?: string | null) {
  const { clientId, clientSecret } = mercadoPagoOAuthCredentials();
  const redirectUri = `${appUrl()}/api/mercadopago/oauth/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const response = await fetch(`${mercadoPagoApiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Mercado Pago rechazó la conexión OAuth (${response.status}). Revisá que el Redirect URL configurado en Mercado Pago sea ${redirectUri}. Detalle: ${message}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    user_id?: number | string;
    expires_in?: number;
  };

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : null;
  const account = await getMercadoPagoAccount(data.access_token, data.user_id?.toString() || null);

  return {
    accessToken: encryptSecret(data.access_token),
    refreshToken: encryptSecret(data.refresh_token),
    userId: data.user_id?.toString() || null,
    expiresAt,
    account
  };
}

async function getMercadoPagoAccount(accessToken: string, fallbackUserId: string | null): Promise<MercadoPagoAccount | null> {
  const response = await fetch(`${mercadoLibreApiBaseUrl()}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`No se pudieron leer los datos de Mercado Pago ${response.status}: ${message}`);
  }

  const data = (await response.json()) as {
    id?: number | string;
    nickname?: string;
    email?: string;
    site_id?: string;
    first_name?: string;
    last_name?: string;
    country_id?: string;
    permalink?: string;
  };

  return {
    userId: data.id?.toString() || fallbackUserId,
    nickname: data.nickname || null,
    email: data.email || null,
    siteId: data.site_id || null,
    firstName: data.first_name || null,
    lastName: data.last_name || null,
    countryId: data.country_id || null,
    permalink: data.permalink || null
  };
}

export function parseOAuthState(state: string | null, storedCookie?: string | null) {
  if (!state) {
    throw new Error("Missing OAuth state.");
  }

  const cookie = parseOAuthCookie(storedCookie);
  if (!cookie || cookie.state !== state) {
    throw new Error("Invalid OAuth state.");
  }

  const parsed = verifySignedJson<MercadoPagoOAuthState>(state);
  if (
    !parsed ||
    typeof parsed.creatorId !== "string" ||
    typeof parsed.exp !== "number" ||
    parsed.exp < Date.now()
  ) {
    throw new Error("Invalid OAuth state.");
  }

  return {
    creatorId: parsed.creatorId,
    codeVerifier: cookie.codeVerifier
  };
}

export function verifyWebhookSignature(input: {
  dataId?: string | null;
  requestId?: string | null;
  signature?: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  if (!input.signature) {
    return false;
  }

  const signatureParts = Object.fromEntries(
    input.signature.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key.trim(), value?.trim()];
    })
  );

  const ts = signatureParts.ts;
  const v1 = signatureParts.v1;
  if (!ts || !v1) {
    return false;
  }

  let template = "";
  if (input.dataId) {
    template += `id:${input.dataId};`;
  }
  if (input.requestId) {
    template += `request-id:${input.requestId};`;
  }
  template += `ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(template).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(v1);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

const MP_IVA_RATE = 0.21;

// Tasas MP Argentina — Checkout Pro según plazo elegido por el creador en su cuenta
export const MP_FEE_RATES = {
  instant: 0.0629,   // Al instante
  days10:  0.0439,   // 10 días
  days18:  0.0339,   // 18 días
  days35:  0.0149,   // 35 días (default)
} as const;

export type MpReleaseSchedule = keyof typeof MP_FEE_RATES;

export function calcMpFeeBreakdown(
  amountCents: number,
  platformFeeCents: number,
  releaseSchedule: MpReleaseSchedule = "days35"
) {
  const mpRate = MP_FEE_RATES[releaseSchedule];
  const mpFeeCents = Math.round(amountCents * mpRate * (1 + MP_IVA_RATE));
  const creatorReceivesCents = Math.max(0, amountCents - mpFeeCents - platformFeeCents);
  return {
    totalCents: amountCents,
    mpFeeCents,
    appFeeCents: platformFeeCents,
    creatorReceivesCents,
    releaseSchedule
  };
}

export type MpPaymentData = {
  netReceivedAmountCents: number | null;
  totalPaidAmountCents: number | null;
  marketplaceFeeCents: number | null;
  moneyReleaseDate: string | null;
  collectorId: string | null;
  payerId: string | null;
};

export function parseMpPaymentData(rawPayment: string | null): MpPaymentData {
  const empty: MpPaymentData = {
    netReceivedAmountCents: null,
    totalPaidAmountCents: null,
    marketplaceFeeCents: null,
    moneyReleaseDate: null,
    collectorId: null,
    payerId: null
  };
  if (!rawPayment) return empty;
  try {
    const payment = JSON.parse(rawPayment) as Record<string, unknown>;
    const details = payment.transaction_details as Record<string, unknown> | undefined;
    const payer = payment.payer as Record<string, unknown> | undefined;
    const net = details?.net_received_amount;
    const total = details?.total_paid_amount;
    const mpFee = payment.marketplace_fee ?? payment.application_fee;
    const releaseDate = payment.money_release_date;
    return {
      netReceivedAmountCents: typeof net === "number" ? Math.round(net * 100) : null,
      totalPaidAmountCents: typeof total === "number" ? Math.round(total * 100) : null,
      marketplaceFeeCents: typeof mpFee === "number" ? Math.round(mpFee * 100) : null,
      moneyReleaseDate: typeof releaseDate === "string" ? releaseDate : null,
      collectorId: payment.collector_id != null ? String(payment.collector_id) : null,
      payerId: payer?.id != null ? String(payer.id) : null
    };
  } catch {
    return empty;
  }
}

export async function getPayment(paymentId: string, accessToken: string) {
  const client = createMercadoPagoSdkClient(accessToken);
  const paymentClient = new Payment(client);
  return paymentClient.get({ id: paymentId }) as Promise<{
    id: number | string;
    status: string;
    external_reference?: string;
  }>;
}

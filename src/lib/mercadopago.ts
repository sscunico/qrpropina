import crypto from "crypto";
import type { Recipient, Tip } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  appUrl,
  isDemoCheckoutEnabled,
  mercadoPagoApiBaseUrl,
  mercadoPagoAuthBaseUrl,
  useSandboxLink
} from "@/lib/env";
import { centsToPesos } from "@/lib/money";

type PreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type CreatePreferenceInput = {
  recipient: Recipient;
  tip: Tip;
  payerEmail?: string | null;
};

export function getRecipientAccessToken(recipient: Recipient) {
  return decryptSecret(recipient.mpAccessToken) || process.env.MERCADOPAGO_ACCESS_TOKEN || null;
}

export function sellerIsConnected(recipient: Recipient) {
  return Boolean(recipient.mpAccessToken && recipient.mpUserId);
}

export async function createMercadoPagoPreference({
  recipient,
  tip,
  payerEmail
}: CreatePreferenceInput) {
  const accessToken = getRecipientAccessToken(recipient);

  if (!accessToken) {
    if (isDemoCheckoutEnabled()) {
      return {
        preferenceId: `demo-${tip.id}`,
        checkoutUrl: `${appUrl()}/pago/demo?tipId=${tip.id}`
      };
    }

    throw new Error("Missing Mercado Pago access token.");
  }

  const baseUrl = appUrl();
  const body: Record<string, unknown> = {
    items: [
      {
        id: recipient.id,
        title: `Propina para ${recipient.displayName}`,
        description: recipient.locationName || recipient.role || "Propina",
        quantity: 1,
        currency_id: tip.currency,
        unit_price: centsToPesos(tip.amountCents)
      }
    ],
    external_reference: tip.externalReference,
    metadata: {
      tip_id: tip.id,
      recipient_id: recipient.id,
      commission_percent: recipient.commissionPercent
    },
    back_urls: {
      success: `${baseUrl}/pago/exito?tipId=${tip.id}`,
      pending: `${baseUrl}/pago/pendiente?tipId=${tip.id}`,
      failure: `${baseUrl}/pago/error?tipId=${tip.id}`
    },
    auto_return: "approved"
  };

  if (payerEmail) {
    body.payer = { email: payerEmail };
  }

  if (baseUrl.startsWith("https://")) {
    body.notification_url = `${baseUrl}/api/mercadopago/webhook?tipId=${tip.id}`;
  }

  if (sellerIsConnected(recipient) && tip.platformFeeCents > 0) {
    body.marketplace_fee = centsToPesos(tip.platformFeeCents);
  }

  const response = await fetch(`${mercadoPagoApiBaseUrl()}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mercado Pago error ${response.status}: ${message}`);
  }

  const preference = (await response.json()) as PreferenceResponse;
  const checkoutUrl =
    useSandboxLink() && preference.sandbox_init_point
      ? preference.sandbox_init_point
      : preference.init_point || preference.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago did not return a checkout URL.");
  }

  return {
    preferenceId: preference.id,
    checkoutUrl
  };
}

export function buildOAuthUrl(recipientId: string) {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) {
    throw new Error("MERCADOPAGO_CLIENT_ID is missing.");
  }

  const redirectUri = `${appUrl()}/api/mercadopago/oauth/callback`;
  const state = Buffer.from(JSON.stringify({ recipientId })).toString("base64url");
  const url = new URL("/authorization", mercadoPagoAuthBaseUrl());
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeOAuthCode(code: string) {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Mercado Pago OAuth credentials are missing.");
  }

  const redirectUri = `${appUrl()}/api/mercadopago/oauth/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });

  const response = await fetch(`${mercadoPagoApiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OAuth token exchange failed ${response.status}: ${message}`);
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

  return {
    accessToken: encryptSecret(data.access_token),
    refreshToken: encryptSecret(data.refresh_token),
    userId: data.user_id?.toString() || null,
    expiresAt
  };
}

export function parseOAuthState(state: string | null) {
  if (!state) {
    throw new Error("Missing OAuth state.");
  }

  const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    recipientId?: string;
  };

  if (!parsed.recipientId) {
    throw new Error("Invalid OAuth state.");
  }

  return { recipientId: parsed.recipientId };
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
      const [key, value] = part.split("=");
      return [key, value];
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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function getPayment(paymentId: string, accessToken: string) {
  const response = await fetch(`${mercadoPagoApiBaseUrl()}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Payment lookup failed ${response.status}: ${message}`);
  }

  return response.json() as Promise<{
    id: number | string;
    status: string;
    external_reference?: string;
  }>;
}

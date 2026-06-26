import { NextResponse } from "next/server";
import { addPaymentEvent, createNotificationRecord, getTipWithCreator, updateTipFromPayment } from "@/lib/db";
import { getCreatorAccessToken, getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { centsToPesos } from "@/lib/money";

type MercadoPagoWebhookPayload = {
  action?: string;
  data?: {
    id?: string | number;
  };
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

function asString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  return null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const signatureDataId = url.searchParams.get("data.id");
  const queryPaymentId = signatureDataId || url.searchParams.get("id");
  const queryType = url.searchParams.get("type");
  const queryTopic = url.searchParams.get("topic");
  const tipId = url.searchParams.get("tipId");
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature({ dataId: signatureDataId, requestId, signature })) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as MercadoPagoWebhookPayload;
  const payloadType = asString(payload.type);
  const action = asString(payload.action);
  const paymentId = queryPaymentId || asString(payload.data?.id) || asString(payload.id);
  const eventType = [queryType || queryTopic || payloadType, action]
    .filter(Boolean)
    .join(":") || "unknown";

  await addPaymentEvent({
    tipId,
    eventType,
    payload: JSON.stringify({
      query: Object.fromEntries(url.searchParams),
      requestId,
      payload
    })
  });

  const isPaymentEvent =
    queryType === "payment" ||
    queryTopic === "payment" ||
    payloadType === "payment" ||
    action?.startsWith("payment.");

  if (!isPaymentEvent) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!paymentId) {
    return NextResponse.json({ ok: true, warning: "Missing payment id." });
  }

  const tip = tipId ? await getTipWithCreator(tipId) : null;
  const accessToken = tip ? getCreatorAccessToken(tip.creator) : process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ ok: true, warning: "Missing access token for payment lookup." });
  }

  try {
    const payment = await getPayment(paymentId, accessToken);
    const externalReference = payment.external_reference;

    const updatedTip = await updateTipFromPayment({
      tipId: tip?.id,
      externalReference,
      paymentId: payment.id.toString(),
      status: payment.status,
      rawPayment: JSON.stringify(payment)
    });

    if (updatedTip && payment.status === "approved") {
      const amount = centsToPesos(updatedTip.amountCents - updatedTip.platformFeeCents);
      void createNotificationRecord({
        creatorId: updatedTip.creatorId,
        title: "¡Recibiste una propina!",
        body: `Te acreditaron $${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} en tu cuenta de Mercado Pago.`
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id.toString(),
      status: payment.status,
      tipUpdated: Boolean(updatedTip)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment lookup failed.";

    await addPaymentEvent({
      tipId,
      eventType: "payment.lookup_failed",
      payload: JSON.stringify({
        paymentId,
        message
      })
    });

    if (!tipId) {
      return NextResponse.json({ ok: true, warning: message });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

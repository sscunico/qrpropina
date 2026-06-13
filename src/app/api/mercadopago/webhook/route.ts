import { NextResponse } from "next/server";
import { addPaymentEvent, getTipWithRecipient, updateTipFromPayment } from "@/lib/db";
import { getPayment, getRecipientAccessToken, verifyWebhookSignature } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");
  const tipId = url.searchParams.get("tipId");
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature({ dataId, requestId, signature })) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const paymentId = dataId || payload?.data?.id?.toString();

  await addPaymentEvent({
    tipId,
    eventType: payload?.type || payload?.action || "unknown",
    payload: JSON.stringify(payload)
  });

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  const tip = tipId ? await getTipWithRecipient(tipId) : null;

  const accessToken = tip ? getRecipientAccessToken(tip.recipient) : process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ ok: true, warning: "Missing access token for payment lookup." });
  }

  const payment = await getPayment(paymentId, accessToken);
  const externalReference = payment.external_reference;

  await updateTipFromPayment({
    tipId: tip?.id,
    externalReference,
    paymentId: payment.id.toString(),
    status: payment.status,
    rawPayment: JSON.stringify(payment)
  });

  return NextResponse.json({ ok: true });
}

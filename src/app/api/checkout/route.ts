import { NextResponse } from "next/server";
import { z } from "zod";
import { createTipRecord, getRecipientBySlug, updateTipRecord } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import { calculateFeeCents, pesosToCents } from "@/lib/money";

const checkoutSchema = z.object({
  slug: z.string().min(2),
  amount: z.coerce.number().min(100).max(100000),
  payerEmail: z.string().email().nullable().optional()
});

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const recipient = await getRecipientBySlug(input.slug);

    if (!recipient || !recipient.isActive) {
      return NextResponse.json({ error: "El receptor no esta disponible." }, { status: 404 });
    }

    const amountCents = pesosToCents(input.amount);
    const platformFeeCents = calculateFeeCents(amountCents, recipient.commissionPercent);

    const tip = await createTipRecord({
      recipientId: recipient.id,
      amountCents,
      platformFeeCents,
      payerEmail: input.payerEmail || null,
      externalReference: crypto.randomUUID()
    });

    const preference = await createMercadoPagoPreference({
      recipient,
      tip,
      payerEmail: input.payerEmail
    });

    const updatedTip = await updateTipRecord(tip.id, {
      preferenceId: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl,
      status: preference.preferenceId.startsWith("demo-") ? "demo_created" : "preference_created"
    });

    return NextResponse.json({
      tipId: updatedTip.id,
      checkoutUrl: preference.checkoutUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pago.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

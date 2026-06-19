import { NextResponse } from "next/server";
import { z } from "zod";
import { createTipRecord, getCreatorBySlug, updateTipRecord } from "@/lib/db";
import { isDemoCheckoutEnabled, platformCommissionPercent } from "@/lib/env";
import { createMercadoPagoPreference, sellerIsConnected } from "@/lib/mercadopago";
import { calculateFeeCents, pesosToCents } from "@/lib/money";

const checkoutSchema = z.object({
  slug: z.string().min(2),
  amount: z.coerce.number().min(100).max(100000),
  payerEmail: z.string().email().nullable().optional()
});

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const creator = await getCreatorBySlug(input.slug);

    if (!creator || !creator.isActive) {
      return NextResponse.json({ error: "El creador no está disponible." }, { status: 404 });
    }

    const hasPlatformToken = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
    if (!isDemoCheckoutEnabled() && !sellerIsConnected(creator) && !hasPlatformToken) {
      return NextResponse.json(
        {
          error:
            "Este creador todavía no conectó Mercado Pago. No se puede cobrar una propina real."
        },
        { status: 409 }
      );
    }

    const amountCents = pesosToCents(input.amount);
    const commissionPercent = platformCommissionPercent();
    const platformFeeCents = calculateFeeCents(amountCents, commissionPercent);

    const tip = await createTipRecord({
      creatorId: creator.id,
      amountCents,
      platformFeeCents,
      payerEmail: input.payerEmail || null,
      externalReference: crypto.randomUUID()
    });

    const preference = await createMercadoPagoPreference({
      creator,
      tip,
      commissionPercent,
      payerEmail: input.payerEmail
    });

    const updatedTip = await updateTipRecord(tip.id, {
      preferenceId: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl,
      status: preference.preferenceId.startsWith("demo-") ? "demo_created" : "preference_created"
    });

    return NextResponse.json({
      tipId: updatedTip.id,
      preferenceId: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pago.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

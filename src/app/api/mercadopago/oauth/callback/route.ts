import { NextResponse } from "next/server";
import { connectRecipientMercadoPago } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { exchangeOAuthCode, parseOAuthState } from "@/lib/mercadopago";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing OAuth code." }, { status: 400 });
  }

  try {
    const { recipientId } = parseOAuthState(state);
    const tokens = await exchangeOAuthCode(code);

    await connectRecipientMercadoPago(recipientId, {
      userId: tokens.userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    });

    return NextResponse.redirect(new URL(`/admin/receptores/${recipientId}`, appUrl()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

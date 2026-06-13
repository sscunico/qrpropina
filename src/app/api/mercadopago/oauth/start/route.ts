import { NextResponse } from "next/server";
import { getRecipientWithTips } from "@/lib/db";
import { buildOAuthUrl } from "@/lib/mercadopago";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");

  if (!recipientId) {
    return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
  }

  const recipient = await getRecipientWithTips(recipientId, 0);

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  }

  try {
    return NextResponse.redirect(buildOAuthUrl(recipient.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth is not configured.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

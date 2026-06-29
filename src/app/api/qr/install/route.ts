import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getQrCodeByQrId } from "@/lib/db";
import { appUrl } from "@/lib/env";

export async function GET(request: Request) {
  const home = new URL("/", appUrl());
  const url = new URL(request.url);
  const qrId = url.searchParams.get("qrId");

  if (!qrId) return NextResponse.redirect(home);

  const qrCode = await getQrCodeByQrId(qrId);
  if (qrCode?.isAutoInstallable && qrCode.creatorId === null) {
    const cookieStore = await cookies();
    cookieStore.set("qr_pending_install", qrId, {
      httpOnly: true,
      maxAge: 30 * 60,
      path: "/",
      sameSite: "lax",
    });
  }

  return NextResponse.redirect(home);
}

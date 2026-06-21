import { NextResponse } from "next/server";
import { signOutAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/env";

export async function POST(_request: Request) {
  await signOutAdmin();

  return NextResponse.redirect(new URL("/", appUrl()), {
    status: 303
  });
}

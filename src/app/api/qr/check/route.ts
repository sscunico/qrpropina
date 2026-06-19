import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkQrIdAvailability } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const except = searchParams.get("except");
  const result = await checkQrIdAvailability(id, except);

  return NextResponse.json(result);
}

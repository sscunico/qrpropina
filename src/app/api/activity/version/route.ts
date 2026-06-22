import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getActivityVersionForSession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ version: null }, { status: 401 });
  }

  const version = await getActivityVersionForSession({
    role: session.role,
    creatorId: session.creatorId
  });

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}

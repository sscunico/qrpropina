import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteCreatorRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (session?.role !== "admin") {
    return NextResponse.redirect(new URL("/login?next=/admin/creadores", request.url));
  }

  const formData = await request.formData();
  const creatorId = formData.get("creatorId");

  if (typeof creatorId === "string" && creatorId) {
    await deleteCreatorRecord(creatorId);
    revalidatePath("/admin");
    revalidatePath("/admin/creadores");
  }

  return NextResponse.redirect(new URL("/admin/creadores", request.url));
}

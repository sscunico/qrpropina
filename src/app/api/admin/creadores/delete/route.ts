import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteCreatorRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

function safeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin/creadores";
  }

  return value;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (session?.role !== "admin") {
    return NextResponse.redirect(new URL("/login?next=/admin/creadores", request.url));
  }

  const formData = await request.formData();
  const creatorId = formData.get("creatorId");
  const next = safeRedirectPath(formData.get("next"));

  if (typeof creatorId === "string" && creatorId) {
    await deleteCreatorRecord(creatorId);
    revalidatePath("/admin");
    revalidatePath("/admin/creadores");
  }

  return NextResponse.redirect(new URL(next, request.url));
}

"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { softDeleteNotificationRecord, markNotificationsReadForCreator } from "@/lib/db";

export async function deleteNotificationAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session?.creatorId) throw new Error("No autorizado.");

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID requerido.");

  await softDeleteNotificationRecord(id, session.creatorId);
  revalidatePath("/admin/notificaciones");
}

export async function markNotificationsReadAction() {
  const session = await getAdminSession();
  if (!session?.creatorId) return;

  await markNotificationsReadForCreator(session.creatorId);
  revalidatePath("/admin/notificaciones");
}

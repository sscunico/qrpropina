"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { ADMIN_NOTIFICATIONS_ID, softDeleteNotificationRecord, markNotificationsReadForCreator } from "@/lib/db";

export async function deleteNotificationAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado.");

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID requerido.");

  const targetId = session.role === "admin"
    ? ADMIN_NOTIFICATIONS_ID
    : session.creatorId ?? null;

  if (!targetId) throw new Error("No autorizado.");

  await softDeleteNotificationRecord(id, targetId);
  revalidatePath("/admin/notificaciones");
}

export async function markNotificationsReadAction() {
  const session = await getAdminSession();
  if (!session) return;

  const targetId = session.role === "admin"
    ? ADMIN_NOTIFICATIONS_ID
    : session.creatorId ?? null;

  if (!targetId) return;

  await markNotificationsReadForCreator(targetId);
  revalidatePath("/admin/notificaciones");
}

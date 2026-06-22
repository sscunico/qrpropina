"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import {
  ADMIN_NOTIFICATIONS_ID,
  createCreatorRecord,
  createNotificationRecord,
  createQrCodeRecord,
  deleteCreatorRecord,
  deleteQrCodeRecord,
  disconnectCreatorMercadoPagoRecord,
  getAppSettings,
  getCreatorWithTips,
  setColorOverrides,
  setCreatorActive,
  setMercadoPagoIntegrationVisible,
  setTransferDiscountPercentValue,
  updateCreatorMercadoPagoAliasRecord,
  updateCreatorProfileRecord,
  updateCreatorRecord,
  updateQrCodeRecord
} from "@/lib/db";
import { qrDataUrl } from "@/lib/qrcode";
import { appUrl } from "@/lib/env";

const creatorSchema = z.object({
  displayName: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  role: z.string().trim().optional(),
  locationName: z.string().trim().optional(),
  commissionPercent: z.coerce.number().min(0).max(40)
});

const creatorProfileSchema = creatorSchema.omit({ commissionPercent: true });

const qrSchema = z.object({
  qrId: z
    .string()
    .trim()
    .min(1, "El ID es obligatorio.")
    .max(64)
    .regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/, "Solo letras, números y guiones.")
});

const mercadoPagoAliasSchema = z.object({
  mpAlias: z.string().trim().min(1)
});

const transferDiscountSchema = z.object({
  transferDiscountPercent: z.coerce.number().min(0).max(40)
});

async function requireQrAccess(creatorId: string) {
  const session = await requireUser();
  if (session.role === "admin") {
    return session;
  }

  if (session.role === "creator" && session.creatorId === creatorId) {
    return session;
  }

  redirect("/admin");
}

export async function createCreator(formData: FormData) {
  await requireAdmin();

  const parsed = creatorSchema.parse(Object.fromEntries(formData));

  const creator = await createCreatorRecord({
    displayName: parsed.displayName,
    slug: parsed.slug,
    role: parsed.role || null,
    locationName: parsed.locationName || null,
    commissionPercent: parsed.commissionPercent
  });

  revalidatePath("/admin");
  redirect(`/admin/creadores/${creator.id}`);
}

export async function updateCreator(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = creatorSchema.parse(Object.fromEntries(formData));

  await updateCreatorRecord(id, {
    displayName: parsed.displayName,
    slug: parsed.slug,
    role: parsed.role || null,
    locationName: parsed.locationName || null,
    commissionPercent: parsed.commissionPercent
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/creadores/${id}`);
}

export async function deleteCreator(id: string) {
  await requireAdmin();

  await deleteCreatorRecord(id);

  revalidatePath("/admin");
  revalidatePath("/admin/creadores");
}

export async function updateCreatorProfile(id: string, formData: FormData) {
  const session = await requireUser();
  if (session.role !== "admin" && session.creatorId !== id) {
    redirect("/admin");
  }

  try {
    const parsed = creatorProfileSchema.parse(Object.fromEntries(formData));
    await updateCreatorProfileRecord(id, {
      displayName: parsed.displayName,
      slug: parsed.slug,
      role: parsed.role || null,
      locationName: parsed.locationName || null
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    return;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/creadores/${id}`);
}

export async function toggleCreator(id: string, isActive: boolean) {
  await requireAdmin();

  await setCreatorActive(id, isActive);

  revalidatePath("/admin");
  revalidatePath(`/admin/creadores/${id}`);
}

export async function setMercadoPagoIntegrationVisibility(isVisible: boolean) {
  await requireAdmin();

  await setMercadoPagoIntegrationVisible(isVisible);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/ajustes");
}

export async function setTransferDiscountPercent(formData: FormData) {
  await requireAdmin();

  const parsed = transferDiscountSchema.parse(Object.fromEntries(formData));
  await setTransferDiscountPercentValue(parsed.transferDiscountPercent);

  revalidatePath("/admin");
  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/creadores");
}

const CSS_COLOR_VARS = [
  "--background", "--surface", "--surface-strong", "--text", "--muted",
  "--line", "--accent", "--accent-strong", "--mint", "--lavender",
  "--coral", "--amber", "--danger"
];

export async function saveColorOverrides(formData: FormData) {
  await requireAdmin();

  const overrides: Record<string, string> = {};
  for (const key of CSS_COLOR_VARS) {
    const val = formData.get(key);
    if (typeof val === "string" && val) {
      overrides[key] = val;
    }
  }

  await setColorOverrides(overrides);
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
}

export async function resetColorOverrides() {
  await requireAdmin();
  await setColorOverrides({});
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
}

export async function createCreatorQr(creatorId: string, formData: FormData) {
  await requireQrAccess(creatorId);

  let qrId: string;
  try {
    const parsed = qrSchema.parse(Object.fromEntries(formData));
    qrId = parsed.qrId;
    await createQrCodeRecord({ creatorId, qrId });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo crear el QR.");
    return;
  }

  try {
    const creator = await getCreatorWithTips(creatorId, 0);
    if (creator) {
      const qrUrl = `${appUrl()}/q/${qrId}`;
      const imageUrl = await qrDataUrl(qrUrl);
      await createNotificationRecord({
        creatorId: ADMIN_NOTIFICATIONS_ID,
        title: `${creator.displayName} creó un nuevo QR`,
        body: qrId,
        photoUrl: creator.photoUrl,
        imageUrl
      });
    }
  } catch {
    // notificación no crítica, no interrumpimos el flujo
  }

  revalidatePath(`/admin/creadores/${creatorId}`);
}

export async function updateCreatorQr(creatorId: string, recordId: string, formData: FormData) {
  await requireQrAccess(creatorId);

  try {
    const parsed = qrSchema.parse(Object.fromEntries(formData));
    await updateQrCodeRecord({
      creatorId,
      recordId,
      qrId: parsed.qrId
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo actualizar el QR.");
    return;
  }

  revalidatePath(`/admin/creadores/${creatorId}`);
}

export async function deleteCreatorQr(creatorId: string, recordId: string) {
  await requireQrAccess(creatorId);

  await deleteQrCodeRecord({
    creatorId,
    recordId
  });

  revalidatePath(`/admin/creadores/${creatorId}`);
}

export async function disconnectMercadoPago(creatorId: string) {
  const session = await requireUser();
  if (session.role !== "admin" && session.creatorId !== creatorId) {
    redirect("/admin");
  }

  await disconnectCreatorMercadoPagoRecord(creatorId);
  revalidatePath(`/admin/creadores/${creatorId}`);
}

export async function updateCreatorMercadoPagoAlias(creatorId: string, formData: FormData) {
  await requireQrAccess(creatorId);

  const settings = await getAppSettings();
  if (!settings.showMercadoPagoIntegration) {
    return;
  }

  try {
    const parsed = mercadoPagoAliasSchema.parse(Object.fromEntries(formData));
    await updateCreatorMercadoPagoAliasRecord(creatorId, parsed.mpAlias);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo guardar el alias.");
    return;
  }

  revalidatePath(`/admin/creadores/${creatorId}`);
}

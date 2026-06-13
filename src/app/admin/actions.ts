"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createRecipientRecord,
  setRecipientActive,
  updateRecipientRecord
} from "@/lib/db";

const recipientSchema = z.object({
  displayName: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  role: z.string().trim().optional(),
  locationName: z.string().trim().optional(),
  commissionPercent: z.coerce.number().min(0).max(40)
});

export async function createRecipient(formData: FormData) {
  const parsed = recipientSchema.parse(Object.fromEntries(formData));

  const recipient = await createRecipientRecord({
    displayName: parsed.displayName,
    slug: parsed.slug,
    role: parsed.role || null,
    locationName: parsed.locationName || null,
    commissionPercent: parsed.commissionPercent
  });

  revalidatePath("/admin");
  redirect(`/admin/receptores/${recipient.id}`);
}

export async function updateRecipient(id: string, formData: FormData) {
  const parsed = recipientSchema.parse(Object.fromEntries(formData));

  await updateRecipientRecord(id, {
    displayName: parsed.displayName,
    slug: parsed.slug,
    role: parsed.role || null,
    locationName: parsed.locationName || null,
    commissionPercent: parsed.commissionPercent
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/receptores/${id}`);
}

export async function toggleRecipient(id: string, isActive: boolean) {
  await setRecipientActive(id, isActive);

  revalidatePath("/admin");
  revalidatePath(`/admin/receptores/${id}`);
}

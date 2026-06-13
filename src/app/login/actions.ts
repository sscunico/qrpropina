"use server";

import { redirect } from "next/navigation";
import { signOutAdmin } from "@/lib/auth";

export async function logoutAdmin() {
  await signOutAdmin();
  redirect("/");
}

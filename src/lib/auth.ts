import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/db";
import { signJson, verifySignedJson } from "@/lib/signing";

const COOKIE_NAME = "qrpropina_admin_session";
const SESSION_DAYS = 7;

export type AppSession = {
  userId: string;
  email: string;
  role: "admin" | "creator";
  creatorId?: string | null;
  name?: string;
  picture?: string;
  exp: number;
};

type SignInAdminProfile = {
  name?: string | null;
  picture?: string | null;
};

function isProductionHttps() {
  return process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://");
}

export function safeNext(value: FormDataEntryValue | string | null | undefined) {
  const next = typeof value === "string" ? value : "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  return next;
}

export async function signInUser(user: User, profile: SignInAdminProfile = {}) {
  const cookieStore = await cookies();
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const session: AppSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    creatorId: user.creatorId,
    exp
  };

  if (profile.name || user.name) {
    session.name = profile.name || user.name || undefined;
  }

  if (profile.picture || user.picture) {
    session.picture = profile.picture || user.picture || undefined;
  }

  cookieStore.set(COOKIE_NAME, signJson(session), {
    httpOnly: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: isProductionHttps()
  });
}

export async function signInAdmin(email: string, profile: SignInAdminProfile = {}) {
  await signInUser(
    {
      id: crypto.randomUUID(),
      email,
      name: profile.name || null,
      picture: profile.picture || null,
      role: "admin",
      creatorId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    profile
  );
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySignedJson<AppSession>(token);

  if (
    !session ||
    typeof session.userId !== "string" ||
    typeof session.email !== "string" ||
    typeof session.exp !== "number" ||
    (session.role !== "admin" && session.role !== "creator")
  ) {
    return null;
  }

  if (session.exp < Date.now()) {
    return null;
  }

  return session;
}

export async function requireUser() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "admin") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/admin");
  }

  return session;
}

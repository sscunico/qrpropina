import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signJson, verifySignedJson } from "@/lib/signing";

const COOKIE_NAME = "qrpropina_admin_session";
const SESSION_DAYS = 7;

type AdminSession = {
  email: string;
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

export async function signInAdmin(email: string, profile: SignInAdminProfile = {}) {
  const cookieStore = await cookies();
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const session: AdminSession = {
    email,
    exp
  };

  if (profile.name) {
    session.name = profile.name;
  }

  if (profile.picture) {
    session.picture = profile.picture;
  }

  cookieStore.set(COOKIE_NAME, signJson(session), {
    httpOnly: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: isProductionHttps()
  });
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySignedJson<AdminSession>(token);

  if (!session || typeof session.email !== "string" || typeof session.exp !== "number") {
    return null;
  }

  if (session.exp < Date.now()) {
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  return session;
}

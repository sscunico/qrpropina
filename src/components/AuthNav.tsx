import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { logoutAdmin } from "@/app/login/actions";
import { getAdminSession } from "@/lib/auth";

export async function AuthNav() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <Link className="button secondary" href="/login">
        <LogIn size={17} />
        Ingresar
      </Link>
    );
  }

  return (
    <>
      <div className="profile-chip" title={session.email}>
        {session.picture ? (
          <img alt={session.name || session.email} src={session.picture} />
        ) : (
          <span className="profile-fallback">
            <User size={16} />
          </span>
        )}
        <span>{session.name || session.email}</span>
      </div>
      <Link className="button secondary" href="/admin">
        <LayoutDashboard size={17} />
        Admin
      </Link>
      <form action={logoutAdmin} className="logout-form">
        <button className="icon-button secondary" title="Cerrar sesión" type="submit">
          <LogOut size={18} />
        </button>
      </form>
    </>
  );
}

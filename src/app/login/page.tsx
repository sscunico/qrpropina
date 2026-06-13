import Link from "next/link";
import { Chrome, LockKeyhole, QrCode } from "lucide-react";
import { getAdminSession, safeNext } from "@/lib/auth";
import { googleOAuthIsConfigured } from "@/lib/googleAuth";

type Props = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getAdminSession();
  const next = safeNext(params.next);
  const googleConfigured = googleOAuthIsConfigured();

  if (session) {
    return (
      <main className="page-narrow">
        <section className="panel">
          <div className="result-icon">
            <LockKeyhole size={28} />
          </div>
          <h1>Sesion activa</h1>
          <p className="muted">Ya estas logueado en qrpropina.</p>
          <Link className="button primary" href="/admin">
            <QrCode size={17} />
            Ir al admin
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-heading">
          <div className="result-icon">
            <LockKeyhole size={28} />
          </div>
          <p className="kicker">Acceso privado</p>
          <h1>Ingresar a qrpropina</h1>
          <p className="muted">Administra receptores, QR y propinas desde tu panel.</p>
        </div>

        <div className="form">
          {params.error ? <LoginError error={params.error} /> : null}
          <Link
            className={googleConfigured ? "button google-button" : "button google-button disabled"}
            href={googleConfigured ? `/api/auth/google/start?next=${encodeURIComponent(next)}` : "#"}
          >
            <Chrome size={18} />
            Continuar con Google
          </Link>
          {!googleConfigured ? (
            <div className="message error">
              Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function LoginError({ error }: { error: string }) {
  const messages: Record<string, string> = {
    google_not_configured: "Google OAuth todavia no esta configurado.",
    oauth_state: "La sesion de Google expiro. Volve a intentar.",
    not_allowed: "Esta cuenta de Google no tiene permiso para entrar.",
    google_failed: "No se pudo validar la cuenta de Google.",
    access_denied: "El acceso con Google fue cancelado."
  };

  return <div className="message error">{messages[error] || "No se pudo iniciar sesion."}</div>;
}

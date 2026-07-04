import Link from "next/link";
import { BadgePercent, Heart, HeartHandshake, QrCode, Smartphone, WalletCards } from "lucide-react";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoginErrorModal } from "@/components/LoginErrorModal";
import { OwnQrToast } from "@/components/OwnQrToast";
import { getAdminSession } from "@/lib/auth";

const googleLoginHref = "/api/auth/google/start?next=%2Fadmin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    loginError?: string;
    ownqr?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getAdminSession();
  const showAuthActions = !session;

  return (
    <main>
      <LoginErrorModal error={params.loginError} />
      <OwnQrToast show={params.ownqr === "1"} />
      <section className="landing-hero">
        <div className="landing-content">
          <p className="landing-eyebrow">Propinas digitales por QR</p>
          <h1 className="landing-title">
            <span>qrpropina</span>
            <Heart aria-label="Corazón" className="landing-title-heart" fill="currentColor" />
          </h1>
          <img
            alt="Medios de pago disponibles"
            className="landing-cards-image"
            src="/imagen_targetas.png"
          />
          <p>
            Una forma simple y linda de recibir propinas: cada persona tiene su QR,
            el cliente escanea y paga desde el celular.
          </p>
          <div className="landing-hero-actions">
            {showAuthActions ? (
              <div className="actions landing-auth-actions">
                <Link className="topbar-login-join landing-auth-button" href={googleLoginHref}>
                  <GoogleIcon size={20} />
                  Iniciar sesión <span className="topbar-login-join-divider">|</span> Unirse
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="landing-intro">
        <div>
          <p className="landing-eyebrow">Para equipos, bares y servicios</p>
          <h2>Cada propina llega a la persona correcta</h2>
        </div>
        <p className="muted">
          Creas creadores, imprimís sus QR y después administrás todo desde un panel privado.
        </p>
      </section>

      <section className="landing-band" aria-label="Beneficios">
        <div className="landing-feature">
          <div className="landing-feature-icon"><QrCode size={22} /></div>
          <div>
            <h2>QR por creador</h2>
            <p className="muted">Un link público para cada persona, listo para imprimir o compartir.</p>
          </div>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <img className="landing-feature-logo" src="/mp-logo.svg" alt="Mercado Pago" />
          </div>
          <div>
            <h2>Mercado Pago</h2>
            <p className="muted">Preparado para conectar cuentas y cobrar con checkout seguro.</p>
          </div>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon"><BadgePercent size={22} /></div>
          <div>
            <h2>Comisión</h2>
            <p className="muted">Configurás cuánto retiene la plataforma por cada propina recibida.</p>
          </div>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon"><Smartphone size={22} /></div>
          <div>
            <h2>Sin app nativa</h2>
            <p className="muted">Funciona desde la cámara del celular y el navegador.</p>
          </div>
        </div>
      </section>

      <section className="landing-strip">
        <div>
          <p className="landing-eyebrow">Listo para operar</p>
          <h2>Tu panel de propinas, privado y simple</h2>
        </div>
        <Link className="button dark" href={showAuthActions ? googleLoginHref : "/admin"}>
          {showAuthActions ? <GoogleIcon size={18} /> : <WalletCards size={18} />}
          {showAuthActions ? "Continuar con Google" : "Ir al panel"}
        </Link>
      </section>

      <section className="landing-soft-band">
        <HeartHandshake size={26} />
        <p>
          Pensado para mozos, barberos, delivery, artistas y cualquier persona que recibe
          agradecimientos en el momento.
        </p>
      </section>
    </main>
  );
}

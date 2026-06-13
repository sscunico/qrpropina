import Link from "next/link";
import { ArrowRight, BadgePercent, LockKeyhole, QrCode, Smartphone, WalletCards } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";

export default function HomePage() {
  return (
    <main>
      <section className="landing-hero">
        <div className="landing-scene" aria-hidden="true">
          <div className="scene-phone">
            <div className="scene-phone-top" />
            <div className="scene-qr">
              {Array.from({ length: 49 }).map((_, index) => (
                <span className={index % 3 === 0 || index % 7 === 0 ? "on" : ""} key={index} />
              ))}
            </div>
            <div className="scene-heart">
              <LogoMark className="scene-logo" />
            </div>
            <div className="scene-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="landing-content">
          <p className="kicker">Propinas digitales</p>
          <h1>qrpropina</h1>
          <p>
            Crea QR para cada persona, cobra con Mercado Pago y administra las propinas desde
            un panel privado.
          </p>
          <div className="actions">
            <Link className="button primary" href="/login">
              <LockKeyhole size={18} />
              Entrar al admin
            </Link>
            <Link className="button hero-secondary" href="/t/juan-perez">
              <QrCode size={18} />
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div className="landing-feature">
          <QrCode size={22} />
          <h2>QR por receptor</h2>
          <p className="muted">Cada trabajador tiene un link propio como /t/ana-gomez.</p>
        </div>
        <div className="landing-feature">
          <WalletCards size={22} />
          <h2>Mercado Pago</h2>
          <p className="muted">El flujo queda preparado para OAuth y comision marketplace.</p>
        </div>
        <div className="landing-feature">
          <BadgePercent size={22} />
          <h2>Comision</h2>
          <p className="muted">Configura tu porcentaje por receptor desde el admin.</p>
        </div>
        <div className="landing-feature">
          <Smartphone size={22} />
          <h2>Sin app nativa</h2>
          <p className="muted">El cliente escanea con la camara y paga desde el navegador.</p>
        </div>
      </section>

      <section className="landing-strip">
        <h2>Panel privado para operar qrpropina</h2>
        <Link className="button dark" href="/login">
          Continuar
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, BadgePercent, HeartHandshake, LockKeyhole, QrCode, Smartphone, WalletCards } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <section className="landing-hero">
        <div className="landing-content">
          <p className="landing-eyebrow">Propinas digitales por QR</p>
          <h1>qrpropina</h1>
          <p>
            Una forma simple y linda de recibir propinas: cada persona tiene su QR,
            el cliente escanea y paga desde el celular.
          </p>
          <div className="actions">
            <Link className="button primary" href="/login">
              <LockKeyhole size={18} />
              Entrar
            </Link>
            <Link className="button hero-secondary" href="/t/juan-perez">
              <QrCode size={18} />
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-intro">
        <div>
          <p className="landing-eyebrow">Para equipos, bares y servicios</p>
          <h2>Cada propina llega a la persona correcta</h2>
        </div>
        <p className="muted">
          Creas receptores, imprimis sus QR y despues administras todo desde un panel privado.
        </p>
      </section>

      <section className="landing-band" aria-label="Beneficios">
        <div className="landing-feature">
          <QrCode size={22} />
          <h2>QR por receptor</h2>
          <p className="muted">Un link publico para cada persona, listo para imprimir o compartir.</p>
        </div>
        <div className="landing-feature">
          <WalletCards size={22} />
          <h2>Mercado Pago</h2>
          <p className="muted">Preparado para conectar cuentas y cobrar con checkout seguro.</p>
        </div>
        <div className="landing-feature">
          <BadgePercent size={22} />
          <h2>Comision</h2>
          <p className="muted">Definis el porcentaje de plataforma por cada receptor.</p>
        </div>
        <div className="landing-feature">
          <Smartphone size={22} />
          <h2>Sin app nativa</h2>
          <p className="muted">Funciona desde la camara del celular y el navegador.</p>
        </div>
      </section>

      <section className="landing-strip">
        <div>
          <p className="landing-eyebrow">Listo para operar</p>
          <h2>Tu panel de propinas, privado y simple</h2>
        </div>
        <Link className="button dark" href="/login">
          Continuar al panel
          <ArrowRight size={18} />
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

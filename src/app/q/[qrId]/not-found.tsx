import { QrCode } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";

export default function QrNotFound() {
  return (
    <main className="qr-notfound-page">
      <div className="qr-notfound-card">
        <div className="qr-notfound-icon-wrap">
          <QrCode className="qr-notfound-icon" size={56} strokeWidth={1.5} />
          <span className="qr-notfound-x">✕</span>
        </div>

        <h1 className="qr-notfound-title">QR no encontrado</h1>
        <p className="qr-notfound-body">
          Este código no está registrado en el sistema o ya no está activo.
          Pedile al local que te muestre el QR correcto.
        </p>

        <div className="qr-notfound-brand">
          <LogoMark className="qr-notfound-logo" />
          <span className="qr-notfound-brand-name">QRpropinas.com</span>
        </div>
      </div>
    </main>
  );
}

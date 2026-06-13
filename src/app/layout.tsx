import type { Metadata } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import { LogoMark } from "@/components/LogoMark";
import { appName } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: appName(),
  description: "qrpropina: propinas por QR con Mercado Pago"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">
                <LogoMark className="brand-logo" />
              </span>
              <span>{appName()}</span>
            </Link>
            <nav className="nav-links">
              <AuthNav />
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

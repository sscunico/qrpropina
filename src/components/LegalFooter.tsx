"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const legalLinks = [
  { href: "/legales/seguridad", label: "Seguridad" },
  { href: "/legales/terminos", label: "Términos y condiciones" },
  { href: "/legales/privacidad", label: "Privacidad y datos personales" },
  { href: "/legales/defensa-consumidor", label: "Defensa del consumidor" },
  { href: "/legales", label: "Centro legal" }
];

export function LegalFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/t/") || pathname.startsWith("/q/") || pathname.startsWith("/pago/")) {
    return null;
  }

  return (
    <footer className="legal-footer">
      <div>
        <h2>Otros enlaces</h2>
        <nav className="legal-footer-links" aria-label="Enlaces legales">
          {legalLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="legal-footer-copy">
        <strong>Copyright 2026 qrpropina.</strong>
        <p>Todos los derechos reservados. Prohibida la duplicacion, distribucion o almacenamiento no autorizado.</p>
      </div>
    </footer>
  );
}

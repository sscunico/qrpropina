import type { ReactNode } from "react";

type Props = {
  href: string;
  amount: number;
  children?: ReactNode;
};

export function MercadoPagoButton({ href, amount, children }: Props) {
  return (
    <a className="mp-button-link" href={href} rel="noreferrer">
      <span className="mp-button-inner">
        <img
          alt="Mercado Pago"
          src="/mp-logo.svg"
          style={{ display: "block", height: "44px", width: "auto", maxWidth: "220px" }}
        />
        {children}
        <span className="mp-button-sub">
          Pagar ${amount.toLocaleString("es-AR")} de forma segura
        </span>
      </span>
    </a>
  );
}

"use client";

import Link from "next/link";

type Props = {
  creatorId: string;
  isConnected?: boolean;
  disabled?: boolean;
};

export function MercadoPagoAlertButton({ creatorId, isConnected = false, disabled = false }: Props) {
  if (disabled) {
    return (
      <div className="mp-connect-button mp-connect-button--connected" aria-disabled="true">
        <img alt="Mercado Pago conectado" src="/mp-logo.svg" />
      </div>
    );
  }

  return (
    <Link className="mp-connect-button" href={`/api/mercadopago/oauth/start?creatorId=${creatorId}`}>
      <img alt={isConnected ? "Reconectar Mercado Pago" : "Integrar Mercado Pago"} src="/mp-logo.svg" />
    </Link>
  );
}

"use client";

import Link from "next/link";

type Props = {
  creatorId: string;
  isConnected?: boolean;
};

export function MercadoPagoAlertButton({ creatorId, isConnected = false }: Props) {
  return (
    <Link className="button primary mp-connect-button" href={`/api/mercadopago/oauth/start?creatorId=${creatorId}`}>
      <img alt="" src="/mp-logo.svg" />
      {isConnected ? "Reconectar Mercado Pago" : "Integrar Mercado Pago"}
    </Link>
  );
}

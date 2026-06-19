"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";

type Props = {
  creatorId: string;
  isConnected?: boolean;
};

export function MercadoPagoAlertButton({ creatorId, isConnected = false }: Props) {
  return (
    <Link className="button primary" href={`/api/mercadopago/oauth/start?creatorId=${creatorId}`}>
      <Wallet size={17} />
      {isConnected ? "Reconectar Mercado Pago" : "Integrar Mercado Pago"}
    </Link>
  );
}

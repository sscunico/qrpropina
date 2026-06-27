"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  creatorId: string;
  isConnected?: boolean;
};

export function MercadoPagoAlertButton({ creatorId, isConnected = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    router.push(`/api/mercadopago/oauth/start?creatorId=${creatorId}`);
  }

  if (loading) {
    return (
      <div className="mp-connect-button mp-connect-button--loading" aria-busy="true">
        <span className="mp-spinner" />
      </div>
    );
  }

  return (
    <button className="mp-connect-button" type="button" onClick={handleClick}>
      <img alt={isConnected ? "Reconectar Mercado Pago" : "Integrar Mercado Pago"} src="/mp-logo.svg" />
    </button>
  );
}

"use client";

import { useEffect, useRef } from "react";

type Props = {
  preferenceId: string;
  publicKey: string;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: new (publicKey: string, options?: Record<string, unknown>) => any;
  }
}

const CONTAINER_ID = "mp-wallet-brick-container";

export function WalletBrick({ preferenceId, publicKey }: Props) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const existingScript = document.querySelector('script[src*="sdk.mercadopago.com"]');

    function initBrick() {
      const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });
      mp.bricks()
        .create("wallet", CONTAINER_ID, {
          initialization: { preferenceId },
          customization: { texts: { valueProp: "smart_option" } }
        })
        .catch(() => {});
    }

    if (existingScript) {
      if (window.MercadoPago) {
        initBrick();
      } else {
        existingScript.addEventListener("load", initBrick);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = initBrick;
    document.head.appendChild(script);
  }, [preferenceId, publicKey]);

  return <div id={CONTAINER_ID} className="mp-wallet-brick" />;
}

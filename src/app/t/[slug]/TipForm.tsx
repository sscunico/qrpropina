"use client";

import { useMemo, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { DEFAULT_AMOUNTS } from "@/lib/money";

type Props = {
  slug: string;
  recipientName: string;
};

export function TipForm({ slug, recipientName }: Props) {
  const [selectedAmount, setSelectedAmount] = useState(DEFAULT_AMOUNTS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const amount = useMemo(() => {
    const parsed = Number(customAmount);
    return customAmount ? parsed : selectedAmount;
  }, [customAmount, selectedAmount]);

  async function submitTip() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slug,
          amount,
          payerEmail: payerEmail || null
        })
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo iniciar el pago.");
      setIsLoading(false);
    }
  }

  return (
    <div className="tip-body">
      <h2>Elegir monto</h2>
      <div className="amount-grid">
        {DEFAULT_AMOUNTS.map((preset) => (
          <button
            className={
              !customAmount && selectedAmount === preset ? "amount-button active" : "amount-button"
            }
            key={preset}
            onClick={() => {
              setCustomAmount("");
              setSelectedAmount(preset);
            }}
            type="button"
          >
            ${preset}
          </button>
        ))}
      </div>

      <div className="form">
        <div className="field">
          <label htmlFor="customAmount">Otro monto</label>
          <input
            id="customAmount"
            inputMode="decimal"
            min="100"
            placeholder="Ej: 750"
            type="number"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="payerEmail">Email para comprobante</label>
          <input
            id="payerEmail"
            placeholder="opcional"
            type="email"
            value={payerEmail}
            onChange={(event) => setPayerEmail(event.target.value)}
          />
        </div>
        {error ? <div className="message error">{error}</div> : null}
        <button className="button primary" disabled={isLoading || amount < 100} onClick={submitTip} type="button">
          {isLoading ? <Loader2 size={18} /> : <CreditCard size={18} />}
          Pagar propina a {recipientName}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { MercadoPagoButton } from "@/components/MercadoPagoButton";
import { MercadoPagoButtonSlot } from "@/components/MercadoPagoButtonSlot";
import { DEFAULT_AMOUNTS } from "@/lib/money";

type Props = {
  slug: string;
  creatorName: string;
  commissionPercent: number;
};

export function TipForm({ slug, creatorName, commissionPercent }: Props) {
  const [selectedAmount, setSelectedAmount] = useState(DEFAULT_AMOUNTS[3]);
  const [customAmount, setCustomAmount] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const amount = useMemo(() => {
    const parsed = Number(customAmount);
    return customAmount ? parsed : selectedAmount;
  }, [customAmount, selectedAmount]);

  const { grossAmount, platformFee } = useMemo(() => {
    if (commissionPercent <= 0) return { grossAmount: amount, platformFee: 0 };
    const fee = Math.round(amount * commissionPercent) / 100;
    return { grossAmount: amount + fee, platformFee: fee };
  }, [amount, commissionPercent]);

  async function submitTip() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount, payerEmail: payerEmail || null })
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }

      const isDemo = data.checkoutUrl.includes("/pago/demo");
      if (isDemo) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      setCheckoutUrl(data.checkoutUrl);
      setIsLoading(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo iniciar el pago.");
      setIsLoading(false);
    }
  }

  // Step 2: show official-style MP button
  if (checkoutUrl) {
    return (
      <div className="tip-body">
        <button className="tip-back-link" onClick={() => { setCheckoutUrl(null); setError(""); }} type="button">
          <ChevronLeft size={16} />
          Cambiar monto
        </button>
        <MercadoPagoButton amount={grossAmount} href={checkoutUrl}>
          <MercadoPagoButtonSlot />
        </MercadoPagoButton>
      </div>
    );
  }

  // Step 1: amount selector
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
        <button
          className="button mp-pay test"
          disabled={isLoading || amount < 100}
          onClick={submitTip}
          type="button"
        >
          {isLoading ? <Loader2 size={18} /> : null}
          {isLoading ? "Generando pago..." : `Continuar con $${grossAmount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
        </button>
        {commissionPercent > 0 && amount >= 100 && (
          <div className="fee-breakdown">
            <div className="fee-row">
              <span>Propina</span>
              <span>${amount.toLocaleString("es-AR")}</span>
            </div>
            <div className="fee-row">
              <span>Tarifa del servicio ({commissionPercent}%)</span>
              <span>+${platformFee.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="fee-row fee-total">
              <strong>Total a pagar</strong>
              <strong>${grossAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

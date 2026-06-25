import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, QrCode } from "lucide-react";
import { getTipWithCreator, updateTipRecord } from "@/lib/db";
import { formatMoney, centsToPesos } from "@/lib/money";
import { parseMpPaymentData } from "@/lib/mercadopago";

type Props = {
  params: Promise<{ result: string }>;
  searchParams: Promise<{ tipId?: string }>;
};

export const dynamic = "force-dynamic";

function contentFor(result: string) {
  if (result === "demo") {
    return {
      icon: <CheckCircle2 size={28} />,
      title: "Demo completada",
      text: "No se movio dinero. Esta pantalla solo confirma que el flujo local funciona."
    };
  }

  if (result === "exito") {
    return {
      icon: <CheckCircle2 size={28} />,
      title: "Pago enviado a confirmacion",
      text: "Mercado Pago confirmara el estado final por webhook. Cuando llegue como approved, se cuenta como cobrado."
    };
  }

  if (result === "pendiente") {
    return {
      icon: <Clock size={28} />,
      title: "Pago pendiente",
      text: "Cuando Mercado Pago confirme el cobro, la propina quedara actualizada."
    };
  }

  return {
    icon: <AlertCircle size={28} />,
    title: "Pago no completado",
    text: "Podes volver a intentar desde el QR."
  };
}

export default async function PaymentResultPage({ params, searchParams }: Props) {
  const { result } = await params;
  const { tipId } = await searchParams;
  const content = contentFor(result);
  let tip = tipId ? await getTipWithCreator(tipId) : null;

  if (result === "demo" && tip && tip.status === "demo_created") {
    await updateTipRecord(tip.id, { status: "demo_approved" });
    tip = await getTipWithCreator(tip.id);
  }

  return (
    <main className="page-narrow">
      <section className="panel">
        <div className="result-icon">{content.icon}</div>
        <h1>{content.title}</h1>
        <p className="muted">{content.text}</p>
        {tip ? (
          <div className="message">
            {(() => {
              const mp = parseMpPaymentData(tip.rawPayment);
              const creatorReceivesCents = mp.netReceivedAmountCents ?? (tip.amountCents - tip.platformFeeCents);
              const isConfirmedByMp = mp.netReceivedAmountCents !== null;
              return (
                <>
                  <strong>{formatMoney(tip.amountCents, tip.currency)}</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Total pagado a Mercado Pago
                  </p>
                  <p style={{ margin: "8px 0 0" }}>
                    <strong>{formatMoney(creatorReceivesCents, tip.currency)}</strong>
                    {" "}
                    <span className="muted">
                      recibe {tip.creator.displayName}
                      {isConfirmedByMp ? " (confirmado por MP)" : " (estimado)"}
                    </span>
                  </p>
                  {mp.moneyReleaseDate && (
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      Disponible el{" "}
                      {new Date(mp.moneyReleaseDate).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        ) : null}
        <div className="actions" style={{ marginTop: 18 }}>
          {tip ? (
            <Link className="button primary" href={`/t/${tip.creator.slug}`}>
              <QrCode size={17} />
              Nueva propina
            </Link>
          ) : (
            <Link className="button primary" href="/admin">
              Volver
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

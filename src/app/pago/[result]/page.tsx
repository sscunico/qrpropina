import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, QrCode } from "lucide-react";
import { getTipWithCreator, updateTipRecord } from "@/lib/db";
import { formatMoney } from "@/lib/money";

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
            <strong>{formatMoney(tip.amountCents, tip.currency)}</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Propina para {tip.creator.displayName}
            </p>
            <p className="muted" style={{ marginBottom: 0 }}>
              Estado local: {tip.status}
            </p>
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

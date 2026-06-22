"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

const messages: Record<string, { title: string; body: string }> = {
  oauth_state: {
    title: "No se pudo iniciar sesión",
    body: "La sesión de Google expiró. Volvé a iniciar sesión desde el botón de Google."
  }
};

export function LoginErrorModal({ error }: { error?: string }) {
  const router = useRouter();
  const message = error ? messages[error] : null;

  if (!message) {
    return null;
  }

  function closeModal() {
    router.replace("/");
  }

  return (
    <div className="modal-backdrop show" role="presentation">
      <section aria-labelledby="login-error-title" aria-modal="true" className="modal-card" role="dialog">
        <button aria-label="Cerrar" className="icon-button ghost modal-close" onClick={closeModal} type="button">
          <X size={20} />
        </button>
        <div className="result-icon modal-icon">
          <AlertTriangle size={28} />
        </div>
        <h2 id="login-error-title">{message.title}</h2>
        <p className="muted">{message.body}</p>
        <button className="button primary" onClick={closeModal} type="button">
          Entendido
        </button>
      </section>
    </div>
  );
}

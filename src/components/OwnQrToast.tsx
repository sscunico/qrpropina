"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, X } from "lucide-react";

const DURATION = 5000;

export function OwnQrToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);
  const [progress, setProgress] = useState(100);
  const router = useRouter();
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!show) return;

    // Limpiar el ?ownqr=1 de la URL sin recargar la página
    window.history.replaceState(null, "", "/");

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);

      if (elapsed >= DURATION) {
        setVisible(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div className="own-qr-toast" role="status" aria-live="polite">
      <div className="own-qr-toast-inner">
        <div className="own-qr-toast-icon">
          <QrCode size={22} />
        </div>
        <div className="own-qr-toast-body">
          <strong>Este QR te pertenece</strong>
          <span>
            Para ver tus propinas, editar tu perfil o administrar tus QR, iniciá
            sesión e ingresá al panel desde el menú.
          </span>
        </div>
        <button
          aria-label="Cerrar aviso"
          className="own-qr-toast-close"
          onClick={() => setVisible(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div
        className="own-qr-toast-bar"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

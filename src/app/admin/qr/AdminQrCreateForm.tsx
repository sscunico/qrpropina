"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createAdminQr } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button primary" disabled={pending} type="submit">
      {pending ? (
        <>
          <span className="btn-spinner" />
          Creando…
        </>
      ) : (
        <>
          <Plus size={18} />
          Crear QR
        </>
      )}
    </button>
  );
}

export function AdminQrCreateForm() {
  const [autoInstallable, setAutoInstallable] = useState(true);

  return (
    <form action={createAdminQr} className="form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="qrId">ID del QR</label>
          <input
            id="qrId"
            name="qrId"
            placeholder="Dejar vacío para auto-generar (YYMMDDHHMMSS)"
          />
        </div>
      </div>

      <div className="admin-qr-switch-row">
        <label className={`switch-control admin-switch-form${autoInstallable ? " checked" : ""}`}>
          <input
            checked={autoInstallable}
            className="sr-only"
            name="autoInstallable"
            onChange={(e) => setAutoInstallable(e.target.checked)}
            type="checkbox"
          />
          <span className="switch-track"><span className="switch-thumb" /></span>
          <span>QR autoinstalable</span>
        </label>
        {autoInstallable && (
          <p className="muted admin-qr-ai-hint">
            La URL del QR incluirá <code>?AI=True</code>
          </p>
        )}
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}

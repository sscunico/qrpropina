"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Save, XCircle } from "lucide-react";

type Props = {
  cancelHref?: string;
  cancelLabel?: string;
  className?: string;
  defaultValue?: string;
  exceptRecordId?: string;
  formAction: (formData: FormData) => void | Promise<void>;
  inputId: string;
  submitLabel: string;
  submitStyle?: "primary" | "secondary";
};

type CheckResult = {
  available: boolean;
  valid: boolean;
  message: string;
};

const qrIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function QrIdForm({
  cancelHref,
  cancelLabel = "Cancelar",
  className = "form",
  defaultValue = "",
  exceptRecordId,
  formAction,
  inputId,
  submitLabel,
  submitStyle = "primary"
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">(
    defaultValue ? "valid" : "idle"
  );
  const [message, setMessage] = useState(defaultValue ? "ID disponible." : "");

  const normalizedValue = useMemo(() => value.trim().toLowerCase(), [value]);
  const canSubmit = status === "valid" && normalizedValue.length > 0;

  useEffect(() => {
    let cancelled = false;

    if (!normalizedValue) {
      setStatus("idle");
      setMessage("");
      return () => {
        cancelled = true;
      };
    }

    if (!qrIdPattern.test(normalizedValue)) {
      setStatus("invalid");
      setMessage("Solo letras, números y guiones.");
      return () => {
        cancelled = true;
      };
    }

    setStatus("checking");
    setMessage("Verificando...");

    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ id: normalizedValue });
      if (exceptRecordId) {
        params.set("except", exceptRecordId);
      }

      try {
        const response = await fetch(`/api/qr/check?${params.toString()}`);
        const result = (await response.json()) as CheckResult;
        if (cancelled) {
          return;
        }

        setStatus(result.available ? "valid" : "invalid");
        setMessage(result.message);
      } catch {
        if (!cancelled) {
          setStatus("invalid");
          setMessage("No se pudo verificar el ID.");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [exceptRecordId, normalizedValue]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value.toLowerCase());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!canSubmit) {
      event.preventDefault();
    }
  }

  const validationClass =
    status === "valid" ? "is-valid" : status === "invalid" ? "is-invalid" : "";

  return (
    <form action={formAction} className={className} onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={inputId}>ID de QR</label>
        <div className="qr-validation-control has-validation">
          <input
            aria-describedby={`${inputId}-feedback`}
            className={`form-control ${validationClass}`}
            id={inputId}
            name="qrId"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="Ingresa un nuevo QR"
            required
            value={value}
            onChange={handleChange}
          />
          {status === "valid" ? (
            <CheckCircle2 aria-hidden="true" className="validation-icon valid" size={18} />
          ) : null}
          {status === "invalid" ? (
            <XCircle aria-hidden="true" className="validation-icon invalid" size={18} />
          ) : null}
        </div>
        {message ? (
          <div
            className={status === "valid" ? "valid-feedback" : "invalid-feedback"}
            id={`${inputId}-feedback`}
          >
            {message}
          </div>
        ) : null}
      </div>
      <div className="qr-form-actions">
        <button className={`button ${submitStyle}`} disabled={!canSubmit} type="submit">
          {submitStyle === "primary" ? <Plus size={18} /> : <Save size={17} />}
          {submitLabel}
        </button>
        {cancelHref ? (
          <Link className="button secondary" href={cancelHref}>
            {cancelLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}

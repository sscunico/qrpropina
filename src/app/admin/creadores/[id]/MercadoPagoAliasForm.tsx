"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Save, Search, XCircle } from "lucide-react";

type Props = {
  creatorId: string;
  defaultValue?: string | null;
  formAction: (formData: FormData) => void | Promise<void>;
};

type AliasResult = {
  alias: string;
  available: boolean;
  valid: boolean;
  message: string;
  note?: string;
};

const aliasPattern = /^[a-z0-9](?:[a-z0-9.-]{4,38}[a-z0-9])$/;

export function MercadoPagoAliasForm({ creatorId, defaultValue = "", formAction }: Props) {
  const [value, setValue] = useState(defaultValue || "");
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">(
    defaultValue ? "valid" : "idle"
  );
  const [message, setMessage] = useState(defaultValue ? "Alias guardado en qrpropina." : "");
  const [note, setNote] = useState("");

  const normalizedValue = useMemo(() => value.trim().toLowerCase(), [value]);
  const canSave = status === "valid" && normalizedValue.length > 0;

  async function searchAlias() {
    setNote("");

    if (!normalizedValue) {
      setStatus("invalid");
      setMessage("Ingresa un alias de Mercado Pago.");
      return;
    }

    if (!aliasPattern.test(normalizedValue)) {
      setStatus("invalid");
      setMessage("Usa entre 6 y 40 caracteres: letras, números, punto o guion.");
      return;
    }

    setStatus("checking");
    setMessage("Buscando alias...");

    try {
      const params = new URLSearchParams({
        alias: normalizedValue,
        exceptCreatorId: creatorId
      });
      const response = await fetch(`/api/mercadopago/alias/search?${params.toString()}`);
      const result = (await response.json()) as AliasResult;

      setStatus(result.available ? "valid" : "invalid");
      setMessage(result.message);
      setNote(result.note || "");
    } catch {
      setStatus("invalid");
      setMessage("No se pudo buscar el alias.");
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value.toLowerCase());
    setStatus("idle");
    setMessage("");
    setNote("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!canSave) {
      event.preventDefault();
    }
  }

  const validationClass =
    status === "valid" ? "is-valid" : status === "invalid" ? "is-invalid" : "";

  return (
    <form action={formAction} className="form mp-alias-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="mpAlias">Alias de Mercado Pago</label>
        <div className="qr-validation-control has-validation">
          <input
            aria-describedby="mpAlias-feedback"
            className={`form-control ${validationClass}`}
            id="mpAlias"
            name="mpAlias"
            placeholder="ejemplo: ana.gomez.mp"
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
            id="mpAlias-feedback"
          >
            {message}
          </div>
        ) : null}
      </div>

      <div className="mp-alias-actions">
        <button className="button secondary" disabled={status === "checking"} onClick={searchAlias} type="button">
          <Search size={17} />
          Buscar alias
        </button>
        <button className="button primary" disabled={!canSave} type="submit">
          <Save size={17} />
          Guardar alias
        </button>
      </div>

      {note ? <p className="small-note">{note}</p> : null}
    </form>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  value: string;
  iconOnly?: boolean;
};

export function CopyLinkButton({ value, iconOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (iconOnly) {
    return (
      <button
        aria-label={copied ? "Copiado" : "Copiar link"}
        className="button secondary icon-only"
        onClick={copy}
        title={copied ? "Copiado" : "Copiar link"}
        type="button"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    );
  }

  return (
    <button className="button secondary" onClick={copy} type="button">
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

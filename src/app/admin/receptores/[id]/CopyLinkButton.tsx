"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  value: string;
};

export function CopyLinkButton({ value }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="button secondary" onClick={copy} type="button">
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

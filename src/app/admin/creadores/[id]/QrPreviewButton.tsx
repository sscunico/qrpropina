"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  qrId: string;
  image: string;
};

export function QrPreviewButton({ qrId, image }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="qr-large qr-large--clickable" onClick={() => setOpen(true)}>
        <img alt={`QR ${qrId}`} src={image} />
      </div>

      {open ? (
        <div className="qr-preview-overlay" onClick={() => setOpen(false)}>
          <div className="qr-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Cerrar"
              className="qr-preview-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <img alt={`QR ${qrId}`} className="qr-preview-image" src={image} />
          </div>
        </div>
      ) : null}
    </>
  );
}

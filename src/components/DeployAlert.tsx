"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function DeployAlert({ commitSha }: { commitSha: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      background: "#fff3cd",
      border: "1px solid #ffc107",
      borderRadius: 8,
      padding: "12px 16px",
      marginBottom: 20,
      fontSize: "0.9rem",
      color: "#664d03"
    }}>
      <span style={{ flex: 1 }}>
        <strong>Versión desplegada:</strong> commit <code style={{ background: "#ffe69c", borderRadius: 4, padding: "1px 6px" }}>{commitSha}</code>
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#664d03", lineHeight: 1 }}
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { GitCommit, X } from "lucide-react";

export function DeployAlert({ commitSha }: { commitSha: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="col-12">
      <section className="panel settings-panel deploy-alert-panel">
        <div className="section-row compact-row">
          <div>
            <p className="kicker">Servidor</p>
            <h2 className="section-title-with-icon">
              <GitCommit size={18} />
              Versión desplegada
            </h2>
            <p className="muted">
              Commit activo:{" "}
              <code className="deploy-commit-code">{commitSha}</code>
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="icon-button ghost"
            onClick={() => setVisible(false)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

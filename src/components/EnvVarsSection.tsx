"use client";

import { useState } from "react";

type EnvVar = {
  key: string;
  label: string;
  group: string;
  value: string;
  missing: boolean;
};

export function EnvVarsSection({ vars }: { vars: EnvVar[] }) {
  const [visible, setVisible] = useState(false);

  const groups = vars.reduce<Record<string, EnvVar[]>>((acc, v) => {
    if (!acc[v.group]) acc[v.group] = [];
    acc[v.group].push(v);
    return acc;
  }, {});

  return (
    <div className="env-vars-wrapper">
      <label className="env-vars-switch">
        <input
          checked={visible}
          onChange={() => setVisible((v) => !v)}
          type="checkbox"
        />
        <span className="env-switch-track"><span className="env-switch-thumb" /></span>
        <span className="env-switch-label">{visible ? "Ocultar valores" : "Mostrar valores"}</span>
      </label>

      <div className="env-vars-scroll">
        {Object.entries(groups).map(([group, items]) => (
          <div className="env-group" key={group}>
            <p className="env-group-title">{group}</p>
            <div className="env-group-header">
              <span>Variable</span>
              <span>Valor</span>
              <span>Estado</span>
            </div>
            {items.map((v) => (
              <div className="env-var-row" key={v.key}>
                <div className="env-var-meta">
                  <span className="env-var-label">{v.label}</span>
                  <code className="env-var-key">{v.key}</code>
                </div>
                <code className={`env-var-value ${!visible && !v.missing ? "env-var-masked" : v.missing ? "env-var-missing" : ""}`}>
                  {visible ? v.value : v.missing ? "(no configurada)" : "••••••••••••••••"}
                </code>
                <span className={v.missing ? "pill warn" : "pill ok"}>
                  {v.missing ? "Falta" : "OK"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

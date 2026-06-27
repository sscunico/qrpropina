"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Plus, QrCode, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { InfoTooltip } from "@/components/InfoTooltip";

type Props = {
  claimAction: (qrId: string) => Promise<void>;
  existingQrIds: string[];
};

type Phase = "idle" | "scanning";
type ManualStatus = "idle" | "checking" | "valid" | "invalid";

type Popup = {
  type: "success" | "error" | "info";
  qrId?: string;
  message: string;
} | null;

const QR_PATH_RE = /\/q\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:[/?#]|$)/;
const MANUAL_ID_RE = /^[a-z0-9_-]+$/;

export function QrScanner({ claimAction, existingQrIds }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [popup, setPopup] = useState<Popup>(null);

  const [manualId, setManualId] = useState("");
  const [manualStatus, setManualStatus] = useState<ManualStatus>("idle");
  const [manualMsg, setManualMsg] = useState("");
  const [manualRegistering, setManualRegistering] = useState(false);

  const normalizedManual = manualId.trim().toLowerCase();

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState < video.HAVE_CURRENT_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code?.data) {
      handleDetected(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  async function startScanning() {
    setPhase("scanning");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setPhase("idle");
      setPopup({ type: "error", message: "No se pudo acceder a la cámara. Permití el acceso e intentá de nuevo." });
    }
  }

  async function handleDetected(url: string) {
    stopCamera();
    setPhase("idle");

    const match = QR_PATH_RE.exec(url);
    if (!match) {
      setPopup({ type: "error", message: "Este QR no corresponde a nuestra plataforma." });
      return;
    }

    const qrId = match[1];

    try {
      const res = await fetch(`/api/qr/check?id=${encodeURIComponent(qrId)}`);
      const result = (await res.json()) as { available: boolean; message: string };

      if (result.available) {
        await claimAction(qrId);
        setPopup({ type: "success", qrId, message: "QR registrado exitosamente en tu cuenta." });
        router.refresh();
      } else if (existingQrIds.includes(qrId)) {
        setPopup({ type: "info", qrId, message: "Este QR ya está registrado en tu cuenta." });
      } else {
        setPopup({ type: "error", qrId, message: "Este QR ya existe y no está disponible." });
      }
    } catch {
      setPopup({ type: "error", message: "No se pudo verificar el QR. Intentá de nuevo." });
    }
  }

  useEffect(() => {
    if (!normalizedManual) {
      setManualStatus("idle");
      setManualMsg("");
      return;
    }

    if (!MANUAL_ID_RE.test(normalizedManual)) {
      setManualStatus("invalid");
      setManualMsg("Solo letras, números, guiones y guión bajo.");
      return;
    }

    setManualStatus("checking");
    setManualMsg("Verificando...");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/qr/check?id=${encodeURIComponent(normalizedManual)}`);
        const result = (await res.json()) as { available: boolean; message: string };
        setManualStatus(result.available ? "valid" : "invalid");
        setManualMsg(result.available ? "ID disponible." : "Este ID ya está registrado.");
      } catch {
        setManualStatus("invalid");
        setManualMsg("No se pudo verificar. Intentá de nuevo.");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [normalizedManual]);

  async function handleManualRegister() {
    if (!normalizedManual || manualStatus !== "valid") return;
    setManualRegistering(true);
    try {
      await claimAction(normalizedManual);
      setManualId("");
      setManualStatus("idle");
      setManualMsg("");
      router.refresh();
    } catch {
      setManualStatus("invalid");
      setManualMsg("No se pudo registrar el QR. Intentá de nuevo.");
    } finally {
      setManualRegistering(false);
    }
  }

  return (
    <div className="qr-scanner-section">
      <div className={`qr-scan-launcher${phase === "scanning" ? " qr-scan-launcher--active" : ""}`}>
        {phase === "idle" ? (
          <button
            aria-label="Escanear QR"
            className="qr-scan-circle"
            type="button"
            onClick={startScanning}
          >
            <span className="qr-scan-camera-card">
              <Plus size={88} strokeWidth={2.1} />
            </span>
          </button>
        ) : (
          <>
            <video ref={videoRef} className="qr-scan-video" playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <button
              aria-label="Cancelar escaneo"
              className="qr-scan-cancel"
              type="button"
              onClick={() => { stopCamera(); setPhase("idle"); }}
            >
              <X size={18} />
            </button>
          </>
        )}

        {popup ? (
          <div className="qr-popup-overlay">
            <div className={`qr-popup qr-popup--${popup.type === "info" ? "info" : popup.type}`} onClick={(e) => e.stopPropagation()}>
              <div className="qr-popup-icon-wrap">
                {popup.type === "success"
                  ? <CheckCircle2 size={36} />
                  : <AlertTriangle size={36} />}
              </div>
              <div className="qr-popup-body">
                <strong className="qr-popup-title">
                  {popup.type === "success" ? "¡QR nuevo registrado!" : popup.type === "info" ? "QR ya en tu lista" : "QR no disponible"}
                </strong>
                {popup.qrId ? <span className="qr-popup-id">{popup.qrId}</span> : null}
                <p className="qr-popup-msg">{popup.message}</p>
              </div>
              <button
                aria-label="Cerrar"
                className="qr-popup-close"
                type="button"
                onClick={() => setPopup(null)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="qr-scan-caption">
          <QrCode aria-hidden="true" className="qr-scan-caption-icon" size={16} />
          <span>{phase === "scanning" ? "Apuntá al QR..." : "Escanear QR"}</span>
          {phase === "idle" ? (
            <InfoTooltip
              position="top"
              text="Presioná el círculo para abrir la cámara y escanear un QR de qrpropina. Si el ID está libre, queda registrado automáticamente."
            />
          ) : null}
        </div>
      </div>

        <p className="muted qr-scanner-hint">
          Escaneá un QR de nuestra plataforma. Si el ID está disponible, quedará registrado en tu cuenta.
        </p>

        <div className="qr-manual-section">
          <p className="qr-manual-label">O ingresá el ID del QR manualmente</p>
          <div className="input-group">
            <div className="form-floating">
              <input
                aria-describedby="manual-qr-feedback"
                className={`form-control${manualStatus === "valid" ? " is-valid" : manualStatus === "invalid" ? " is-invalid" : ""}`}
                id="manual-qr-id"
                maxLength={64}
                placeholder=" "
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toLowerCase())}
              />
              <label htmlFor="manual-qr-id">ID del QR</label>
            </div>
            <button
              className="button primary qr-manual-btn"
              disabled={manualStatus !== "valid" || manualRegistering}
              type="button"
              onClick={handleManualRegister}
            >
              <CheckCircle2 size={17} />
              {manualRegistering ? "Registrando..." : "Registrar"}
            </button>
          </div>
          {manualMsg ? (
            <div
              className={`qr-manual-msg${manualStatus === "valid" ? " valid" : " invalid"}`}
              id="manual-qr-feedback"
            >
              {manualStatus === "valid"
                ? <CheckCircle2 aria-hidden="true" size={14} />
                : <XCircle aria-hidden="true" size={14} />}
              {manualMsg}
            </div>
          ) : null}
        </div>
      </div>
  );
}

import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";

export async function qrDataUrl(value: string) {
  const qrBuffer = await QRCode.toBuffer(value, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#101828",
      light: "#ffffff"
    }
  });

  const { width = 296 } = await sharp(qrBuffer).metadata();

  // Ícono ocupa el 22% del ancho, con padding blanco del 18%
  const iconTotal = Math.round(width * 0.22);
  const padding = Math.round(iconTotal * 0.18);
  const innerSize = iconTotal - padding * 2;

  const iconPath = path.join(process.cwd(), "public", "app-icon.png");

  // Escala, convierte a blanco y negro, y agrega fondo blanco cuadrado
  const iconBuffer = await sharp(iconPath)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const offset = Math.round((width - iconTotal) / 2);

  const finalBuffer = await sharp(qrBuffer)
    .composite([{ input: iconBuffer, left: offset, top: offset }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${finalBuffer.toString("base64")}`;
}

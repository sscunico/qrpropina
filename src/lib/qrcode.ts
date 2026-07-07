import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

// Fuente embebida para que el texto se renderice igual en cualquier servidor,
// sin depender de qué tipografías tenga instaladas el sistema operativo.
const FONT_PATH = path.join(process.cwd(), "src", "assets", "fonts", "NotoSans-Regular.ttf");

function renderTextPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    font: { fontFiles: [FONT_PATH], loadSystemFonts: false, defaultFontFamily: "Noto Sans" },
    fitTo: { mode: "width", value: width }
  });
  return resvg.render().asPng();
}

function extractQrId(value: string): string {
  try {
    return new URL(value).pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

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

  // Escala y agrega fondo blanco cuadrado, manteniendo el color original del ícono
  const iconBuffer = await sharp(iconPath)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const offset = Math.round((width - iconTotal) / 2);

  const qrWithIcon = await sharp(qrBuffer)
    .composite([{ input: iconBuffer, left: offset, top: offset }])
    .png()
    .toBuffer();

  // Franja superior con logo + "QRpropina.com", alineados arriba a la izquierda y pegados al QR
  const headerHeight = Math.round(width * 0.13);
  const headerPadding = Math.round(headerHeight * 0.12);
  const logoSize = headerHeight - headerPadding * 2;
  const logoTop = headerHeight - headerPadding - logoSize;

  const headerLogoBuffer = await sharp(iconPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const fontSize = Math.round(logoSize * 0.55);
  const textSvg = `
    <svg width="${width}" height="${headerHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${headerPadding * 2 + logoSize}"
        y="${logoTop + logoSize / 2}"
        font-family="Noto Sans, sans-serif"
        font-weight="bold"
        font-size="${fontSize}"
        fill="#101828"
        dominant-baseline="central"
        text-anchor="start"
      >QRpropina.com</text>
    </svg>
  `;
  const textBuffer = renderTextPng(textSvg, width);

  // Pie con el ID del QR, chiquito y centrado, debajo del QR
  const qrId = extractQrId(value);
  const footerHeight = Math.round(width * 0.08);
  const footerFontSize = Math.round(footerHeight * 0.5);
  const footerSvg = `
    <svg width="${width}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${width / 2}"
        y="${footerHeight / 2}"
        font-family="Noto Sans, sans-serif"
        font-size="${footerFontSize}"
        fill="#667085"
        dominant-baseline="central"
        text-anchor="middle"
      >${qrId}</text>
    </svg>
  `;
  const footerBuffer = renderTextPng(footerSvg, width);

  const finalBuffer = await sharp({
    create: {
      width,
      height: width + headerHeight + footerHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: headerLogoBuffer, left: headerPadding, top: logoTop },
      { input: textBuffer, left: 0, top: 0 },
      { input: qrWithIcon, left: 0, top: headerHeight },
      { input: footerBuffer, left: 0, top: headerHeight + width }
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${finalBuffer.toString("base64")}`;
}

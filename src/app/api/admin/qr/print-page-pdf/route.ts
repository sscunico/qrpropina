import { NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { requireAdmin } from "@/lib/auth";
import { createAdminQrRecordsBulk, generateBulkQrIds } from "@/lib/db";
import { qrDataUrl } from "@/lib/qrcode";
import { appUrl } from "@/lib/env";

const ROWS = 5;
const COLUMNS = 3;
const PAGE_COUNT_OPTIONS = [1, 5, 10];
const MM_TO_PT = 72 / 25.4;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const CELL_FILL_RATIO_WIDTH = 0.9;
const CELL_VERTICAL_GAP_RATIO = 0.02; // 2% arriba + 2% abajo
const IMAGE_SCALE = 0.95; // imagen 5% más chica dentro de su espacio disponible
const IMAGE_CONCURRENCY = 4; // evita picos de memoria/CPU en hosting compartido con muchos QR

function mmToPt(mm: number) {
  return mm * MM_TO_PT;
}

function normalizePageCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return PAGE_COUNT_OPTIONS.includes(parsed) ? parsed : 1;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: Request) {
  await requireAdmin();

  const body = await request.json().catch(() => ({}));
  const pageCount = normalizePageCount(body?.pages);
  const totalQr = ROWS * COLUMNS * pageCount;

  // Generamos los IDs y armamos el PDF ANTES de tocar la base: si algo falla o
  // tarda demasiado en esta etapa (la más pesada, CPU-bound), no queda ningún
  // QR huérfano creado sin haberse llegado a imprimir.
  const qrIds = generateBulkQrIds(totalQr);

  const images = await mapWithConcurrency(qrIds, IMAGE_CONCURRENCY, async (qrId) => {
    const url = `${appUrl()}/q/${qrId}?AI=True`;
    const dataUrl = await qrDataUrl(url);
    const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
    const metadata = await sharp(buffer).metadata();
    return { buffer, width: metadata.width ?? 1, height: metadata.height ?? 1 };
  });

  const pageWidthPt = mmToPt(PAGE_WIDTH_MM);
  const pageHeightPt = mmToPt(PAGE_HEIGHT_MM);
  const marginPt = mmToPt(PAGE_MARGIN_MM);
  const usableWidthPt = pageWidthPt - marginPt * 2;
  const usableHeightPt = pageHeightPt - marginPt * 2;
  const columnWidthPt = usableWidthPt / COLUMNS;
  const rowHeightPt = usableHeightPt / ROWS;
  const cellWidthPt = columnWidthPt * CELL_FILL_RATIO_WIDTH;
  const cellHeightPt = rowHeightPt * (1 - CELL_VERTICAL_GAP_RATIO * 2);

  const pdfDoc = await PDFDocument.create();

  for (let p = 0; p < pageCount; p++) {
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    const pageImages = images.slice(p * ROWS * COLUMNS, (p + 1) * ROWS * COLUMNS);

    for (let index = 0; index < pageImages.length; index++) {
      const image = pageImages[index];
      const row = Math.floor(index / COLUMNS);
      const column = index % COLUMNS;

      const aspect = image.height / image.width;
      let widthPt = cellWidthPt;
      let heightPt = widthPt * aspect;
      if (heightPt > cellHeightPt) {
        heightPt = cellHeightPt;
        widthPt = heightPt / aspect;
      }
      widthPt *= IMAGE_SCALE;
      heightPt *= IMAGE_SCALE;

      const cellLeft = marginPt + column * columnWidthPt;
      const cellTop = marginPt + row * rowHeightPt;
      const x = cellLeft + (columnWidthPt - widthPt) / 2;
      // pdf-lib usa origen abajo-izquierda; convertimos desde el offset superior calculado.
      const y = pageHeightPt - cellTop - rowHeightPt + (rowHeightPt - heightPt) / 2;

      const pngImage = await pdfDoc.embedPng(image.buffer);
      page.drawImage(pngImage, { x, y, width: widthPt, height: heightPt });
    }
  }

  const pdfBytes = await pdfDoc.save();

  // El PDF ya está armado con éxito: recién ahora persistimos los QR, en un
  // único insert masivo en vez de un round-trip por registro.
  await createAdminQrRecordsBulk(qrIds, { isAutoInstallable: true, isBulkPrint: true });

  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qrpropina-pagina-qr-${date}.pdf"`
    }
  });
}

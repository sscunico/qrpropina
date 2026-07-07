import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  Document,
  Packer,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  Paragraph,
  TextRun,
  WidthType,
  VerticalAlign,
  AlignmentType,
  HeightRule,
  BorderStyle,
  TableLayoutType,
  convertMillimetersToTwip
} from "docx";
import { requireAdmin } from "@/lib/auth";
import { createAdminQrRecord } from "@/lib/db";
import { qrDataUrl } from "@/lib/qrcode";
import { appUrl } from "@/lib/env";

const ROWS = 5;
const COLUMNS = 3;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const CELL_FILL_RATIO_WIDTH = 0.9;
const CELL_VERTICAL_GAP_RATIO = 0.02; // 2% arriba + 2% abajo
const IMAGE_SCALE = 0.95; // imagen 5% más chica dentro de su espacio disponible
const TRAILER_TWIP = 20; // espacio reservado para el párrafo final que Word exige después de la tabla

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const NO_TABLE_BORDERS = {
  ...NO_CELL_BORDERS,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER
};

function mmToPx(mm: number) {
  return Math.round((mm / 25.4) * 96);
}

function twipToMm(twip: number) {
  return (twip / 1440) * 25.4;
}

export async function POST() {
  await requireAdmin();

  const records = [];
  for (let i = 0; i < ROWS; i++) {
    records.push(await createAdminQrRecord({ isAutoInstallable: true, isBulkPrint: true }));
  }

  const images = await Promise.all(
    records.map(async (record) => {
      const url = `${appUrl()}/q/${record.qrId}?AI=True`;
      const dataUrl = await qrDataUrl(url);
      const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
      const metadata = await sharp(buffer).metadata();
      return { buffer, width: metadata.width ?? 1, height: metadata.height ?? 1 };
    })
  );

  const usableWidthMm = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const usableHeightMm = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const usableWidthTwip = convertMillimetersToTwip(usableWidthMm);
  const usableHeightTwip = convertMillimetersToTwip(usableHeightMm) - TRAILER_TWIP;
  const columnWidthTwip = Math.floor(usableWidthTwip / COLUMNS);
  const rowHeightTwip = Math.floor(usableHeightTwip / ROWS);
  const columnWidthMm = twipToMm(columnWidthTwip);
  const rowHeightMm = twipToMm(rowHeightTwip);
  const cellWidthMm = columnWidthMm * CELL_FILL_RATIO_WIDTH;
  const cellHeightMm = rowHeightMm * (1 - CELL_VERTICAL_GAP_RATIO * 2);

  const tableRows = images.map((image) => {
    const aspect = image.height / image.width;
    let widthMm = cellWidthMm;
    let heightMm = widthMm * aspect;
    if (heightMm > cellHeightMm) {
      heightMm = cellHeightMm;
      widthMm = heightMm / aspect;
    }
    const widthPx = mmToPx(widthMm * IMAGE_SCALE);
    const heightPx = mmToPx(heightMm * IMAGE_SCALE);

    const cells = Array.from({ length: COLUMNS }, () =>
      new TableCell({
        width: { size: columnWidthTwip, type: WidthType.DXA },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_CELL_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: 240, lineRule: "auto" },
            children: [
              new ImageRun({
                data: image.buffer,
                transformation: { width: widthPx, height: heightPx },
                type: "png"
              })
            ]
          })
        ]
      })
    );

    return new TableRow({
      height: { value: rowHeightTwip, rule: HeightRule.EXACT },
      children: cells,
      cantSplit: true
    });
  });

  const table = new Table({
    width: { size: usableWidthTwip, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    borders: NO_TABLE_BORDERS,
    rows: tableRows
  });

  // Word exige un párrafo después de la última tabla del documento; lo dejamos
  // explícito y mínimo para que no sea Word quien agregue uno más alto y empuje
  // el contenido a una segunda página.
  const trailerParagraph = new Paragraph({
    spacing: { before: 0, after: 0, line: 1, lineRule: "exact" },
    children: [new TextRun({ text: "", size: 2 })]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(PAGE_WIDTH_MM),
              height: convertMillimetersToTwip(PAGE_HEIGHT_MM)
            },
            margin: {
              top: convertMillimetersToTwip(PAGE_MARGIN_MM),
              bottom: convertMillimetersToTwip(PAGE_MARGIN_MM),
              left: convertMillimetersToTwip(PAGE_MARGIN_MM),
              right: convertMillimetersToTwip(PAGE_MARGIN_MM)
            }
          }
        },
        children: [table, trailerParagraph]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="qrpropina-pagina-qr-${date}.docx"`
    }
  });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { exportDbSnapshot } from "@/lib/db";

function backupFilename() {
  const date = new Date().toISOString().slice(0, 10);
  return `qrpropina-backup-${date}.json`;
}

export async function GET() {
  await requireAdmin();

  const snapshot = await exportDbSnapshot();

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="${backupFilename()}"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

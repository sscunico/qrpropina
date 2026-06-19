import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkMercadoPagoAlias, getAppSettings } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const settings = await getAppSettings();
  if (!settings.showMercadoPagoIntegration) {
    return NextResponse.json({ error: "Integracion de Mercado Pago oculta." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const alias = searchParams.get("alias") || "";
  const exceptCreatorId = searchParams.get("exceptCreatorId");
  const result = await checkMercadoPagoAlias(alias, exceptCreatorId);

  return NextResponse.json({
    ...result,
    note:
      "Esta búsqueda valida formato y duplicados dentro de qrpropina. La conexión real de Mercado Pago se confirma con OAuth."
  });
}

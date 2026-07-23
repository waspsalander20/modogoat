import { NextResponse } from "next/server";
import { getEstadisticasPoblacionales } from "@/lib/dashboardStats";

export async function GET() {
  const estadisticas = await getEstadisticasPoblacionales();
  return NextResponse.json(estadisticas);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ActivarBody {
  activo: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { activo } = (await request.json()) as ActivarBody;

  await prisma.jugador.update({ where: { id }, data: { activo } });

  return NextResponse.json({ ok: true });
}

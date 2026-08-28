import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { normalizarPais } from "@/lib/data/paises";
import { InformePDF, type PartidaResumenPDF } from "@/lib/pdf/InformePDF";

interface PdfBody {
  nombre: string;
  partidas: PartidaResumenPDF[];
  patrones: { perfilesRepetidos: string[]; alertasComunes: string[]; skillsComunes: string[] };
  areasDeMejora: { alerta: string; vecesPresente: number }[];
  mejoresDecisiones: {
    partidaId: string;
    anio: number;
    titulo: string;
    saltoIngreso: number;
    medallaDesbloqueada: string | null;
    narrativa: string | null;
  }[];
  lecciones: { partidaId: string; anio: number; titulo: string; leccion: string }[];
  diferencias: string;
  sintesis: string;
}

// El análisis (diferencias/sintesis) ya lo generó la IA una vez cuando la
// pantalla del informe llamó a POST /informe-comparativo — este endpoint NO
// vuelve a llamar a la IA, solo maqueta en PDF el mismo resultado que el
// cliente ya tiene en pantalla. Evita duplicar el costo/latencia de la IA
// cada vez que alguien descarga el PDF.
export async function POST(request: NextRequest, { params }: { params: Promise<{ jugadorId: string }> }) {
  const { jugadorId } = await params;
  const body = (await request.json()) as PdfBody;

  if (!body.nombre || !body.partidas || !body.diferencias || !body.sintesis) {
    return NextResponse.json({ error: "Datos de informe incompletos" }, { status: 400 });
  }

  const jugador = await prisma.jugador.findUnique({ where: { id: jugadorId } });
  if (!jugador) {
    return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    InformePDF({
      nombre: body.nombre,
      pais: normalizarPais(jugador.pais),
      partidas: body.partidas,
      patrones: body.patrones,
      areasDeMejora: body.areasDeMejora,
      mejoresDecisiones: body.mejoresDecisiones,
      lecciones: body.lecciones ?? [],
      diferencias: body.diferencias,
      sintesis: body.sintesis,
      generadoEl: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-modo-goat-${body.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf"`,
    },
  });
}

"use client";

interface FilaExport {
  id: string;
  nombre: string;
  edad: number;
  ciudad: string;
  pais: string;
  programa: string | null;
  perfilDominante: string | null;
  resultadoTipo: string | null;
  ingresoFinal: number | null;
  areaLibre: string | null;
  createdAt: Date | string;
}

const ENCABEZADOS = ["Nombre", "Edad", "Ciudad", "País", "Programa", "Perfil dominante", "Resultado", "Ingreso final", "Área de interés", "Fecha"];

function escaparCsv(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function generarCsv(filas: FilaExport[]): string {
  const cuerpo = filas.map((f) =>
    [
      f.nombre,
      f.edad.toString(),
      f.ciudad,
      f.pais,
      f.programa ?? "",
      f.perfilDominante ?? "",
      f.resultadoTipo ?? "",
      f.ingresoFinal?.toString() ?? "",
      f.areaLibre ?? "",
      new Date(f.createdAt).toISOString().slice(0, 10),
    ]
      .map(escaparCsv)
      .join(",")
  );
  return [ENCABEZADOS.join(","), ...cuerpo].join("\n");
}

export default function ExportButton({ partidas }: { partidas: FilaExport[] }) {
  function exportar() {
    // Excel abre CSV en UTF-8 sin el BOM asumiendo Latin-1 y rompe tildes —
    // el BOM (﻿) al inicio le indica que lo lea como UTF-8 real.
    const csv = "﻿" + generarCsv(partidas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `modo-goat-partidas-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportar}
      disabled={partidas.length === 0}
      className="text-xs font-bold rounded-full px-3 py-1.5 border border-goat-border text-goat-ink-muted hover:border-goat-accent-solid disabled:opacity-40 disabled:hover:border-goat-border"
    >
      Exportar CSV
    </button>
  );
}

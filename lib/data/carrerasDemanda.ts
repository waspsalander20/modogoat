import type { PaisId } from "@/lib/data/paises";

// Cruce de area_libre (texto libre que el jugador escribió) contra listas
// oficiales de carreras de alta demanda laboral — investigación 2 ago 2026,
// motivada por encontrar que PRONABEC (Beca 18, Perú) literalmente da
// puntaje adicional en su proceso de selección a postulantes admitidos en
// una carrera de alta demanda según su "Encuesta de Demanda Ocupacional".
// Es un dato real que instituciones de becas ya usan, no algo que
// inventamos — por eso vale la pena mostrarlo en el dashboard.
//
// Match por PALABRA CLAVE sobre texto libre, no una taxonomía cerrada — es
// necesariamente aproximado (area_libre es texto que el jugador escribió a
// su manera, ej. "negocios y ventas", "diseño gráfico"), así que se etiqueta
// como estimado en la UI, no como una clasificación oficial.
interface CategoriaDemanda {
  nombre: string;
  palabrasClave: string[];
}

// Colombia: Observatorio Laboral para la Educación (OLE), Ministerio de
// Educación — Ingeniería de Sistemas, Administración de Empresas, Derecho,
// Medicina, Psicología, Contabilidad, STEM/TIC, Ciencias de la Salud.
const DEMANDA_CO: CategoriaDemanda[] = [
  { nombre: "Sistemas / TIC / Datos", palabrasClave: ["sistema", "software", "programación", "programador", "desarroll", "análisis de dato", "analisis de dato", "tecnolog", "informátic", "informatic"] },
  { nombre: "Administración / Negocios", palabrasClave: ["administra", "negocio", "empresa", "gerenc", "gestión", "gestion"] },
  { nombre: "Derecho", palabrasClave: ["derecho", "abogad", "legal", "jurídic", "juridic"] },
  { nombre: "Medicina / Ciencias de la salud", palabrasClave: ["medicin", "médic", "medic", "salud", "clínic", "clinic"] },
  { nombre: "Enfermería", palabrasClave: ["enfermer"] },
  { nombre: "Psicología", palabrasClave: ["psicolog"] },
  { nombre: "Contabilidad / Finanzas", palabrasClave: ["contabilidad", "contador", "finanza", "tributari"] },
  { nombre: "Ingeniería", palabrasClave: ["ingenier"] },
];

// Perú: PRONABEC, Encuesta de Demanda Ocupacional 2026 (carreras técnicas
// con puntaje adicional en Beca 18) — Mecánica/Metalurgia, Gestión y
// Administración, Contabilidad/Tributación, Electricidad/Energía, Sistemas
// y Computación, Marketing/Publicidad, Enfermería, Construcción/Ing. Civil.
const DEMANDA_PE: CategoriaDemanda[] = [
  { nombre: "Mecánica / Metalurgia", palabrasClave: ["mecánic", "mecanic", "metalurg", "automotriz"] },
  { nombre: "Gestión / Administración", palabrasClave: ["gestión", "gestion", "administra", "negocio", "empresa"] },
  { nombre: "Contabilidad / Tributación", palabrasClave: ["contabilidad", "contador", "tributari", "finanza"] },
  { nombre: "Electricidad / Energía", palabrasClave: ["electric", "energ"] },
  { nombre: "Sistemas / Computación", palabrasClave: ["sistema", "computación", "computacion", "software", "programación", "programador", "desarroll", "tecnolog"] },
  { nombre: "Marketing / Publicidad", palabrasClave: ["marketing", "publicidad", "mercadeo"] },
  { nombre: "Enfermería", palabrasClave: ["enfermer"] },
  { nombre: "Construcción / Ing. Civil", palabrasClave: ["construcción", "construccion", "civil", "arquitect"] },
];

const DEMANDA_POR_PAIS: Record<PaisId, CategoriaDemanda[]> = { CO: DEMANDA_CO, PE: DEMANDA_PE };

export function clasificarAreaLibre(areaLibre: string, pais: PaisId): string | null {
  const texto = areaLibre.toLowerCase();
  const categorias = DEMANDA_POR_PAIS[pais] ?? DEMANDA_CO;
  for (const categoria of categorias) {
    if (categoria.palabrasClave.some((palabra) => texto.includes(palabra))) return categoria.nombre;
  }
  return null;
}

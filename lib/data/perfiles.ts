import type { PerfilId } from "@/lib/types";

export const NOMBRES_PERFIL: Record<PerfilId, string> = {
  EMP: "Empleado / Operador",
  INV: "Investigador / Salud-Social",
  EMP2: "Emprendedor",
  FREE: "Freelancer / Técnico-Creador",
  CRE: "Creador de contenidos",
};

export const CARGOS_POR_PERFIL: Record<PerfilId, string[]> = {
  EMP: ["Coordinador/a de operaciones", "Líder de equipo", "Gerente de área", "Jefe/a de proyecto"],
  INV: ["Investigador/a", "Analista de políticas públicas", "Profesional en salud", "Especialista técnico/a"],
  EMP2: ["Fundador/a de tu propio negocio", "Director/a comercial", "Socio/a de una startup", "Consultor/a independiente"],
  FREE: ["Freelancer especializado/a", "Consultor/a técnico/a", "Desarrollador/a independiente", "Diseñador/a freelance"],
  CRE: ["Creador/a de contenido", "Productor/a audiovisual", "Estratega de marca personal", "Community manager senior"],
};

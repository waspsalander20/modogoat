import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet, Svg, Defs, LinearGradient, Stop, Rect, Font } from "@react-pdf/renderer";
import { formatoPesos } from "@/lib/format";
import { medalla } from "@/lib/data/medallas";
import type { Medalla, PerfilId } from "@/lib/types";
import { nombreSkill } from "@/lib/data/skills";
import { NOMBRES_PERFIL } from "@/lib/data/perfiles";
import { NOMBRES_ALERTA } from "@/lib/data/alertas";
import type { PaisId } from "@/lib/data/paises";
import { DURACION_ANIOS } from "@/lib/motor";

const FONT_DIR = path.join(process.cwd(), "lib/pdf/fonts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

Font.register({
  family: "Nunito",
  fonts: [
    { src: path.join(FONT_DIR, "Nunito-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Nunito-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(FONT_DIR, "Nunito-Bold.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "Nunito-ExtraBold.ttf"), fontWeight: 800 },
    { src: path.join(FONT_DIR, "Nunito-Black.ttf"), fontWeight: 900 },
  ],
});

const INK = "#161616";
const SECUNDARIO = "#e96d00";
const BG_FROM = "#fdba05";
const BG_TO = "#e45603";
const CARD_FROM = "#fff8e4";
const CARD_TO = "#ffebb7";

const NIVEL_ORDEN: Record<Medalla["nivel"], number> = { goat: 4, platino: 3, oro: 2, plata: 1, bronce: 0 };

// react-pdf renderea con pdfkit, no con un motor de navegador — no hay
// fallback de fuente para emoji, así que cualquier glifo que la fuente
// Nunito no tenga (todos los emoji) sale corrupto y corre el texto que le
// sigue. La versión web (ReactMarkdown/JSX normal) sí puede mostrarlos
// porque el navegador sí resuelve ese fallback; acá tocan quitarse.
//
// Aparte, react-pdf/fontkit forma ligaduras "fi"/"fl"/"ff" por defecto y su
// algoritmo de word-wrap pierde el carácter cuando la ligadura cae cerca de
// un salto de línea (bug real de la librería, no de la fuente) — "perfil"
// sale "perfl", "final" sale "fnal". Se rompe insertando un ZWNJ (invisible,
// no cambia cómo se ve el texto) entre la f y la i/l/f siguiente.
function limpiarTexto(texto: string): string {
  return texto
    .replace(/\p{Extended_Pictographic}️?/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/f(?=[fil])/g, "f‌");
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Nunito",
    color: INK,
    fontSize: 10.5,
    paddingBottom: 46,
  },
  letterhead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 20,
    position: "relative",
    height: 64,
  },
  letterheadBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  logo: { height: 26, width: "auto" },
  docLabel: { alignItems: "flex-end" },
  docLabelMain: { fontSize: 9, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.6 },
  docLabelSub: { fontSize: 8, fontWeight: 600, color: "#ffffff", opacity: 0.85, marginTop: 2 },

  body: { paddingHorizontal: 32 },

  sectionTitle: { fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: SECUNDARIO, marginBottom: 6 },

  card: { borderRadius: 14, padding: 16, marginBottom: 14, position: "relative", overflow: "hidden" },
  cardBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  caminoRow: { flexDirection: "column", gap: 2, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  caminoRowLast: { borderBottomWidth: 0 },
  caminoLinea1: { flexDirection: "row", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700 },
  caminoResultado: { fontWeight: 900, textTransform: "capitalize", color: SECUNDARIO },
  caminoMedallas: { fontSize: 8.5, opacity: 0.7, marginTop: 1 },

  medalItem: { marginBottom: 6 },
  medalNombre: { fontSize: 9.5, fontWeight: 800 },
  medalCondicion: { fontSize: 8.5, opacity: 0.65, marginTop: 1 },
  medalCount: { fontSize: 8.5, opacity: 0.6, marginTop: 6 },

  listItem: { flexDirection: "row", fontSize: 9.5, lineHeight: 1.5, marginBottom: 4 },
  bullet: { width: 12, fontWeight: 900 },
  bulletCheck: { color: "#2f8f1e" },
  bulletDot: { color: SECUNDARIO },
  listText: { flex: 1 },

  prose: { fontSize: 9.5, lineHeight: 1.55 },
  proseP: { marginBottom: 7 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#9a9a9a",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 6,
  },

  coverKicker: {
    alignSelf: "center",
    fontSize: 8.5,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: SECUNDARIO,
    backgroundColor: "#fff3e0",
    borderWidth: 1,
    borderColor: "#ffd9a8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  coverTitle: { fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 8, lineHeight: 1.2 },
  coverSubt: { fontSize: 10, fontWeight: 600, color: "#4a4a4a", textAlign: "center", maxWidth: 380, alignSelf: "center", lineHeight: 1.5 },
  coverFacts: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 22 },
  coverFact: { alignItems: "center", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, minWidth: 90, position: "relative", overflow: "hidden" },
  coverFactNum: { fontSize: 18, fontWeight: 900, color: SECUNDARIO },
  coverFactLbl: { fontSize: 7.5, fontWeight: 700, color: "#6b5a3a", textTransform: "uppercase", letterSpacing: 0.3, marginTop: 2, textAlign: "center" },
});

function GradientRect({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <Svg style={styles.letterheadBg} width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function Letterhead({ nombre }: { nombre: string }) {
  return (
    <View style={styles.letterhead} fixed>
      <GradientRect id="letterheadGrad" from={BG_FROM} to={BG_TO} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image acá es de @react-pdf/renderer, no <img>; no aplica accesibilidad */}
      <Image src={path.join(PUBLIC_DIR, "logo-mark.png")} style={styles.logo} />
      <View style={styles.docLabel}>
        <Text style={styles.docLabelMain}>{nombre}</Text>
        <Text style={styles.docLabelSub}>Informe completo</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Modo GOAT — Informe generado automáticamente</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      <View style={styles.card} wrap={false}>
        <GradientRect id={`card-${titulo}`} from={CARD_FROM} to={CARD_TO} />
        {children}
      </View>
    </View>
  );
}

// La IA solo produce "markdown simple" (párrafos + **negrita**, ver
// construirSystemPromptAnalisisComparativo en aiMotor.ts) — no hace falta
// un parser de markdown completo, react-pdf tampoco soporta HTML/markdown
// crudo como ReactMarkdown en la versión web.
function Prosa({ texto }: { texto: string }) {
  const parrafos = limpiarTexto(texto).split(/\n\n+/).filter(Boolean);
  return (
    <View style={styles.prose}>
      {parrafos.map((p, i) => (
        <Text key={i} style={styles.proseP}>
          {p.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
            parte.startsWith("**") && parte.endsWith("**") ? (
              <Text key={j} style={{ fontWeight: 800 }}>
                {parte.slice(2, -2)}
              </Text>
            ) : (
              parte
            )
          )}
        </Text>
      ))}
    </View>
  );
}

export interface PartidaResumenPDF {
  id: string;
  perfilDominante: string | null;
  resultadoTipo: string | null;
  ingresoFinal: number | null;
  medallasGanadas: string[];
  analisisFinal: string | null;
}

export interface InformePDFProps {
  nombre: string;
  pais: PaisId;
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
  generadoEl: string;
}

export function InformePDF({
  nombre,
  pais,
  partidas,
  patrones,
  areasDeMejora,
  mejoresDecisiones,
  lecciones,
  diferencias,
  sintesis,
  generadoEl,
}: InformePDFProps) {
  const medallasAcumuladas = [...new Set(partidas.flatMap((p) => p.medallasGanadas))]
    .map((id) => medalla(id))
    .filter((m): m is Medalla => !!m)
    .sort((a, b) => NIVEL_ORDEN[b.nivel] - NIVEL_ORDEN[a.nivel]);

  // Cada partida dura DURACION_ANIOS años por diseño (mismo valor para
  // todas, no varía por camino) — usar el rango de mejoresDecisiones acá
  // era incorrecto: esa lista trae solo la MEJOR decisión de cada camino,
  // no todo el rango real jugado.
  const rangoAnios = DURACION_ANIOS;

  const mostrarPatrones =
    partidas.length >= 2 &&
    (patrones.perfilesRepetidos.length > 0 || patrones.alertasComunes.length > 0 || patrones.skillsComunes.length > 0);

  return (
    <Document title={`Informe completo — ${nombre}`} author="Modo GOAT">
      <Page size="A4" style={styles.page}>
        <Letterhead nombre={nombre} />
        <View style={styles.body}>
          <Text style={styles.coverKicker}>
            Informe completo · {partidas.length} camino{partidas.length === 1 ? "" : "s"} recorrido{partidas.length === 1 ? "" : "s"}
          </Text>
          <Text style={styles.coverTitle}>{`El análisis de los caminos\nde ${nombre}`}</Text>
          <Text style={styles.coverSubt}>
            Un resumen de lo que descubriste sobre ti mismo jugando Modo GOAT — construido a partir de tus
            decisiones reales, no de un cuestionario que respondiste una sola vez.
          </Text>

          <View style={styles.coverFacts}>
            <View style={styles.coverFact}>
              <GradientRect id="fact1" from={CARD_FROM} to={CARD_TO} />
              <Text style={styles.coverFactNum}>{partidas.length}</Text>
              <Text style={styles.coverFactLbl}>{"Caminos\njugados"}</Text>
            </View>
            <View style={styles.coverFact}>
              <GradientRect id="fact2" from={CARD_FROM} to={CARD_TO} />
              <Text style={styles.coverFactNum}>{medallasAcumuladas.length}</Text>
              <Text style={styles.coverFactLbl}>{"Medallas\nganadas"}</Text>
            </View>
            {Number.isFinite(rangoAnios) && (
              <View style={styles.coverFact}>
                <GradientRect id="fact3" from={CARD_FROM} to={CARD_TO} />
                <Text style={styles.coverFactNum}>{rangoAnios}</Text>
                <Text style={styles.coverFactLbl}>{"Años de\nsimulación"}</Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 30 }}>
            <Tarjeta titulo="Resumen de tus partidas">
              {partidas.map((p, i) => (
                <View key={p.id} style={[styles.caminoRow, i === partidas.length - 1 ? styles.caminoRowLast : {}]}>
                  <View style={styles.caminoLinea1}>
                    <Text>
                      Camino {i + 1} — {limpiarTexto(p.perfilDominante ? NOMBRES_PERFIL[p.perfilDominante as PerfilId] : "Sin perfil")}
                    </Text>
                    <Text style={styles.caminoResultado}>
                      {p.resultadoTipo ?? "—"}
                      {p.ingresoFinal ? ` · ${formatoPesos(p.ingresoFinal, pais)}` : ""}
                    </Text>
                  </View>
                  {p.medallasGanadas.length > 0 && (
                    <Text style={styles.caminoMedallas}>
                      {p.medallasGanadas
                        .map((id) => medalla(id))
                        .filter((m): m is Medalla => !!m)
                        .map((m) => limpiarTexto(m.nombre))
                        .join(" · ")}
                    </Text>
                  )}
                </View>
              ))}
            </Tarjeta>
          </View>
        </View>
        <Footer />
      </Page>

      {partidas.some((p) => p.analisisFinal) && (
        <Page size="A4" style={styles.page}>
          <Letterhead nombre={nombre} />
          <View style={styles.body}>
            {partidas.map((p, i) =>
              p.analisisFinal ? (
                <Tarjeta
                  key={p.id}
                  titulo={`Camino ${i + 1} en detalle — ${limpiarTexto(p.perfilDominante ? NOMBRES_PERFIL[p.perfilDominante as PerfilId] : "Sin perfil")}`}
                >
                  <Prosa texto={p.analisisFinal} />
                </Tarjeta>
              ) : null
            )}
          </View>
          <Footer />
        </Page>
      )}

      <Page size="A4" style={styles.page}>
        <Letterhead nombre={nombre} />
        <View style={styles.body}>
          {medallasAcumuladas.length > 0 && (
            <Tarjeta titulo="Todas tus medallas">
              {medallasAcumuladas.map((m) => (
                <View key={m.id} style={styles.medalItem}>
                  <Text style={styles.medalNombre}>{limpiarTexto(m.nombre)}</Text>
                  <Text style={styles.medalCondicion}>{limpiarTexto(m.condicion)}</Text>
                </View>
              ))}
              <Text style={styles.medalCount}>
                {medallasAcumuladas.length} medalla{medallasAcumuladas.length === 1 ? "" : "s"} distinta
                {medallasAcumuladas.length === 1 ? "" : "s"} en {partidas.length} camino{partidas.length === 1 ? "" : "s"}
              </Text>
            </Tarjeta>
          )}

          {mostrarPatrones && (
            <Tarjeta titulo="Lo que se repitió en todos tus caminos">
              {patrones.perfilesRepetidos.map((p) => (
                <View key={p} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletCheck]}>•</Text>
                  <Text style={styles.listText}>Siempre te inclinaste hacia {limpiarTexto(NOMBRES_PERFIL[p as PerfilId] ?? p)}</Text>
                </View>
              ))}
              {patrones.skillsComunes.map((s) => (
                <View key={s} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletCheck]}>•</Text>
                  <Text style={styles.listText}>Desarrollaste {limpiarTexto(nombreSkill(s))} en todos tus caminos</Text>
                </View>
              ))}
              {patrones.alertasComunes.map((a) => (
                <View key={a} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletCheck]}>•</Text>
                  <Text style={styles.listText}>{limpiarTexto(NOMBRES_ALERTA[a] ?? a)}</Text>
                </View>
              ))}
            </Tarjeta>
          )}

          <Tarjeta titulo="En qué se diferenciaron">
            <Prosa texto={diferencias} />
          </Tarjeta>

          {mejoresDecisiones.length > 0 && (
            <Tarjeta titulo="Decisiones que más te ayudaron">
              {mejoresDecisiones.map((d, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletDot]}>•</Text>
                  <Text style={styles.listText}>
                    <Text style={{ fontWeight: 800 }}>{limpiarTexto(d.titulo)}</Text> (año {d.anio})
                    {d.saltoIngreso > 0 ? ` — subió tu ingreso ${formatoPesos(d.saltoIngreso, pais)}` : ""}
                    {d.medallaDesbloqueada && ` · desbloqueó ${limpiarTexto(medalla(d.medallaDesbloqueada)?.nombre ?? d.medallaDesbloqueada)}`}
                    {d.narrativa && `\n${limpiarTexto(d.narrativa)}`}
                  </Text>
                </View>
              ))}
            </Tarjeta>
          )}

          {lecciones.length > 0 && (
            <Tarjeta titulo="Lecciones aprendidas">
              {lecciones.map((l, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletDot]}>•</Text>
                  <Text style={styles.listText}>
                    <Text style={{ fontWeight: 800 }}>{limpiarTexto(l.titulo)}</Text> (año {l.anio})
                    {`\n${limpiarTexto(l.leccion)}`}
                  </Text>
                </View>
              ))}
            </Tarjeta>
          )}

          {areasDeMejora.length > 0 && (
            <Tarjeta titulo="Qué todavía puedes mejorar">
              {areasDeMejora.map((a) => (
                <View key={a.alerta} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.bulletDot]}>•</Text>
                  <Text style={styles.listText}>
                    {limpiarTexto(NOMBRES_ALERTA[a.alerta] ?? a.alerta)} (en {a.vecesPresente} de tus caminos)
                  </Text>
                </View>
              ))}
            </Tarjeta>
          )}

          <Tarjeta titulo="En resumen">
            <Prosa texto={sintesis} />
          </Tarjeta>

          <View style={{ alignItems: "center", marginTop: 24 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image acá es de @react-pdf/renderer, no <img>; no aplica accesibilidad */}
            <Image src={path.join(PUBLIC_DIR, "logo-mark.png")} style={{ width: 100, height: "auto", marginBottom: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: 900, marginBottom: 4 }}>Gracias por jugar Modo GOAT</Text>
            <Text style={{ fontSize: 8.5, color: "#666666", textAlign: "center", maxWidth: 340, lineHeight: 1.5 }}>
              Este informe se genera a partir de tus decisiones reales dentro del juego, cruzadas con investigación
              citada sobre desarrollo vocacional juvenil — no es un test que se responde una sola vez. Generado el{" "}
              {generadoEl}.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

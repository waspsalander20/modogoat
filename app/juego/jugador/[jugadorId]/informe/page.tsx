import InformeComparativoClient from "./InformeComparativoClient";

export default async function InformeComparativoPage({ params }: { params: Promise<{ jugadorId: string }> }) {
  const { jugadorId } = await params;
  return <InformeComparativoClient jugadorId={jugadorId} />;
}

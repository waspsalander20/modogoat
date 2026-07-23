import { PartidaHeaderProvider } from "./PartidaHeaderContext";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default async function PartidaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PartidaHeaderProvider key={id} partidaId={id}>
      <div className="flex flex-1 flex-col min-h-full">
        <Header />
        <div className="flex-1 flex flex-col bg-goat-bg">{children}</div>
        <BottomNav partidaId={id} />
      </div>
    </PartidaHeaderProvider>
  );
}

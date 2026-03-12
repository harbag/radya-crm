import dynamic from "next/dynamic";

// @hello-pangea/dnd requires client-only rendering
const DealsKanban = dynamic(
  () => import("@/components/deals/deals-kanban"),
  { ssr: false }
);

export default function DealsPage() {
  return <DealsKanban />;
}

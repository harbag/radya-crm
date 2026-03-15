"use client";

import DealsView from "@/components/deals/deals-view";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";

export default function DealsPage() {
  const openDetail = useDetailPanelStore((s) => s.open);
  return <DealsView onRowClick={(row) => openDetail("deal", row.id)} />;
}

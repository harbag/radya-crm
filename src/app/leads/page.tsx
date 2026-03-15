"use client";

import LeadsView from "@/components/leads/leads-view";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";

export default function LeadsPage() {
  const openDetail = useDetailPanelStore((s) => s.open);
  return <LeadsView onRowClick={(row) => openDetail("lead", row.id)} />;
}

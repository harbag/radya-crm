"use client";

import CompaniesView from "@/components/companies/companies-view";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";

export default function CompaniesPage() {
  const openDetail = useDetailPanelStore((s) => s.open);
  return (
    <CompaniesView onRowClick={(row) => openDetail("company", row.id)} />
  );
}

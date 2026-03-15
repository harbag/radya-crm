"use client";

import ContactsView from "@/components/contacts/contacts-view";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";

export default function ContactsPage() {
  const openDetail = useDetailPanelStore((s) => s.open);
  return (
    <ContactsView onRowClick={(row) => openDetail("contact", row.id)} />
  );
}

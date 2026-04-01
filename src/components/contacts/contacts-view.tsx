"use client";

import React from "react";
import ContactsGrid from "./contacts-grid";

export default function ContactsView({
  onRowClick,
}: {
  onRowClick?: (row: { id: string }) => void;
}) {
  return <ContactsGrid onRowClick={onRowClick} />;
}

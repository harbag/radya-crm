"use client";

import React from "react";
import CompaniesGrid from "./companies-grid";

export default function CompaniesView({
  onRowClick,
}: {
  onRowClick?: (row: { id: string }) => void;
}) {
  return <CompaniesGrid onRowClick={onRowClick} />;
}

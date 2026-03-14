"use client";

import dynamic from "next/dynamic";

const DealsKanban = dynamic(() => import("./deals-kanban"), { ssr: false });

export default function DealsKanbanClient() {
  return <DealsKanban />;
}

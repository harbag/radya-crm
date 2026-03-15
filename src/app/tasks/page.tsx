"use client";

import TasksView from "@/components/tasks/tasks-view";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";

export default function TasksPage() {
  const openDetail = useDetailPanelStore((s) => s.open);
  return <TasksView onRowClick={(row) => openDetail("task", row.id)} />;
}

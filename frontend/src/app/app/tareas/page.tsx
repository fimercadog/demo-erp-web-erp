"use client";

import { ModuleTablePage } from "@/components/module-table-page";
import { ToggleCompleteAction } from "@/components/crud/toggle-complete-action";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateColumn, AppColumnDef } from "@/lib/table-types";
import { ACTIVITY_TYPE_LABEL, activityFields } from "@/lib/activity-fields";
import { ActivityRow } from "@/lib/types";

const columns: AppColumnDef<ActivityRow>[] = [
  { accessorKey: "subject", header: "Asunto" },
  { header: "Tipo", cell: ({ row }) => <StatusBadge status={row.original.type} label={ACTIVITY_TYPE_LABEL[row.original.type] ?? row.original.type} /> },
  { header: "Cliente", cell: ({ row }) => row.original.client?.name ?? "—" },
  dateColumn<ActivityRow>("due_date", "Vencimiento"),
];

export default function TasksPage() {
  return (
    <ModuleTablePage<ActivityRow>
      title="Tareas"
      description="Actividades pendientes del equipo comercial."
      resource="/activities"
      params={{ completed: 0 }}
      columns={columns}
      fields={activityFields(["task", "call", "meeting", "email", "followup"])}
      actionLabel="Nueva tarea"
      modalDescription="Queda como pendiente hasta marcarla completada."
      editable={false}
      extraRowActions={(row, refresh) => (
        <ToggleCompleteAction resource="/activities" id={row.id} completed={row.completed} refresh={refresh} />
      )}
    />
  );
}

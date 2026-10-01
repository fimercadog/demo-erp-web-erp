"use client";

import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateColumn, AppColumnDef } from "@/lib/table-types";
import { ACTIVITY_TYPE_LABEL, activityFields } from "@/lib/activity-fields";
import { ActivityRow } from "@/lib/types";

const columns: AppColumnDef<ActivityRow>[] = [
  { accessorKey: "subject", header: "Asunto" },
  { header: "Tipo", cell: ({ row }) => <StatusBadge status={row.original.type} label={ACTIVITY_TYPE_LABEL[row.original.type] ?? row.original.type} /> },
  { header: "Cliente", cell: ({ row }) => row.original.client?.name ?? "—" },
  dateColumn<ActivityRow>("due_date", "Vencimiento"),
  { header: "Completada", cell: ({ row }) => <StatusBadge status={row.original.completed ? "active" : "inactive"} label={row.original.completed ? "Sí" : "No"} /> },
];

export default function ActivitiesPage() {
  return (
    <ModuleTablePage<ActivityRow>
      title="Actividades"
      description="Seguimiento comercial: llamadas, reuniones y notas por cliente o deal."
      resource="/activities"
      columns={columns}
      fields={activityFields()}
      actionLabel="Nueva actividad"
      modalDescription="Registro de seguimiento comercial."
    />
  );
}

"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Segment } from "@/lib/types";

const columns: AppColumnDef<Segment>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Clientes", cell: ({ row }) => row.original.clients_count ?? 0 },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  {
    name: "status",
    label: "Estado",
    type: "select",
    required: true,
    options: [
      { label: "Activo", value: "active" },
      { label: "Inactivo", value: "inactive" },
    ],
  },
];

export default function SegmentsPage() {
  return (
    <ModuleTablePage<Segment>
      title="Segmentos"
      description="Clasificacion de clientes (mayorista, minorista, institucional...)."
      resource="/segments"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo segmento"
      modalDescription="Agrupa clientes para filtrar y reportar."
    />
  );
}

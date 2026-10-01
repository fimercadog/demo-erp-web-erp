"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Diagnosis } from "@/lib/types";

const columns: AppColumnDef<Diagnosis>[] = [
  { header: "Código", cell: ({ row }) => row.original.code ?? "—" },
  { accessorKey: "name", header: "Diagnóstico" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "code", label: "Código", omitWhenEmpty: true },
  { name: "name", label: "Diagnóstico", required: true },
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

export default function DiagnosesPage() {
  return (
    <ModuleTablePage<Diagnosis>
      title="Diagnósticos"
      description="Catálogo de diagnósticos para asociar a las consultas."
      resource="/diagnoses"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo diagnóstico"
    />
  );
}

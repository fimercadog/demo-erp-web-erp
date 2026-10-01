"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Unit } from "@/lib/types";

const columns: AppColumnDef<Unit>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Abreviatura", cell: ({ row }) => row.original.abbreviation ?? "—" },
  { header: "Productos", cell: ({ row }) => row.original.products_count ?? 0 },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "abbreviation", label: "Abreviatura", omitWhenEmpty: true },
  {
    name: "status",
    label: "Estado",
    type: "select",
    required: true,
    options: [
      { label: "Activa", value: "active" },
      { label: "Inactiva", value: "inactive" },
    ],
  },
];

export default function UnitsPage() {
  return (
    <ModuleTablePage<Unit>
      title="Unidades de medida"
      description="Unidad, caja, kilogramo, litro y demas."
      resource="/units"
      columns={columns}
      fields={fields}
      actionLabel="Nueva unidad"
      modalDescription="Como se cuenta y se vende cada producto."
    />
  );
}

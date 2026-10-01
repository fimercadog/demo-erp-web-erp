"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Warehouse } from "@/lib/types";

const columns: AppColumnDef<Warehouse>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Ubicacion", cell: ({ row }) => row.original.location ?? "—" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "location", label: "Ubicacion", omitWhenEmpty: true },
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

export default function WarehousesPage() {
  return (
    <ModuleTablePage<Warehouse>
      title="Bodegas"
      description="Ubicaciones de almacenamiento del inventario."
      resource="/warehouses"
      columns={columns}
      fields={fields}
      actionLabel="Nueva bodega"
      modalDescription="Ubicacion fisica donde se guarda inventario."
    />
  );
}

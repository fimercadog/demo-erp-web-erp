"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Category } from "@/lib/types";

const columns: AppColumnDef<Category>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Productos", cell: ({ row }) => row.original.products_count ?? 0 },
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
      { label: "Activa", value: "active" },
      { label: "Inactiva", value: "inactive" },
    ],
  },
];

export default function CategoriesPage() {
  return (
    <ModuleTablePage<Category>
      title="Categorias"
      description="Clasificacion de productos por tipo."
      resource="/categories"
      columns={columns}
      fields={fields}
      actionLabel="Nueva categoria"
      modalDescription="Agrupa productos para filtrar y reportar."
    />
  );
}

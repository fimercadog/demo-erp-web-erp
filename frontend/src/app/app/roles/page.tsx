"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { CrudField } from "@/components/crud/crud-modal";
import { ToggleStatusAction } from "@/components/crud/toggle-status-action";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Role } from "@/lib/types";

const columns: AppColumnDef<Role>[] = [
  { accessorKey: "name", header: "Rol" },
  { header: "Permisos", cell: ({ row }) => row.original.permissions_count ?? 0 },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre del rol", required: true },
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

export default function AppRolesPage() {
  return (
    <ModuleTablePage
      title="Roles y permisos"
      description="Crea roles propios y define que puede hacer cada uno desde su detalle."
      resource="/roles"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo rol"
      modalDescription="Los permisos del rol se marcan despues, desde su detalle."
      extraRowActions={(row, refresh) => (
        <>
          <Link href={`/app/roles/${row.id}`} className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
            <Eye className="h-4 w-4" /> Permisos
          </Link>
          <ToggleStatusAction resource="/roles" id={row.id} active={row.status === "active"} refresh={refresh} />
        </>
      )}
    />
  );
}

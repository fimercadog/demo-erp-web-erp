"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { CashRegister } from "@/lib/types";

const columns: AppColumnDef<CashRegister>[] = [
  { header: "Nombre", accessorKey: "name" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "status", label: "Estado", type: "select", required: true, options: [{ label: "Activa", value: "active" }, { label: "Inactiva", value: "inactive" }] },
];

export default function CashRegistersPage() {
  return (
    <ModuleTablePage<CashRegister>
      title="Cajas"
      description="Cajas disponibles para apertura, movimientos y cierre."
      resource="/cash-registers"
      columns={columns}
      fields={fields}
      actionLabel="Nueva caja"
    />
  );
}

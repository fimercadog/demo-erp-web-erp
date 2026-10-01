"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { CashSession } from "@/lib/types";

const columns: AppColumnDef<CashSession>[] = [
  { header: "Caja", cell: ({ row }) => row.original.register?.name ?? `#${row.original.cash_register_id}` },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { header: "Inicial", cell: ({ row }) => `$${Number(row.original.opening_amount).toLocaleString("es-CO")}` },
  { header: "Esperado", cell: ({ row }) => `$${Number(row.original.expected_amount).toLocaleString("es-CO")}` },
  { header: "Diferencia", cell: ({ row }) => row.original.difference == null ? "—" : `$${Number(row.original.difference).toLocaleString("es-CO")}` },
];

const fields: CrudField[] = [
  { name: "cash_register_id", label: "Caja", type: "select", required: true, optionsResource: "/cash-registers" },
  { name: "opening_amount", label: "Monto inicial", type: "number", min: 0, step: 0.01, omitWhenEmpty: true },
  { name: "notes", label: "Notas", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
];

export default function CashSessionsPage() {
  return (
    <ModuleTablePage<CashSession>
      title="Sesiones de caja"
      description="Apertura y cierre de caja. Los pagos generan entradas o salidas cuando se asocian a una sesión abierta."
      resource="/cash-sessions"
      columns={columns}
      fields={fields}
      actionLabel="Abrir caja"
      editable={false}
    />
  );
}

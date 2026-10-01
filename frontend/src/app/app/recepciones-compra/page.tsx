"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateColumn, AppColumnDef } from "@/lib/table-types";
import { PurchaseReceipt } from "@/lib/types";

const columns: AppColumnDef<PurchaseReceipt>[] = [
  { header: "Orden", cell: ({ row }) => `#${row.original.purchase_order_id}` },
  { header: "Bodega", cell: ({ row }) => row.original.warehouse?.name ?? `#${row.original.warehouse_id}` },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  dateColumn<PurchaseReceipt>("received_at", "Fecha"),
  { header: "Notas", cell: ({ row }) => row.original.notes ?? "—" },
];

const fields: CrudField[] = [
  { name: "purchase_order_id", label: "ID orden de compra", type: "number", required: true, min: 1 },
  { name: "received_at", label: "Fecha", type: "date", omitWhenEmpty: true },
  { name: "notes", label: "Notas", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
];

export default function PurchaseReceiptsPage() {
  return (
    <ModuleTablePage<PurchaseReceipt>
      title="Recepciones"
      description="Recepciones de mercancía confirmadas. Para recepciones parciales con líneas usa el API o el detalle de la orden."
      resource="/purchase-receipts"
      columns={columns}
      fields={fields}
      actionLabel="Nueva recepción"
      modalDescription="Captura la cabecera. Las recepciones parciales con líneas se registran desde el flujo avanzado/API."
      editable={false}
    />
  );
}

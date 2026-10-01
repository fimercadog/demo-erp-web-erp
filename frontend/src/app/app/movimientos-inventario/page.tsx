"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { dateColumn, AppColumnDef } from "@/lib/table-types";
import { StockMovement } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
  COMPRA: "Compra",
  VENTA: "Venta",
  DEVOLUCION_COMPRA: "Devolución compra",
  DEVOLUCION_VENTA: "Devolución venta",
  AJUSTE_ENTRADA: "Ajuste entrada",
  AJUSTE_SALIDA: "Ajuste salida",
  TRASLADO: "Traslado",
};

const columns: AppColumnDef<StockMovement>[] = [
  { header: "Producto", cell: ({ row }) => row.original.product?.name ?? `#${row.original.product_id}` },
  { header: "Bodega", cell: ({ row }) => row.original.warehouse?.name ?? `#${row.original.warehouse_id}` },
  { header: "Tipo", cell: ({ row }) => <StatusBadge status={row.original.type} label={TYPE_LABEL[row.original.type] ?? row.original.type} /> },
  { header: "Cantidad", cell: ({ row }) => row.original.quantity },
  { header: "Motivo", cell: ({ row }) => row.original.reason ?? "—" },
  dateColumn<StockMovement>("created_at", "Fecha"),
];

const fields: CrudField[] = [
  { name: "product_id", label: "ID producto", type: "number", required: true, min: 1, hint: "ID de un producto existente" },
  { name: "warehouse_id", label: "ID bodega", type: "number", required: true, min: 1, hint: "ID de una bodega existente" },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { label: "Entrada", value: "in" },
      { label: "Salida", value: "out" },
      { label: "Ajuste", value: "adjustment" },
      { label: "Ajuste entrada", value: "AJUSTE_ENTRADA" },
      { label: "Ajuste salida", value: "AJUSTE_SALIDA" },
    ],
  },
  { name: "quantity", label: "Cantidad", type: "number", required: true, min: 1, hint: "Siempre positiva; el tipo define si suma o resta" },
  { name: "reason", label: "Motivo", omitWhenEmpty: true, colSpan: "full" },
];

export default function StockMovementsPage() {
  return (
    <ModuleTablePage<StockMovement>
      title="Movimientos de inventario"
      description="Bitacora de entradas, salidas y ajustes de stock. No se edita ni se borra, solo se registra."
      resource="/stock-movements"
      exportResource="stock-movements"
      columns={columns}
      fields={fields}
      actionLabel="Registrar movimiento"
      modalDescription="Un movimiento manual (ajuste). Las entradas/salidas por orden de compra o pedido se generan automaticamente."
      editable={false}
    />
  );
}

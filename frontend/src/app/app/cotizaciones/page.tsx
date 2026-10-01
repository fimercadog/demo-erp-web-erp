"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef, dateColumn } from "@/lib/table-types";
import { Quote } from "@/lib/types";

const STATUS_LABEL: Record<Quote["status"], string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const columns: AppColumnDef<Quote>[] = [
  { accessorKey: "title", header: "Titulo" },
  { header: "Cliente", cell: ({ row }) => row.original.client ?? `#${row.original.client_id}` },
  {
    header: "Origen",
    cell: ({ row }) =>
      row.original.source === "catalog" ? (
        <StatusBadge status="catalog" label="Sitio web" />
      ) : (
        <StatusBadge status="internal" label="Interna" />
      ),
  },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} label={STATUS_LABEL[row.original.status]} /> },
  dateColumn<Quote>("valid_until", "Valida hasta"),
  { header: "Total", cell: ({ row }) => `$${Number(row.original.total).toLocaleString("es-CO")}` },
];

const fields: CrudField[] = [
  { name: "title", label: "Titulo", required: true, colSpan: "full" },
  { name: "client_id", label: "Cliente", type: "select", optionsResource: "/clients", required: true },
  { name: "deal_id", label: "Deal", type: "select", optionsResource: "/deals", omitWhenEmpty: true },
  { name: "valid_until", label: "Valida hasta", type: "date", omitWhenEmpty: true },
  { name: "notes", label: "Notas", type: "textarea", colSpan: "full", omitWhenEmpty: true },
];

export default function QuotesPage() {
  return (
    <ModuleTablePage<Quote>
      title="Presupuestos"
      description="Presupuestos de cirugía, tratamientos y planes. Al aceptarse se pueden convertir en pedido."
      resource="/quotes"
      columns={columns}
      fields={fields}
      actionLabel="Nueva cotizacion"
      modalDescription="Cabecera. Las lineas se agregan en el detalle."
      extraRowActions={(row) => (
        <Link href={`/app/cotizaciones/${row.id}`} className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
          <Eye className="h-4 w-4" /> Ver
        </Link>
      )}
    />
  );
}

"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Service } from "@/lib/types";

const TYPE_OPTIONS = [
  { label: "Consulta", value: "consulta" },
  { label: "Vacunación", value: "vacunacion" },
  { label: "Cirugía", value: "cirugia" },
  { label: "Curación", value: "curacion" },
  { label: "Hospitalización", value: "hospitalizacion" },
  { label: "Peluquería", value: "peluqueria" },
  { label: "Otro", value: "otro" },
];

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));

function cop(value: number | string) {
  return `$${Number(value).toLocaleString("es-CO")}`;
}

const columns: AppColumnDef<Service>[] = [
  { accessorKey: "name", header: "Servicio" },
  { header: "Tipo", cell: ({ row }) => (row.original.type ? TYPE_LABEL[row.original.type] ?? row.original.type : "—") },
  {
    header: "Duración",
    cell: ({ row }) => (row.original.estimated_duration_minutes ? `${row.original.estimated_duration_minutes} min` : "—"),
  },
  { header: "Precio", cell: ({ row }) => cop(row.original.price) },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "type", label: "Tipo", type: "select", options: TYPE_OPTIONS, omitWhenEmpty: true },
  { name: "estimated_duration_minutes", label: "Duración estimada (min)", type: "number", min: 0, omitWhenEmpty: true },
  { name: "price", label: "Precio", type: "number", min: 0, required: true },
  { name: "description", label: "Descripción", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
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

export default function ServicesPage() {
  return (
    <ModuleTablePage<Service>
      title="Servicios"
      description="Catálogo de servicios que presta la clínica."
      resource="/services"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo servicio"
      modalDescription="Se usa al agendar una cita y al facturar."
    />
  );
}

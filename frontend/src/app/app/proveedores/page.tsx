"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Supplier } from "@/lib/types";

const columns: AppColumnDef<Supplier>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Contacto", cell: ({ row }) => row.original.contact_name ?? "—" },
  { header: "Correo", cell: ({ row }) => row.original.email ?? "—" },
  { header: "Telefono", cell: ({ row }) => row.original.phone ?? "—" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "contact_name", label: "Contacto", omitWhenEmpty: true },
  { name: "email", label: "Correo", type: "email", omitWhenEmpty: true },
  { name: "phone", label: "Telefono", omitWhenEmpty: true },
  { name: "address", label: "Direccion", omitWhenEmpty: true, colSpan: "full" },
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

export default function SuppliersPage() {
  return (
    <ModuleTablePage<Supplier>
      title="Proveedores"
      description="Proveedores para reposicion de inventario."
      resource="/suppliers"
      exportResource="suppliers"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo proveedor"
      modalDescription="Datos de contacto del proveedor."
    />
  );
}

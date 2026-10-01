"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { CrudField } from "@/components/crud/crud-modal";
import { WhatsAppAction } from "@/components/crud/whatsapp-action";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Client } from "@/lib/types";

const columns: AppColumnDef<Client>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Empresa", cell: ({ row }) => row.original.company_name ?? "—" },
  { header: "Segmento", cell: ({ row }) => row.original.segment ?? "—" },
  { header: "Correo", cell: ({ row }) => row.original.email ?? "—" },
  { header: "Telefono", cell: ({ row }) => row.original.phone ?? "—" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "company_name", label: "Empresa", omitWhenEmpty: true },
  { name: "segment_id", label: "Segmento", type: "select", optionsResource: "/segments", omitWhenEmpty: true },
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
  { name: "notes", label: "Notas", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
];

export default function ClientsPage() {
  return (
    <ModuleTablePage<Client>
      title="Propietarios"
      description="Propietarios de la clínica. Desde el detalle ves sus mascotas y su historial."
      resource="/clients"
      exportResource="clients"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo propietario"
      modalDescription="Datos de contacto del propietario."
      extraRowActions={(row) => (
        <>
          <WhatsAppAction phone={row.phone} name={row.name} />
          <Link href={`/app/clientes/${row.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm hover:bg-muted">
            <Eye className="h-4 w-4" /> Historial
          </Link>
        </>
      )}
    />
  );
}

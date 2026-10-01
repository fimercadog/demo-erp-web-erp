"use client";

import { CrudField } from "@/components/crud/crud-modal";
import { WhatsAppAction } from "@/components/crud/whatsapp-action";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Contact } from "@/lib/types";

const columns: AppColumnDef<Contact>[] = [
  { accessorKey: "name", header: "Nombre" },
  { header: "Cargo", cell: ({ row }) => row.original.role ?? "—" },
  { header: "Cliente", cell: ({ row }) => row.original.client ?? "—" },
  { header: "Correo", cell: ({ row }) => row.original.email ?? "—" },
  { header: "Telefono", cell: ({ row }) => row.original.phone ?? "—" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "client_id", label: "Cliente", type: "select", optionsResource: "/clients", omitWhenEmpty: true },
  { name: "role", label: "Cargo", omitWhenEmpty: true },
  { name: "email", label: "Correo", type: "email", omitWhenEmpty: true },
  { name: "phone", label: "Telefono", omitWhenEmpty: true },
  { name: "notes", label: "Notas", type: "textarea", colSpan: "full", omitWhenEmpty: true },
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

export default function ContactsPage() {
  return (
    <ModuleTablePage<Contact>
      title="Contactos"
      description="Personas de contacto en cada cliente o empresa."
      resource="/contacts"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo contacto"
      modalDescription="Persona con la que se coordina en un cliente."
      extraRowActions={(row) => <WhatsAppAction phone={row.phone} name={row.name} />}
    />
  );
}

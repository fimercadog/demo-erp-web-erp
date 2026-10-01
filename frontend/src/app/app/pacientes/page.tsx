"use client";

import Link from "next/link";
import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Patient } from "@/lib/types";

const SEX_LABEL: Record<string, string> = { male: "Macho", female: "Hembra", unknown: "Sin dato" };

const columns: AppColumnDef<Patient>[] = [
  {
    header: "Nombre",
    cell: ({ row }) => (
      <Link href={`/app/pacientes/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { header: "Propietario", cell: ({ row }) => row.original.client ?? "—" },
  { header: "Especie / raza", cell: ({ row }) => [row.original.species, row.original.breed].filter(Boolean).join(" · ") || "—" },
  { header: "Sexo", cell: ({ row }) => SEX_LABEL[row.original.sex] ?? row.original.sex },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const fields: CrudField[] = [
  { name: "client_id", label: "Propietario", type: "select", optionsResource: "/clients", required: true },
  { name: "name", label: "Nombre", required: true },
  { name: "species_id", label: "Especie", type: "select", optionsResource: "/species", required: true },
  { name: "breed_id", label: "Raza", type: "select", optionsResource: "/breeds", omitWhenEmpty: true },
  {
    name: "sex",
    label: "Sexo",
    type: "select",
    required: true,
    options: [
      { label: "Macho", value: "male" },
      { label: "Hembra", value: "female" },
      { label: "Sin dato", value: "unknown" },
    ],
  },
  { name: "birth_date", label: "Fecha de nacimiento", type: "date", omitWhenEmpty: true },
  { name: "weight", label: "Peso (kg)", type: "number", step: 0.01, min: 0, omitWhenEmpty: true },
  { name: "microchip", label: "Microchip", omitWhenEmpty: true },
  {
    name: "sterilized",
    label: "Esterilizado",
    type: "select",
    options: [
      { label: "No", value: "0" },
      { label: "Sí", value: "1" },
    ],
    omitWhenEmpty: true,
  },
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

export default function PatientsPage() {
  return (
    <ModuleTablePage<Patient>
      title="Pacientes"
      description="Mascotas atendidas, cada una ligada a su propietario."
      resource="/patients"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo paciente"
      modalDescription="El propietario es un cliente de la clínica."
    />
  );
}

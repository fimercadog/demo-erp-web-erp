"use client";

import Link from "next/link";
import { CrudField } from "@/components/crud/crud-modal";
import { ModuleTablePage } from "@/components/module-table-page";
import { AppColumnDef } from "@/lib/table-types";
import { Consultation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { isConsultationEditable } from "@/lib/consultation-helpers";

const columns: AppColumnDef<Consultation>[] = [
  { header: "Fecha", cell: ({ row }) => formatDate(row.original.date) },
  {
    header: "Paciente",
    cell: ({ row }) => (
      <Link href={`/app/pacientes/${row.original.patient_id}`} className="text-primary hover:underline">
        {(row.original.patient?.name ?? row.original.patient) || "—"}
      </Link>
    ),
  },
  { header: "Motivo", cell: ({ row }) => row.original.reason },
  { header: "Veterinario", cell: ({ row }) => row.original.vet ?? "—" },
  {
    header: "",
    cell: ({ row }) => (
      <Link href={`/app/consultas/${row.original.id}`} className="text-xs text-primary hover:underline">
        Ver SOAP
      </Link>
    ),
  },
];

const fields: CrudField[] = [
  { name: "patient_id", label: "Paciente", type: "select", optionsResource: "/patients", required: true },
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "reason", label: "Motivo de consulta", required: true },
  { name: "weight", label: "Peso (kg)", type: "number", step: 0.01, min: 0, omitWhenEmpty: true },
  { name: "temperature", label: "Temperatura (°C)", type: "number", step: 0.1, omitWhenEmpty: true },
  { name: "subjective", label: "S — Subjetivo", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
  { name: "objective", label: "O — Objetivo", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
  { name: "assessment", label: "A — Análisis", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
  { name: "plan", label: "P — Plan", type: "textarea", omitWhenEmpty: true, colSpan: "full" },
];

export default function ConsultationsPage() {
  return (
    <ModuleTablePage<Consultation>
      title="Historia clínica"
      description="Consultas SOAP de todos los pacientes."
      resource="/consultations"
      columns={columns}
      fields={fields}
      isRowEditable={(row) => isConsultationEditable(row.status)}
      actionLabel="Nueva consulta"
      modalDescription="Esquema SOAP: Subjetivo · Objetivo · Análisis · Plan."
    />
  );
}

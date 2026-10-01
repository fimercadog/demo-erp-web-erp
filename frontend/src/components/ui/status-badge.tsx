import * as React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";

export type StatusCategory = "success" | "warning" | "info" | "destructive" | "secondary" | "purple";

export type StatusDefinition = {
  label: string;
  category: StatusCategory;
  className?: string;
};

/**
 * Diccionario maestro y estricto de estados técnicos del ERP Transversal y Veterinaria.
 * Todos los badges utilizan el estándar visual de fondo sólido medio/claro con texto negro (text-zinc-950).
 */
export const STATUS_DICTIONARY: Record<string, StatusDefinition> = {
  // --- Ventas, Facturación & Cuentas ---
  draft: { label: "Borrador", category: "secondary", className: "bg-zinc-200 text-zinc-950 border-none font-medium dark:bg-zinc-700 dark:text-zinc-100" },
  issued: { label: "Emitida", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-medium dark:bg-sky-900 dark:text-sky-100" },
  sent: { label: "Enviada", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-medium dark:bg-blue-900 dark:text-blue-100" },
  pending: { label: "Pendiente", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-bold dark:bg-amber-800 dark:text-amber-100" },
  partial: { label: "Parcial", category: "warning", className: "bg-yellow-300 text-zinc-950 border-none font-bold dark:bg-yellow-700 dark:text-yellow-100" },
  partially_paid: { label: "Parcialmente pagada", category: "warning", className: "bg-yellow-300 text-zinc-950 border-none font-bold dark:bg-yellow-700 dark:text-yellow-100" },
  paid: { label: "Pagada", category: "success", className: "bg-green-300 text-zinc-950 border-none font-extrabold uppercase tracking-wider dark:bg-green-800 dark:text-green-100" },
  accepted: { label: "Aceptada", category: "success", className: "bg-teal-200 text-zinc-950 border-none font-semibold dark:bg-teal-800 dark:text-teal-100" },
  confirmed: { label: "Confirmada", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  received: { label: "Recibida", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-medium dark:bg-emerald-800 dark:text-emerald-100" },
  converted: { label: "Convertida", category: "success", className: "bg-teal-200 text-zinc-950 border-none font-medium dark:bg-teal-800 dark:text-teal-100" },
  void: { label: "Anulada", category: "destructive", className: "bg-rose-200 text-zinc-950 border-none font-medium dark:bg-rose-900 dark:text-rose-100" },
  cancelled: { label: "Cancelada", category: "destructive", className: "bg-rose-200 text-zinc-950 border-none font-bold dark:bg-rose-900 dark:text-rose-100" },
  cancel: { label: "Cancelada", category: "destructive", className: "bg-rose-200 text-zinc-950 border-none font-bold dark:bg-rose-900 dark:text-rose-100" },
  rejected: { label: "Rechazada", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-bold dark:bg-red-900 dark:text-red-100" },
  overdue: { label: "Vencida", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-extrabold uppercase tracking-wider dark:bg-red-900 dark:text-red-100" },

  // --- Citas, Asistencia & Salud ---
  scheduled: { label: "Programada", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-medium dark:bg-sky-800 dark:text-sky-100" },
  attended: { label: "Atendida", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  "no-show": { label: "No asistió", category: "warning", className: "bg-orange-200 text-zinc-950 border-none font-medium dark:bg-orange-800 dark:text-orange-100" },
  triage: { label: "Triage", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-bold dark:bg-amber-800 dark:text-amber-100" },
  in_consultation: { label: "En atención", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-bold dark:bg-blue-800 dark:text-blue-100" },
  discharged: { label: "Egresado", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  auth_pending: { label: "Autorización pendiente", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-medium dark:bg-amber-800 dark:text-amber-100" },

  // --- Veterinaria ---
  vaccinated: { label: "Vacunado", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  vaccine_due: { label: "Vacuna pendiente", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-bold dark:bg-amber-800 dark:text-amber-100" },
  active_treatment: { label: "Tratamiento activo", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-bold dark:bg-blue-800 dark:text-blue-100" },
  medical_discharge: { label: "Alta médica", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },

  // --- CRM, Leads & Oportunidades ---
  new: { label: "Nuevo", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-bold dark:bg-sky-800 dark:text-sky-100" },
  nuevo: { label: "Nuevo", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-bold dark:bg-sky-800 dark:text-sky-100" },
  contacted: { label: "Contactado", category: "info", className: "bg-indigo-200 text-zinc-950 border-none font-bold dark:bg-indigo-800 dark:text-indigo-100" },
  contactado: { label: "Contactado", category: "info", className: "bg-indigo-200 text-zinc-950 border-none font-bold dark:bg-indigo-800 dark:text-indigo-100" },
  connected: { label: "Conectado", category: "info", className: "bg-indigo-200 text-zinc-950 border-none font-bold dark:bg-indigo-800 dark:text-indigo-100" },
  conectado: { label: "Conectado", category: "info", className: "bg-indigo-200 text-zinc-950 border-none font-bold dark:bg-indigo-800 dark:text-indigo-100" },
  prospecting: { label: "Prospección", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-medium dark:bg-blue-800 dark:text-blue-100" },
  qualification: { label: "Calificación", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-medium dark:bg-amber-800 dark:text-amber-100" },
  proposal: { label: "Propuesta", category: "warning", className: "bg-orange-200 text-zinc-950 border-none font-medium dark:bg-orange-800 dark:text-orange-100" },
  negotiation: { label: "Negociación", category: "warning", className: "bg-yellow-300 text-zinc-950 border-none font-bold dark:bg-yellow-700 dark:text-yellow-100" },
  won: { label: "Ganado", category: "success", className: "bg-green-300 text-zinc-950 border-none font-extrabold uppercase dark:bg-green-800 dark:text-green-100" },
  lost: { label: "Perdido", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-bold dark:bg-red-900 dark:text-red-100" },
  discarded: { label: "Descartado", category: "destructive", className: "bg-red-200 text-zinc-950 border-none font-medium dark:bg-red-900 dark:text-red-100" },

  // --- Citas, Agenda & Servicios ---
  in_progress: { label: "En proceso", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-bold dark:bg-blue-800 dark:text-blue-100" },
  completed: { label: "Completado", category: "success", className: "bg-lime-200 text-zinc-950 border-none font-bold dark:bg-lime-800 dark:text-lime-100" },

  // --- Entidades Generales & Maestros ---
  active: { label: "Activo", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  inactive: { label: "Inactivo", category: "secondary", className: "bg-zinc-200 text-zinc-700 border-none font-normal dark:bg-zinc-800 dark:text-zinc-400" },
  open: { label: "Abierta", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  closed: { label: "Cerrada", category: "destructive", className: "bg-rose-200 text-zinc-950 border-none font-medium dark:bg-rose-900 dark:text-rose-100" },
  deleted: { label: "Eliminado", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-extrabold dark:bg-red-900 dark:text-red-100" },

  // --- Orígenes, Canales & Tags ---
  catalog: { label: "Sitio web", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-medium dark:bg-sky-900 dark:text-sky-100" },
  web: { label: "Sitio web", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-medium dark:bg-sky-900 dark:text-sky-100" },
  website: { label: "Sitio web", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-medium dark:bg-sky-900 dark:text-sky-100" },
  internal: { label: "Interna", category: "secondary", className: "bg-zinc-200 text-zinc-950 border-none font-medium dark:bg-zinc-700 dark:text-zinc-100" },
  manual: { label: "Manual", category: "secondary", className: "bg-zinc-200 text-zinc-950 border-none font-medium dark:bg-zinc-700 dark:text-zinc-100" },
  contingency: { label: "Contingencia", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-bold dark:bg-amber-800 dark:text-amber-100" },
  ai: { label: "IA", category: "purple", className: "bg-purple-200 text-zinc-950 border-none font-bold dark:bg-purple-800 dark:text-purple-100" },
  automated: { label: "Automatizado", category: "purple", className: "bg-purple-200 text-zinc-950 border-none font-medium dark:bg-purple-800 dark:text-purple-100" },
  premium: { label: "Premium", category: "purple", className: "bg-violet-200 text-zinc-950 border-none font-bold dark:bg-violet-800 dark:text-violet-100" },

  // --- Inventario & Alertas ---
  in: { label: "Entrada", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  out: { label: "Salida", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100" },
  COMPRA: { label: "Compra", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  VENTA: { label: "Venta", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100" },
  AJUSTE_ENTRADA: { label: "Ajuste entrada", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  AJUSTE_SALIDA: { label: "Ajuste salida", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100" },
  TRASLADO: { label: "Traslado", category: "info", className: "bg-blue-200 text-zinc-950 border-none font-semibold dark:bg-blue-800 dark:text-blue-100" },
  low: { label: "Bajo stock", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100" },
  low_stock: { label: "Bajo stock", category: "warning", className: "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100" },
  out_of_stock: { label: "Agotado", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-extrabold dark:bg-red-900 dark:text-red-100" },
  overstock: { label: "Sobrestock", category: "info", className: "bg-sky-200 text-zinc-950 border-none font-semibold dark:bg-sky-800 dark:text-sky-100" },

  // --- Contingencia & Cola Técnica ---
  synced: { label: "Sincronizado", category: "success", className: "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100" },
  failed: { label: "Con error", category: "destructive", className: "bg-red-300 text-zinc-950 border-none font-bold dark:bg-red-900 dark:text-red-100" },
  conflict: { label: "Conflicto", category: "destructive", className: "bg-rose-200 text-zinc-950 border-none font-bold dark:bg-rose-900 dark:text-rose-100" },
};

export function getCategoryFromText(text: string): StatusCategory {
  const norm = text.toLowerCase().trim();

  if (
    norm.includes("borrador") ||
    norm.includes("intern") ||
    norm.includes("manual") ||
    norm.includes("candidato") ||
    norm.includes("sin dato")
  ) {
    return "secondary";
  }

  if (
    (norm.includes("pagad") && !norm.includes("parcial")) ||
    norm.includes("aceptad") ||
    norm.includes("confirmad") ||
    norm.includes("atendid") ||
    norm.includes("recibid") ||
    norm.includes("ganad") ||
    norm.includes("completad") ||
    norm.includes("sincronizad") ||
    norm.includes("vacunado") ||
    norm.includes("vacunac") ||
    norm.includes("alta") ||
    norm === "activo" ||
    norm === "activa" ||
    norm === "abierta" ||
    norm === "si" ||
    norm === "éxito" ||
    norm === "exito"
  ) {
    return "success";
  }

  if (
    norm.includes("enviad") ||
    norm.includes("emitid") ||
    norm.includes("programad") ||
    norm.includes("en curso") ||
    norm.includes("tratamiento") ||
    norm.includes("sitio web") ||
    norm.includes("prospeccion") ||
    norm.includes("prospección") ||
    norm.includes("traslado") ||
    norm.includes("nuevo") ||
    norm.includes("contactad") ||
    norm.includes("conectad") ||
    norm.includes("sobrestock") ||
    norm.includes("atención") ||
    norm.includes("atencion")
  ) {
    return "info";
  }

  if (
    norm.includes("parcial") ||
    norm.includes("pendient") ||
    norm.includes("triage") ||
    norm.includes("calificacion") ||
    norm.includes("calificación") ||
    norm.includes("propuesta") ||
    norm.includes("negociacion") ||
    norm.includes("negociación") ||
    norm.includes("no asistió") ||
    norm.includes("bajo") ||
    norm.includes("salida")
  ) {
    return "warning";
  }

  if (
    norm.includes("rechazad") ||
    norm.includes("vencid") ||
    norm.includes("cancelad") ||
    norm.includes("anulad") ||
    norm.includes("descartad") ||
    norm.includes("perdid") ||
    norm.includes("error") ||
    norm.includes("conflicto") ||
    norm.includes("agotad") ||
    norm.includes("fallid") ||
    norm === "inactivo" ||
    norm === "inactiva" ||
    norm === "cerrada" ||
    norm === "no"
  ) {
    return "destructive";
  }

  if (norm.includes("ia") || norm.includes("premium") || norm.includes("automatizad")) {
    return "purple";
  }

  return "secondary";
}

export function getStatusBadgeConfig(statusKey?: string, customLabel?: string): StatusDefinition {
  const normalizedKey = statusKey?.toLowerCase().trim();

  if (normalizedKey && STATUS_DICTIONARY[normalizedKey]) {
    const def = STATUS_DICTIONARY[normalizedKey];
    return {
      label: customLabel ?? def.label,
      category: def.category,
      className: def.className,
    };
  }

  const text = customLabel ?? statusKey ?? "Desconocido";
  const category = getCategoryFromText(text);

  let dynamicClassName: string | undefined;
  const norm = text.toLowerCase().trim();

  if (norm === "nuevo" || norm === "new") {
    dynamicClassName = "bg-sky-200 text-zinc-950 border-none font-bold dark:bg-sky-800 dark:text-sky-100";
  } else if (norm.includes("contactad") || norm.includes("conectad") || norm === "contacted" || norm === "connected") {
    dynamicClassName = "bg-indigo-200 text-zinc-950 border-none font-bold dark:bg-indigo-800 dark:text-indigo-100";
  } else if (norm === "activo" || norm === "activa" || norm === "active") {
    dynamicClassName = "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100";
  } else if (norm.includes("pagad") || norm === "paid") {
    dynamicClassName = "bg-green-300 text-zinc-950 border-none font-extrabold uppercase tracking-wider dark:bg-green-800 dark:text-green-100";
  } else if (norm.includes("pendient") || norm === "pending") {
    dynamicClassName = "bg-amber-200 text-zinc-950 border-none font-bold dark:bg-amber-800 dark:text-amber-100";
  } else if (norm.includes("parcial") || norm === "partial") {
    dynamicClassName = "bg-yellow-300 text-zinc-950 border-none font-bold dark:bg-yellow-700 dark:text-yellow-100";
  } else if (norm.includes("cancelad") || norm === "cancelled") {
    dynamicClassName = "bg-rose-200 text-zinc-950 border-none font-bold dark:bg-rose-900 dark:text-rose-100";
  } else if (norm.includes("eliminad") || norm === "deleted") {
    dynamicClassName = "bg-red-300 text-zinc-950 border-none font-extrabold dark:bg-red-900 dark:text-red-100";
  }

  return {
    label: text,
    category,
    className: dynamicClassName,
  };
}

export interface StatusBadgeProps extends BadgeProps {
  status?: string;
  label?: string;
}

export function StatusBadge({ status, label, className, variant, children, ...props }: StatusBadgeProps) {
  const config = getStatusBadgeConfig(status, label ?? (typeof children === "string" ? children : undefined));
  const category = variant ?? config.category;
  const displayText = children ?? config.label;

  let categoryStyles = config.className;

  if (!categoryStyles) {
    if (category === "success") {
      categoryStyles = "bg-emerald-200 text-zinc-950 border-none font-semibold dark:bg-emerald-800 dark:text-emerald-100";
    } else if (category === "info") {
      categoryStyles = "bg-sky-200 text-zinc-950 border-none font-semibold dark:bg-sky-800 dark:text-sky-100";
    } else if (category === "warning") {
      categoryStyles = "bg-amber-200 text-zinc-950 border-none font-semibold dark:bg-amber-800 dark:text-amber-100";
    } else if (category === "destructive") {
      categoryStyles = "bg-rose-200 text-zinc-950 border-none font-semibold dark:bg-rose-900 dark:text-rose-100";
    } else if (category === "purple") {
      categoryStyles = "bg-purple-200 text-zinc-950 border-none font-semibold dark:bg-purple-800 dark:text-purple-100";
    } else {
      categoryStyles = "bg-zinc-200 text-zinc-950 border-none font-medium dark:bg-zinc-700 dark:text-zinc-100";
    }
  }

  return (
    <Badge className={`px-2.5 py-0.5 text-xs rounded-md ${categoryStyles} ${className ?? ""}`} {...props}>
      {displayText}
    </Badge>
  );
}

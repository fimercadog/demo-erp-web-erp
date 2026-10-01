import Link from "next/link";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Identidad del sitio publico: la CLINICA ("VetDemo"), no el software.
 * Distinta a proposito de `components/brand/logo.tsx` (marca "VetPanel" que
 * usa el panel admin) — evita que el sitio publico y el panel se vean como la
 * misma marca.
 */
export const CLINIC_NAME = "Clínica Veterinaria VetDemo";
export const CLINIC_SHORT_NAME = "VetDemo";

export function ClinicWordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${CLINIC_NAME} — inicio`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="size-4.5" />
      </span>
      <span className="text-base font-extrabold leading-tight tracking-tight">
        {CLINIC_SHORT_NAME}
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Veterinaria
        </span>
      </span>
    </Link>
  );
}

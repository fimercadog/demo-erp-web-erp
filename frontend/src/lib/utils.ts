import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ISO / Date -> `27/08/2026`. Devuelve el valor crudo si no es una fecha valida.
 * Los campos de fecha del backend llegan como medianoche UTC (`...T00:00:00Z`),
 * asi que se formatea en UTC para no correr el dia segun la zona del navegador.
 */
export function formatDate(value: string | number | Date | null | undefined, locale: string = "es-CO"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

/**
 * Formatea un valor numérico a moneda COP: `$ 120.000`
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "$0";
  const num = Number(value);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * `YYYY-MM-DD` de una fecha en hora LOCAL (no UTC). Para el selector de día de la
 * agenda y los rangos de reportes: `toISOString().slice(0,10)` corre el día de
 * noche en zonas con offset negativo. `en-CA` produce el formato ISO.
 */
export function isoDateLocal(d: Date = new Date(), locale: string = "en-CA"): string {
  return d.toLocaleDateString(locale);
}

/**
 * Formato monetario dinámico por moneda y locale de la empresa.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = "COP",
  locale: string = "es-CO"
): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "$0";
  }
  const num = Number(amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `$${num.toLocaleString()}`;
  }
}

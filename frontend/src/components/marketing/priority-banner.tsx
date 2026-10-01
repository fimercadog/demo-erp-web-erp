import { CtaLink } from "@/components/marketing/cta-link";
import { WHATSAPP_URL } from "@/components/marketing/whatsapp-link";

/**
 * Banner píldora oscuro de máxima prioridad -- "FOR EMERGENCIES CALL" del
 * pack Divi. Full-width, alto contraste, para el dato que no debería
 * perderse nunca en la página (urgencias).
 */
export function PriorityBanner({
  label = "Para urgencias, escríbenos ya",
  detail = "+57 601 555 0188",
}: {
  label?: string;
  detail?: string;
}) {
  return (
    // rounded-3xl en mobile (no rounded-full): con el texto en columna, un
    // pill completo se ve como una cápsula deforme cuando el contenido es
    // alto. El telefono con whitespace-nowrap evita que corte a mitad de numero.
    <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-ink px-6 py-5 text-center text-white shadow-elevation-3 sm:flex-row sm:rounded-full sm:px-10 sm:py-4 sm:text-left">
      <p className="flex flex-col items-center gap-1 text-sm font-bold uppercase tracking-[0.14em] sm:flex-row sm:gap-2 sm:text-base">
        <span>{label}</span>
        <a href={`tel:${detail.replace(/\s+/g, "")}`} className="whitespace-nowrap font-extrabold text-cta hover:underline">{detail}</a>
      </p>
      <CtaLink href={WHATSAPP_URL} variant="cta" size="sm">
        Escribir por WhatsApp
      </CtaLink>
    </div>
  );
}

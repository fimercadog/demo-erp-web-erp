import { CalendarCheck } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { GradientBlob } from "@/components/marketing/gradient-blob";
import { Reveal } from "@/components/marketing/reveal";
import { container } from "@/components/marketing/marketing-ui";
import { WHATSAPP_URL } from "@/components/marketing/whatsapp-link";

/**
 * Banda de cierre oscura con las dos acciones de máxima prioridad del sitio:
 * Agendar cita y WhatsApp. Reutilizada en home, servicios, equipo y contacto.
 */
export function AppointmentCta({
  title = "¿Necesitas agendar una consulta veterinaria?",
  lead = "Elige el especialista que necesites y confirmamos tu disponibilidad al instante. Para atención priorizada, escríbenos directo.",
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-16 text-ink-foreground sm:py-20">
      <GradientBlob className="left-[-10%] top-[-30%] size-[60%] opacity-70" warm float />
      <GradientBlob className="right-[-12%] bottom-[-35%] size-[55%] opacity-50" float />
      <div className={container}>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10 text-chart-3">
              <CalendarCheck className="size-5.5" />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg leading-8 text-white/70">{lead}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaLink href="/agendar-cita" variant="cta">
                Agendar cita
              </CtaLink>
              <CtaLink
                href={WHATSAPP_URL}
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                Hablar por WhatsApp
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

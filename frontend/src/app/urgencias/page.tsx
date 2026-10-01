import { AlertTriangle, Clock, PhoneCall, Stethoscope } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PhotoFeatureStack } from "@/components/marketing/photo-feature-stack";
import { PriorityBanner } from "@/components/marketing/priority-banner";
import { Section, SectionHeading } from "@/components/marketing/marketing-ui";
import { Reveal } from "@/components/marketing/reveal";
import { SplitHero } from "@/components/marketing/split-hero";
import { WHATSAPP_URL } from "@/components/marketing/whatsapp-link";

const signs = [
  "Dificultad para respirar o respiración muy acelerada",
  "Vómito o diarrea persistente con signos de deshidratación",
  "Convulsiones o pérdida del estado de conciencia",
  "Traumatismo severo, caída o accidente de tránsito",
  "Sospecha de intoxicación o envenenamiento",
  "Sangrado activo que no cede o herida profunda",
  "Dolor abdominal agudo, distensión o incapacidad de levantarse",
  "Parto con complicaciones o más de 2h entre crías",
];

const steps = [
  { icon: PhoneCall, title: "Avísanos antes de venir", text: "Escríbenos por WhatsApp o llama a la clínica con el caso. El equipo veterinario se prepara mientras estás en camino." },
  { icon: Stethoscope, title: "Estabilización inmediata", text: "Al llegar, la prioridad es evaluar y estabilizar a tu mascota: respiración, dolor, signos vitales y estado de consciencia." },
  { icon: Clock, title: "Seguimiento hasta el alta", text: "Si el paciente requiere observación, mantenemos informado al dueño en todo momento hasta el alta médica." },
];

export default function UrgenciasPage() {
  return (
    <MarketingLayout>
      {/* Hero: misma familia visual que Servicios/Productos/Equipo/Nosotros/Blog */}
      <SplitHero
        eyebrow="Urgencias Prioritarias"
        title="Cuando no puede esperar, actuamos con rapidez y rigor veterinario"
        lead="Ante un accidente, un cuadro agudo o dolor intenso en tu mascota, escríbenos o llama para que nuestro equipo veterinario esté listo a tu llegada."
        image="/gallery/illustrations/illustration-8.png"
        imageAlt="Veterinario atendiendo una urgencia"
        actions={
          <CtaLink href={WHATSAPP_URL} variant="cta">
            <PhoneCall className="size-4" />
            Línea Prioritaria por WhatsApp
          </CtaLink>
        }
      />
      <div className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <PriorityBanner label="Línea directa 24/7" detail="+57 601 555 0188" />
      </div>

      <Section>
        <Reveal>
          <SectionHeading eyebrow="¿Cuándo es una urgencia?" title="Señales que requieren atención veterinaria inmediata" center={false} />
        </Reveal>
        <div className="mt-10 rounded-[2rem] bg-card p-6 shadow-elevation-4 sm:p-10">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {signs.map((sign, i) => (
              <Reveal key={sign} delay={(i % 4) * 0.05}>
                <div className="flex gap-3 text-sm leading-6">
                  <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-warning" />
                  <span>{sign}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Ante la duda, escríbenos: nuestro equipo veterinario valorará la prioridad de atención de tu mascota.
        </p>
      </Section>

      <Section className="bg-section-cream">
        <PhotoFeatureStack
          image="/gallery/paw-procedure.jpg"
          imageAlt="Procedimiento veterinario de urgencia"
          reverse
          features={[
            { title: "Valoración prioritaria", text: "Una urgencia recibe atención de inmediato sin esperas innecesarias para tu mascota." },
            { title: "Atención ágil", text: "Escríbenos o llama directo — coordinamos la recepción veterinaria a tu llegada." },
          ]}
        />
      </Section>

      <Section dark>
        <Reveal>
          <SectionHeading eyebrow="Cómo funciona" title="Qué pasa cuando llegas con una urgencia" dark />
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={i * 0.08}>
                <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-chart-3">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{step.text}</p>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </MarketingLayout>
  );
}

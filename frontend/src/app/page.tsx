import { ArrowRight, Bird, Cat, Dog, Rabbit, Sparkles } from "lucide-react";
import { AppointmentCta } from "@/components/marketing/appointment-cta";
import { CtaLink } from "@/components/marketing/cta-link";
import { EmergencyBanner } from "@/components/marketing/emergency-banner";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FloatingContactCard } from "@/components/marketing/floating-contact-card";
import { HomeHero } from "@/components/marketing/home-hero";
import { GradientBlob } from "@/components/marketing/gradient-blob";
import { IconFeatureFloatCard } from "@/components/marketing/icon-feature-float-card";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { faqs, featuredServices, stats, team, testimonials } from "@/components/marketing/marketing-data";
import { Section, SectionHeading } from "@/components/marketing/marketing-ui";
import { OffsetBlobBlock } from "@/components/marketing/offset-blob-block";
import { PhotoFeatureStack } from "@/components/marketing/photo-feature-stack";
import { Reveal } from "@/components/marketing/reveal";
import { ServiceGrid } from "@/components/marketing/service-card";
import { StatsSection } from "@/components/marketing/stats-section";
import { TestimonialGrid } from "@/components/marketing/testimonial-card";
import { VetGrid } from "@/components/marketing/vet-card";

const whyUs = [
  { icon: "/gallery/icons/icon-16.png", title: "Equipo con experiencia", text: "Veterinarios de planta, no rotativos: conocen a tu mascota visita tras visita." },
  { icon: "/gallery/icons/icon-15.png", title: "Historia clínica digital", text: "Vacunas, consultas y tratamientos quedan registrados y no se pierden." },
  { icon: "/gallery/icons/icon-13.png", title: "Laboratorio propio", text: "Análisis básicos con resultados el mismo día, sin derivar a otro lado." },
  { icon: "/gallery/icons/icon-11.png", title: "Trato cercano", text: "Te explicamos cada diagnóstico en lenguaje claro, sin apuro." },
];

const speciesTreated = [
  { icon: Dog, label: "Perros" },
  { icon: Cat, label: "Gatos" },
  { icon: Rabbit, label: "Conejos" },
  { icon: Bird, label: "Aves" },
];

export default function Home() {
  return (
    <MarketingLayout>
      <HomeHero />

      {/* Tarjeta flotante: solapa el borde inferior del hero (min-h-screen)
          y el borde superior de servicios. Vive FUERA del hero para que el
          hero sea exactamente min-h-screen y la tarjeta sea visible en el
          primer viewport sin scroll. */}
      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 sm:-mt-20 sm:px-6 lg:px-8">
        <FloatingContactCard mount delay={0.72} />
      </div>

      {/* Servicios principales */}
      <Section className="bg-[#f9fafb] pt-8">
        <Reveal>
          <SectionHeading
            eyebrow="Servicios"
            title="Todo lo que tu mascota necesita, en un solo lugar"
            lead="Desde el control de rutina hasta la cirugía: estos son los servicios que más solicitan nuestros pacientes."
          />
        </Reveal>
        <div className="mt-14">
          <ServiceGrid services={featuredServices} />
        </div>
        <div className="mt-10 flex justify-center">
          <CtaLink href="/servicios" variant="outline">
            Ver todos los servicios
          </CtaLink>
        </div>
      </Section>

      {/* Presentación de la clínica */}
      <Section className="bg-section-cream py-14 lg:py-20">
        <Reveal>
          <SectionHeading eyebrow="La clínica" title="Más de una década cuidando mascotas del barrio" center={false} />
        </Reveal>
        <div className="mt-12">
          <PhotoFeatureStack
            image="/gallery/pet-7.jpg"
            imageAlt="Veterinario con bata blanca y estetoscopio revisando a un bulldog en la camilla"
            features={[
              { title: "Consultorios equipados", text: "Laboratorio propio y quirófano — sin derivar cada caso a otro lado." },
              { title: "Pocas mascotas, no muchas apuradas", text: "Cada consulta tiene el tiempo que necesita, no un cronómetro." },
              { title: "Calle 93 #14-20, Bogotá", text: "A dos cuadras de la Zona T. Lun a sáb, 8:00 a 19:00." },
            ]}
          />
        </div>
        <div className="mt-8 flex justify-center lg:justify-start">
          <CtaLink href="/nosotros" variant="outline" size="sm">
            Conocer la clínica
          </CtaLink>
        </div>
      </Section>

      {/* Por qué elegirnos */}
      <Section className="bg-[#f9fafb] pt-14 pb-0 lg:pt-20">
        <Reveal>
          <SectionHeading
            eyebrow="Por qué elegirnos"
            title="Cuatro razones que notan nuestros propietarios"
          />
        </Reveal>
      </Section>
      <div className="bg-[#f9fafb]">
        <IconFeatureFloatCard items={whyUs} />
      </div>

      {/* Equipo */}
      <Section dark>
        <Reveal>
          <SectionHeading
            eyebrow="Equipo profesional"
            title="Quién va a atender a tu mascota"
            lead="Veterinarios de planta y un equipo de recepción que coordina tu agenda y tus urgencias."
            dark
          />
        </Reveal>
        <div className="mt-14">
          <VetGrid team={team} />
        </div>
        <div className="mt-10 flex justify-center">
          <CtaLink href="/equipo" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            Conocer al equipo completo
            <ArrowRight className="size-4" />
          </CtaLink>
        </div>
      </Section>

      {/* Atención preventiva */}
      <OffsetBlobBlock
        eyebrow="Atención preventiva"
        title="Prevenir cuesta menos que curar"
        image="/gallery/paw-procedure.jpg"
        imageAlt="Veterinario con guantes revisando la pata de un paciente"
        actions={
          <CtaLink href="/servicios/medicina-preventiva" variant="outline" size="sm">
            Ver medicina preventiva
          </CtaLink>
        }
      >
        <p className="text-lg leading-8 text-muted-foreground">
          Vacunación al día, desparasitación programada y un chequeo periódico detectan a tiempo lo que todavía no
          duele. Es la diferencia entre un control de rutina y una urgencia evitable.
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-6">
          {["Esquema de vacunación con recordatorio de próxima dosis", "Desparasitación interna y externa por peso y edad", "Chequeo anual (o semestral en pacientes senior)"].map(
            (item) => (
              <li key={item} className="flex gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ),
          )}
        </ul>
      </OffsetBlobBlock>

      {/* Urgencias */}
      <Section>
        <EmergencyBanner />
      </Section>

      {/* Estadísticas */}
      <Section dark>
        <StatsSection stats={stats} dark />
      </Section>

      {/* Testimonios */}
      <Section className="bg-[#f9fafb]">
        <Reveal>
          <SectionHeading eyebrow="Testimonios" title="Lo que cuentan nuestros propietarios" />
        </Reveal>
        <div className="mt-14">
          <TestimonialGrid testimonials={testimonials} limit={3} />
        </div>
        <div className="mt-10 flex justify-center">
          <CtaLink href="/testimonios" variant="outline">
            Ver todos los testimonios
          </CtaLink>
        </div>
      </Section>

      {/* Mascotas atendidas */}
      <Section className="relative isolate overflow-hidden bg-[#f9fafb]">
        <GradientBlob className="-right-24 -bottom-24 size-[110%] opacity-30" />
        <Reveal>
          <SectionHeading eyebrow="A quién atendemos" title="Mascotas de todo tipo, un mismo estándar de cuidado" />
        </Reveal>
        <Reveal delay={0.08}>
          <div className="relative z-10 mt-12 grid grid-cols-2 gap-x-4 gap-y-10 rounded-[2.5rem] bg-card p-8 shadow-elevation-4 sm:grid-cols-4 sm:p-12">
            {speciesTreated.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
                  <item.icon className="size-7" />
                </span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section>
        <Reveal>
          <SectionHeading eyebrow="Preguntas frecuentes" title="Dudas comunes antes de tu primera visita" />
        </Reveal>
        <div className="mt-14">
          <FaqAccordion faqs={faqs.slice(0, 5)} />
        </div>
        <div className="mt-10 flex justify-center">
          <CtaLink href="/preguntas-frecuentes" variant="outline">
            Ver todas las preguntas
          </CtaLink>
        </div>
      </Section>

      {/* CTA agendar */}
      <AppointmentCta />

      {/* Contacto / ubicación */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cta">Visitanos</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Te esperamos en la clínica
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Calle 93 #14-20, Bogotá. Lunes a sábado de 8:00 a 19:00 — urgencias los 7 días.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink href="/contacto" variant="outline">
                Ir a contacto
              </CtaLink>
              <CtaLink
                href="https://www.google.com/maps/search/?api=1&query=Calle+93+%2314-20%2C+Bogot%C3%A1"
                variant="ghost"
              >
                Ver en el mapa
              </CtaLink>
            </div>
          </Reveal>
          <Reveal delay={0.1} direction="fade" duration={0.8}>
            <div className="aspect-4/3 w-full overflow-hidden rounded-3xl shadow-elevation-3">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d127238.10319071656!2d-74.16085941045108!3d4.736901797248434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sla%2026%20con%207!5e0!3m2!1ses!2sco!4v1789530874639!5m2!1ses!2sco"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Ubicación de Clínica Veterinaria VetDemo en Google Maps"
                className="size-full"
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </MarketingLayout>
  );
}

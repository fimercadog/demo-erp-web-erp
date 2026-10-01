import Image from "next/image";
import { ContactForm } from "@/components/marketing/contact-form";
import { CtaLink } from "@/components/marketing/cta-link";
import { FaqColumns } from "@/components/marketing/faq-columns";
import { FloatingContactCard } from "@/components/marketing/floating-contact-card";
import { GradientBlob } from "@/components/marketing/gradient-blob";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { faqs } from "@/components/marketing/marketing-data";
import { CLINIC_NAME } from "@/components/marketing/clinic-brand";
import { Section, SectionHeading } from "@/components/marketing/marketing-ui";
import { container } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { WHATSAPP_URL } from "@/components/marketing/whatsapp-link";

export default function ContactPage() {
  return (
    <MarketingLayout>
      {/* Hero: texto centrado sobre blob + ilustraciones flanqueando -- patrón "Veterinarian Contact". */}
      <section className="relative isolate overflow-hidden">
        <GradientBlob className="left-1/2 top-0 size-[150%] -translate-x-1/2 opacity-40" warm />
        <div className={`${container} relative py-16 text-center sm:py-20`}>
          <Reveal mount className="hidden sm:absolute sm:left-4 sm:top-8 sm:block sm:size-28 lg:left-12">
            <Image src="/gallery/illustrations/illustration-9.png" alt="" width={160} height={160} />
          </Reveal>
          <Reveal mount delay={0.1} className="hidden sm:absolute sm:right-4 sm:top-8 sm:block sm:size-28 lg:right-12">
            <Image src="/gallery/illustrations/illustration-3.png" alt="" width={160} height={160} />
          </Reveal>

          <Reveal mount>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cta">Contacto</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Escribinos</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Para agendar una cita usá el formulario de &ldquo;Agendar cita&rdquo;. Este canal es para consultas
              generales; ante una urgencia, escribinos directo por WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaLink href={WHATSAPP_URL} variant="cta">
                Escribinos por WhatsApp
              </CtaLink>
              <CtaLink href="/agendar-cita" variant="outline">
                Agendar cita
              </CtaLink>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <FloatingContactCard title="Escribinos cuando quieras" />
      </div>

      <Section className="bg-[#f9fafb]">
        <Reveal>
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">Dejanos tu mensaje</h2>
        </Reveal>
        {/* El formulario "sube" desde abajo -- el gesto natural de algo que se
            va a completar, distinto del fade lateral de la tarjeta de arriba. */}
        <div className="mx-auto mt-10 max-w-2xl">
          <Reveal direction="up" duration={0.7} delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </Section>

      {/* Mapa real embebido -- reemplaza el placeholder enlazado. Fade puro,
          sin desplazamiento: es un elemento de utilidad, no protagonista. */}
      <Section className="pt-0">
        <Reveal direction="fade" duration={0.8}>
          <div className="mx-auto aspect-21/9 w-full max-w-4xl overflow-hidden rounded-3xl shadow-elevation-3">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d127238.10319071656!2d-74.16085941045108!3d4.736901797248434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sla%2026%20con%207!5e0!3m2!1ses!2sco!4v1789530874639!5m2!1ses!2sco"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title={`Ubicación de ${CLINIC_NAME} en Google Maps`}
              className="size-full"
            />
          </div>
        </Reveal>
      </Section>

      <Section className="bg-section-cream">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Preguntas frecuentes" />
        </Reveal>
        <div className="mx-auto mt-12 max-w-4xl">
          <FaqColumns faqs={faqs.slice(0, 6)} />
        </div>
      </Section>
    </MarketingLayout>
  );
}

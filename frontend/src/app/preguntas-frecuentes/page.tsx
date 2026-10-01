import { AppointmentCta } from "@/components/marketing/appointment-cta";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { faqs } from "@/components/marketing/marketing-data";
import { Section } from "@/components/marketing/marketing-ui";
import { PageHero } from "@/components/marketing/page-hero";

export default function PreguntasFrecuentesPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Preguntas frecuentes"
        title="Todo lo que suelen preguntarnos antes de la primera visita"
        lead="Si tu duda no está aquí, escríbenos por WhatsApp o desde el formulario de contacto."
      />

      <Section className="pt-0">
        <FaqAccordion faqs={faqs} />
      </Section>

      <AppointmentCta />
    </MarketingLayout>
  );
}

import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ClinicWordmark, CLINIC_NAME } from "@/components/marketing/clinic-brand";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Clínica",
    links: [
      ["Servicios", "/servicios"],
      ["Equipo veterinario", "/equipo"],
      ["Urgencias", "/urgencias"],
      ["Nosotros", "/nosotros"],
      ["Preguntas frecuentes", "/preguntas-frecuentes"],
      ["Testimonios", "/testimonios"],
    ],
  },
  {
    title: "Recursos",
    links: [
      ["Blog", "/blog"],
      ["Agendar cita", "/agendar-cita"],
      ["Contacto", "/contacto"],
      ["Acceso al panel", "/login"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Política de datos", "/privacidad"],
      ["Términos y condiciones", "/terminos"],
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-xs">
          <ClinicWordmark />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Atención veterinaria integral para tu mascota: consulta, vacunación, cirugía y urgencias, con un equipo
            que la conoce desde la primera visita.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-foreground/80">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Calle 93 #14-20, Bogotá
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-primary" />
              <a href="tel:+576015550188" className="hover:text-primary">+57 601 555 0188</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-primary" />
              recepcion@vetlosandes.co
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              Lun a sáb, 8:00 a 19:00 · Urgencias 24/7
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    {...(href === "/login" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {CLINIC_NAME}.
        </div>
      </div>
    </footer>
  );
}

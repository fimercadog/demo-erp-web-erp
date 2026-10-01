import { Stethoscope, CalendarDays, Syringe, Package } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ClinicWordmark } from "@/components/marketing/clinic-brand";

const features = [
  {
    icon: Stethoscope,
    title: "Consulta veterinaria",
    desc: "Historia clínica completa, diagnósticos, recetas y seguimiento.",
  },
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    desc: "Citas online en tiempo real, por profesional y consultorio.",
  },
  {
    icon: Syringe,
    title: "Vacunas y preventivos",
    desc: "Control de esquemas con recordatorios automáticos.",
  },
  {
    icon: Package,
    title: "Farmacia e inventario",
    desc: "Stock, alertas de reorden y reportes clínicos integrados.",
  },
];

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <main className="site-theme grid min-h-screen bg-background text-foreground lg:grid-cols-2">

        {/* ── panel izquierdo — mismo lenguaje visual que el sitio público ── */}
        <section className="hidden overflow-hidden border-r border-border bg-muted px-12 py-16 lg:flex lg:flex-col lg:justify-center">
          <ClinicWordmark className="mb-10" />

          <h2 className="text-3xl font-extrabold leading-snug tracking-tight text-foreground">
            Toda la clínica en una sola plataforma
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Gestión de pacientes, agenda, historia clínica, farmacia y reportes — todo conectado.
          </p>

          {/* grid de servicios — mismo estilo que la sección de servicios del sitio */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── panel derecho — formulario ── */}
        <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-6">
          <div className="w-full max-w-md">
            <ClinicWordmark className="mb-8 justify-center" />
            {children}
          </div>
        </section>
      </main>
    </ThemeProvider>
  );
}

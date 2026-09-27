"use client";

import * as React from "react";
import { Syringe, Clock, MapPin, ShieldCheck, CheckCircle2, HeartPulse, User, Mail, Phone, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface ServiceItem {
  id: number;
  name: string;
  price: number;
  estimated_duration_minutes: number;
  type: string;
}

export default function SueroterapiaPublicPage() {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    service_id: "",
    client_name: "",
    email: "",
    phone: "",
    address: "",
    city: "Bogotá",
    neighborhood: "",
    address_reference: "",
    date: "",
    time: "10:00",
    notes: "",
    consent: false,
    website: "", // honeypot
  });

  React.useEffect(() => {
    api
      .get<{ data: ServiceItem[] }>("/public/domiciliary/services")
      .then((res) => {
        setServices(res.data.data);
      })
      .catch(() => {
        setServices([]);
        toast.error("No se pudieron cargar los servicios de sueroterapia.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.service_id) {
      toast.error("Por favor selecciona un servicio de sueroterapia.");
      return;
    }

    if (!form.consent) {
      toast.error("Debes aceptar los términos y el consentimiento informado.");
      return;
    }

    setSubmitting(true);
    try {
      const startsAt = `${form.date}T${form.time}:00`;
      await api.post("/public/domiciliary/book", {
        service_id: Number(form.service_id),
        client_name: form.client_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        neighborhood: form.neighborhood,
        address_reference: form.address_reference || undefined,
        starts_at: startsAt,
        notes: form.notes || undefined,
        consent: form.consent,
        website: form.website || undefined,
      });

      toast.success("¡Tu cita de sueroterapia a domicilio ha sido agendada! Te contactaremos para confirmar.");
      setForm({
        service_id: "",
        client_name: "",
        email: "",
        phone: "",
        address: "",
        city: "Bogotá",
        neighborhood: "",
        address_reference: "",
        date: "",
        time: "10:00",
        notes: "",
        consent: false,
        website: "",
      });
    } catch {
      toast.error("Error al agendar la cita. Revisa los datos ingresados.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Disclaimer de datos de demostración */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 p-2 text-center text-xs text-amber-800 dark:text-amber-300">
        ⚠️ <strong>Aviso de Demostración:</strong> VITA INFUSION S.A.S. y sus productos representan un conjunto de datos ficticios de demostración de FidelOS.
      </div>

      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Syringe className="h-6 w-6" />
            <span>VITA INFUSION</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sueroterapia a Domicilio</span>
          </div>
          <Button onClick={() => document.getElementById("agendamiento")?.scrollIntoView({ behavior: "smooth" })} size="sm">
            Solicitar Servicio
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Terapia de Infusión IV de Alta Calidad en la Comodidad de tu Hogar
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Sueroterapia a Domicilio con Profesionales de Salud
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Restaura tu vitalidad, fortalece tu sistema inmune y acelera tu recuperación con infusiones intravenosas aplicadas por personal calificado en tu residencia u oficina.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Atención 100% Profesional
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Kits de Infusión Esterilizados
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Cobertura en Tu Ciudad
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Infusiones */}
      <section className="py-12 px-4 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Nuestros Sueros & Infusiones Especializadas</h2>
          <p className="text-sm text-muted-foreground">Formulaciones intravenosas diseñadas para tu bienestar integral</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <HeartPulse className="h-6 w-6 text-primary" />
                  <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                    {s.estimated_duration_minutes} min
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{s.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Infusión intravenosa directa a domicilio.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-primary">
                  ${s.price.toLocaleString("es-CO")}
                </div>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => {
                    setForm((f) => ({ ...f, service_id: String(s.id) }));
                    document.getElementById("agendamiento")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Seleccionar este suero <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ¿Cómo Funciona la Atención a Domicilio? */}
      <section className="py-12 px-4 bg-muted/40 border-y">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">¿Cómo Funciona la Atención a Domicilio?</h2>
            <p className="text-sm text-muted-foreground">Proceso transparente y seguro en 4 sencillos pasos</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">1</div>
              <h3 className="font-semibold text-sm">Eliges tu Suero</h3>
              <p className="text-xs text-muted-foreground">Seleccionas la terapia IV según tu necesidad metabólica u objetivo.</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">2</div>
              <h3 className="font-semibold text-sm">Registras tu Domicilio</h3>
              <p className="text-xs text-muted-foreground">Ingresas dirección, barrio y fecha/hora sugerida para la visita.</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">3</div>
              <h3 className="font-semibold text-sm">Llegada del Profesional</h3>
              <p className="text-xs text-muted-foreground">Un profesional de salud llega con insumos sellados y estériles.</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">4</div>
              <h3 className="font-semibold text-sm">Recibes la Infusión</h3>
              <p className="text-xs text-muted-foreground">Te relajas en casa mientras la infusión actúa directamente en tu torrente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de Agendamiento a Domicilio */}
      <section id="agendamiento" className="py-16 px-4 max-w-3xl mx-auto">
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Agendar Atención a Domicilio</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              Completa los datos de tu residencia y horario deseado para coordinar tu profesional de enfermería.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" />

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Selecciona tu Terapia / Suero *</label>
                <select
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                >
                  <option value="">-- Elige una terapia intravenosa --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ${s.price.toLocaleString("es-CO")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Nombre Completo *</label>
                  <Input required placeholder="Tu nombre" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Correo Electrónico *</label>
                  <Input required type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Teléfono / WhatsApp *</label>
                  <Input required placeholder="+57 300 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Ciudad *</label>
                  <Input required placeholder="Bogotá" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Dirección de Atención *</label>
                  <Input required placeholder="Calle 93 #14-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Barrio / Zona *</label>
                  <Input required placeholder="Chicó / Rosales / Cedritos" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Referencia del Domicilio (Opcional)</label>
                <Input placeholder="Ej: Apto 502, Torre B, timbrar 502" value={form.address_reference} onChange={(e) => setForm({ ...form, address_reference: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Fecha Sugerida *</label>
                  <Input required type="date" min={new Date().toISOString().split("T")[0]} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Hora Preferida *</label>
                  <Input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Observaciones o Síntomas (Opcional)</label>
                <Input placeholder="Ej: Vengo de un viaje, requiero rehidratación" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="rounded border"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer">
                  Acepto el tratamiento de datos y autorizo la visita médica/enfermería a domicilio.
                </label>
              </div>

              <Button type="submit" disabled={submitting} className="w-full size-lg font-semibold text-base mt-2">
                {submitting ? "Agendando..." : "Confirmar Reserva a Domicilio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-2">
          <p>© 2026 VITA INFUSION S.A.S. (Demo) — Plataforma FidelOS. Todos los derechos reservados.</p>
          <p>Los servicios prestados son realizados por profesionales de la salud debidamente autorizados.</p>
        </div>
      </footer>
    </div>
  );
}

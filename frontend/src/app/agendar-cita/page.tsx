"use client";

import * as React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, AlertCircle, Download } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CLINIC_NAME } from "@/components/marketing/clinic-brand";
import { api } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────
type Service = { id: number; name: string; description: string | null; estimated_duration_minutes: number | null; price?: string };
type Option  = { id: number; name: string };

// ─── helpers ──────────────────────────────────────────────────────────────────
const TODAY     = new Date();
const inputCls  = "h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary";
const DAYS      = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function isPast(y: number, m: number, d: number) {
  const t = new Date(TODAY); t.setHours(0,0,0,0);
  return new Date(y, m, d) < t;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

type ConfirmedPDF = { starts_at: string; service: string; owner_name: string; pet_name: string; email: string };

async function downloadCitaPDF(data: ConfirmedPDF) {
  const [{ jsPDF }, QRCode] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const W     = 210;
  const blue  = [47, 92, 147] as const;
  const lightBlue = [234, 241, 248] as const;
  const dark  = [24, 24, 27] as const;
  const gray  = [100, 105, 115] as const;
  const pageUrl = window.location.origin + "/agendar-cita";

  const dateStr = new Date(data.starts_at).toLocaleString("es-CO", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: 240, margin: 1, color: { dark: "#2f5c93", light: "#f0f5fc" },
  });

  // ── accent stripe izquierda ──────────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(0, 0, 8, 297, "F");

  // ── header área ─────────────────────────────────────────────────────────
  doc.setFillColor(...lightBlue);
  doc.rect(8, 0, W - 8, 44, "F");

  // círculo de inicial
  doc.setFillColor(...blue);
  doc.circle(26, 22, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_NAME.charAt(0), 26, 26, { align: "center" });

  // nombre clínica
  doc.setTextColor(...dark);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_NAME, 42, 18);

  // badge COMPROBANTE
  doc.setFillColor(...blue);
  doc.roundedRect(42, 21, 52, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROBANTE DE CITA", 68, 26, { align: "center" });

  // ── cuerpo: tarjeta blanca ───────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(18, 52, W - 36, 168, 4, 4, "F");
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(18, 52, W - 36, 168, 4, 4, "S");

  // filas de datos
  const rows: [string, string][] = [
    ["Fecha y hora", dateStr],
    ["Servicio",     data.service],
    ["Mascota",      data.pet_name],
    ["Propietario",  data.owner_name],
    ["Email",        data.email],
  ];
  let y = 66;
  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    // accent dot
    doc.setFillColor(...blue);
    doc.circle(27, y - 1, 1.2, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text(label.toUpperCase(), 31, y);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(value, 105) as string[];
    doc.text(lines, 31, y + 6);
    y += 6 + lines.length * 5.5 + 6;

    if (i < rows.length - 1) {
      doc.setDrawColor(235, 238, 243);
      doc.setLineWidth(0.2);
      doc.line(26, y - 3, W - 22, y - 3);
    }
  }

  // ── QR: tarjeta derecha baja ─────────────────────────────────────────────
  doc.setFillColor(...lightBlue);
  doc.roundedRect(130, 56, 62, 62, 3, 3, "F");
  doc.addImage(qrDataUrl, "PNG", 134, 60, 54, 54);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...blue);
  doc.text("Agendar nueva cita", 161, 122, { align: "center" });

  // ── footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(8, 275, W - 8, 22, "F");
  doc.setTextColor(200, 215, 235);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Calle 93 #14-20, Bogotá  ·  +57 601 555 0188  ·  recepcion@vetdemo.co",
    W / 2 + 4, 287, { align: "center" },
  );
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.text("Documento generado automáticamente · no requiere firma", W / 2 + 4, 293, { align: "center" });

  doc.save(`cita-${data.pet_name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

// ─── sub-components ───────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Servicio", "Fecha y hora", "Tus datos"];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => {
          const idx = i + 1;
          const done    = step > idx;
          const current = step === idx;
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors
                  ${done    ? "bg-primary text-primary-foreground"
                  : current ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="size-5" /> : idx}
                </div>
                <span className={`text-xs font-medium ${current ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mb-5 h-0.5 flex-1 mx-2 rounded transition-colors ${step > idx ? "bg-primary" : "bg-border"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCard({ svc, selected, onClick }: { svc: Service; selected: boolean; onClick: () => void }) {
  const icons: Record<string, string> = {
    consulta: "🩺", vacunacion: "💉", cirugia: "🔬",
    curacion: "🩹", hospitalizacion: "🏥", peluqueria: "✂️", otro: "📋",
  };
  const icon = Object.entries(icons).find(([k]) => svc.name.toLowerCase().includes(k))?.[1] ?? "🐾";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all
        ${selected
          ? "border-primary bg-accent shadow-[0_0_0_2px_var(--primary)]"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"}`}
    >
      <span className="mt-0.5 text-3xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground leading-tight">{svc.name}</p>
        {svc.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{svc.description}</p>}
        <div className="mt-2 flex flex-wrap gap-3">
          {svc.estimated_duration_minutes && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />{svc.estimated_duration_minutes} min
            </span>
          )}
          {svc.price && Number(svc.price) > 0 && (
            <span className="text-xs font-medium text-primary">
              ${Number(svc.price).toLocaleString("es-CO")}
            </span>
          )}
        </div>
      </div>
      <div className={`mt-1 size-5 shrink-0 rounded-full border-2 transition-colors
        ${selected ? "border-primary bg-primary" : "border-border"}`}>
        {selected && <CheckCircle2 className="size-4 text-primary-foreground" />}
      </div>
    </button>
  );
}

function MonthCalendar({
  year, month, onPrev, onNext, onSelectDay, selectedDay, loadingDay, availableDays,
}: {
  year: number; month: number;
  onPrev: () => void; onNext: () => void;
  onSelectDay: (iso: string) => void;
  selectedDay: string; loadingDay: string;
  availableDays: Set<string>;
}) {
  const firstDow  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells     = Array.from({ length: firstDow + daysCount }, (_, i) =>
    i < firstDow ? null : i - firstDow + 1
  );
  const isPrevDisabled = year === TODAY.getFullYear() && month === TODAY.getMonth();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isPrevDisabled}
          className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold text-foreground">{MONTHS[month]} {year}</span>
        <button
          type="button"
          onClick={onNext}
          className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* weekday labels */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map(d => (
          <span key={d} className="py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{d}</span>
        ))}
      </div>

      {/* day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso      = isoDate(new Date(year, month, day));
          const past     = isPast(year, month, day);
          const loading  = loadingDay === iso;
          const selected = selectedDay === iso;
          const hasSlots = availableDays.has(iso);

          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => !past && onSelectDay(iso)}
              className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                ${past
                  ? "cursor-default text-muted-foreground/40"
                  : selected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : hasSlots
                      ? "border border-primary/30 bg-accent text-primary hover:bg-primary hover:text-primary-foreground"
                      : "hover:bg-muted text-foreground"}`}
            >
              {day}
              {loading && !selected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary/60 animate-pulse" />
              )}
              {!loading && hasSlots && !selected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function AgendarCitaPage() {
  const [step, setStep] = React.useState(1);

  // step 1
  const [services,   setServices]   = React.useState<Service[]>([]);
  const [serviceId,  setServiceId]  = React.useState<number | null>(null);

  // step 2
  const [calYear,  setCalYear]  = React.useState(TODAY.getFullYear());
  const [calMonth, setCalMonth] = React.useState(TODAY.getMonth());
  const [selectedDay,   setSelectedDay]   = React.useState("");
  const [loadingDay,    setLoadingDay]    = React.useState("");
  const [slots,         setSlots]         = React.useState<string[]>([]);
  const [selectedSlot,  setSelectedSlot]  = React.useState("");
  const [availableDays, setAvailableDays] = React.useState<Set<string>>(new Set());

  // step 3
  const [species,   setSpecies]   = React.useState<Option[]>([]);
  const [breeds,    setBreeds]    = React.useState<Option[]>([]);
  const [speciesId, setSpeciesId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error,      setError]      = React.useState("");
  const [confirmed,  setConfirmed]  = React.useState<ConfirmedPDF | null>(null);

  // load services
  React.useEffect(() => {
    api.get("/public/appointments/services").then(r => setServices(r.data.data ?? []));
    api.get("/public/appointments/species").then(r => setSpecies(r.data ?? []));
  }, []);

  // load breeds when species changes
  React.useEffect(() => {
    if (!speciesId) { setBreeds([]); return; }
    api.get(`/public/appointments/species/${speciesId}/breeds`).then(r => setBreeds(r.data ?? []));
  }, [speciesId]);

  // prefetch availability for visible month days
  React.useEffect(() => {
    if (!serviceId || step !== 2) return;
    const daysCount = new Date(calYear, calMonth + 1, 0).getDate();
    const days: string[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const iso = isoDate(new Date(calYear, calMonth, d));
      if (!isPast(calYear, calMonth, d)) days.push(iso);
    }
    // check first 14 days to know which to highlight (skip weekends/past)
    Promise.all(
      days.slice(0, 14).map(iso =>
        api.get("/public/appointments/availability", { params: { service_id: serviceId, date: iso } })
          .then(r => ({ iso, slots: r.data.slots ?? [] }))
          .catch(() => ({ iso, slots: [] }))
      )
    ).then(results => {
      const available = new Set<string>(results.filter(r => r.slots.length > 0).map(r => r.iso));
      setAvailableDays(available);
    });
  }, [serviceId, calYear, calMonth, step]);

  // fetch slots when day is selected
  async function handleDaySelect(iso: string) {
    setSelectedDay(iso);
    setSelectedSlot("");
    setSlots([]);
    setLoadingDay(iso);
    try {
      const r = await api.get("/public/appointments/availability", {
        params: { service_id: serviceId, date: iso },
      });
      setSlots(r.data.slots ?? []);
    } finally {
      setLoadingDay("");
    }
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(""); setSelectedSlot(""); setSlots([]);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(""); setSelectedSlot(""); setSlots([]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError("");
    const fd = new FormData(e.currentTarget);
    const ownerName = String(fd.get("name") ?? "").trim();
    const petName   = String(fd.get("pet_name") ?? "").trim();
    const email     = String(fd.get("email") ?? "").trim();
    try {
      const res = await api.post("/public/appointments/book", {
        service_id: serviceId,
        date: selectedDay,
        start_time: selectedSlot,
        species_id: Number(speciesId),
        breed_id: fd.get("breed_id") ? Number(fd.get("breed_id")) : null,
        pet_name: petName,
        name: ownerName,
        email,
        phone: String(fd.get("phone") ?? "").trim() || null,
        company_website: String(fd.get("company_website") ?? ""),
        consent: fd.get("consent") === "on",
      });
      setConfirmed({ ...res.data.appointment, owner_name: ownerName, pet_name: petName, email });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 409 ? "Ese horario se acaba de ocupar. Volvé al paso anterior y elegí otro."
        : status === 422 ? "Revisa los datos: todos los campos marcados con * son obligatorios."
        : "No se pudo agendar. Intenta de nuevo o llama a la clínica.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find(s => s.id === serviceId);

  // auto-download PDF on confirmation
  React.useEffect(() => {
    if (!confirmed) return;
    downloadCitaPDF(confirmed);
  }, [confirmed]);

  // ── confirmed ──────────────────────────────────────────────────────────────
  if (confirmed) {
    const dateStr = new Date(confirmed.starts_at).toLocaleString("es-CO", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
    });
    return (
      <MarketingLayout>
        <section className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-accent">
              <CheckCircle2 className="size-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Cita confirmada!</h1>
          <p className="text-sm text-muted-foreground mb-6">El comprobante PDF se descargó automáticamente.</p>

          {/* resumen */}
          <div className="mt-2 rounded-2xl border border-border bg-card p-6 text-left shadow-elevation-1 space-y-3">
            <Row label="Fecha y hora" value={dateStr} />
            <Row label="Servicio"     value={confirmed.service} />
            <Row label="Mascota"      value={confirmed.pet_name} />
            <Row label="Propietario"  value={confirmed.owner_name} />
            <Row label="Email"        value={confirmed.email} />
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Recibirás un recordatorio antes de tu cita. Para cancelar o reagendar, contáctanos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => downloadCitaPDF(confirmed)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Download className="size-4" /> Descargar PDF
            </button>
            <a
              href="/agendar-cita"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Agendar otra cita
            </a>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <section className="bg-muted/40 py-10">
      <div className="mx-auto max-w-2xl px-4 pb-14 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Agendar cita</h1>
          <p className="mt-1 text-sm text-muted-foreground">Disponibilidad real · Confirmación inmediata</p>
        </div>

        <StepBar step={step} />

        {/* ── STEP 1: servicio ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground mb-4">¿Qué servicio necesitas?</p>
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">Cargando servicios…</p>
            )}
            {services.map(svc => (
              <ServiceCard
                key={svc.id}
                svc={svc}
                selected={serviceId === svc.id}
                onClick={() => setServiceId(svc.id)}
              />
            ))}
            <div className="pt-4">
              <button
                type="button"
                disabled={!serviceId}
                onClick={() => setStep(2)}
                className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continuar — elegir fecha y hora
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: calendario + slots ────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* selected service summary */}
            {selectedService && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 px-4 py-3">
                <span className="text-xl">🐾</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedService.name}</p>
                  {selectedService.estimated_duration_minutes && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />{selectedService.estimated_duration_minutes} min
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-primary hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}

            <MonthCalendar
              year={calYear}
              month={calMonth}
              onPrev={prevMonth}
              onNext={nextMonth}
              onSelectDay={handleDaySelect}
              selectedDay={selectedDay}
              loadingDay={loadingDay}
              availableDays={availableDays}
            />

            {/* slots */}
            {selectedDay && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Horarios disponibles —{" "}
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-CO", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
                {loadingDay === selectedDay ? (
                  <p className="text-sm text-muted-foreground">Buscando horarios…</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay horarios disponibles ese día. Probá otra fecha.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-all
                          ${selectedSlot === slot
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-accent"}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ChevronLeft className="size-4" /> Atrás
              </button>
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-90"
              >
                Continuar — ingresar mis datos
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: datos del paciente ────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

            {/* resumen */}
            {selectedService && selectedDay && selectedSlot && (
              <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm">
                <p className="font-semibold text-foreground">{selectedService.name}</p>
                <p className="text-muted-foreground">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-CO", {
                    weekday: "long", day: "numeric", month: "long",
                  })}{" "}
                  · {selectedSlot}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  Cambiar fecha u horario
                </button>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Datos de la mascota</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Especie *</span>
                  <select
                    className={inputCls}
                    value={speciesId}
                    onChange={e => { setSpeciesId(e.target.value); setBreeds([]); }}
                    required
                  >
                    <option value="">Elige una especie</option>
                    {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Raza</span>
                  <select name="breed_id" className={inputCls} disabled={breeds.length === 0}>
                    <option value="">{breeds.length === 0 ? "—" : "Opcional"}</option>
                    {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted-foreground">Nombre de la mascota *</span>
                  <input name="pet_name" required className={inputCls} placeholder="Ej: Max" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-semibold text-foreground">Tus datos de contacto</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted-foreground">Tu nombre *</span>
                  <input name="name" required className={inputCls} placeholder="Nombre completo" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Correo *</span>
                  <input name="email" type="email" required className={inputCls} placeholder="correo@ejemplo.com" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Teléfono</span>
                  <input name="phone" className={inputCls} placeholder="300 000 0000" />
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-primary" />
              <span>
                Autorizo el tratamiento de mis datos personales para ser contactado, conforme a la{" "}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2 hover:opacity-80">
                  Ley 1581 de 2012
                </a>{" "}
                y acepto los{" "}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2 hover:opacity-80">
                  términos y condiciones
                </a>.
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ChevronLeft className="size-4" /> Atrás
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {submitting ? "Confirmando…" : "Confirmar cita"}
              </button>
            </div>
          </form>
        )}
      </div>
      </section>
    </MarketingLayout>
  );
}

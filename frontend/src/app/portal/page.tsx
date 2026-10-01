"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, LogOut } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { api } from "@/lib/api";

type PortalAppointment = {
  id: number;
  patient: string | null;
  service_id: number | null;
  service: string | null;
  practitioner: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  attended: "Atendida",
  no_show: "No asistió",
  cancelled: "Cancelada",
};

const TODAY = new Date().toISOString().slice(0, 10);
const MAX_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function whenLabel(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function RescheduleForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: PortalAppointment;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = React.useState("");
  const [slots, setSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!date) return;
    api
      .get("/public/appointments/availability", { params: { service_id: appointment.service_id, date } })
      .then((res) => setSlots(res.data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [date, appointment.service_id]);

  function selectDate(value: string) {
    setDate(value);
    setSlots([]);
    setLoadingSlots(true);
  }

  async function confirm(startTime: string) {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/portal/appointments/${appointment.id}/reschedule`, { date, start_time: startTime });
      onDone();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 409 ? "Ese horario se acaba de ocupar. Elegí otro." : "No se pudo reagendar. Elegí otro horario.");
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <label className="block text-sm">
        <span>Nueva fecha</span>
        <input
          type="date"
          min={TODAY}
          max={MAX_DATE}
          value={date}
          onChange={(e) => selectDate(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
        />
      </label>
      {date && (
        <div className="mt-3">
          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">Buscando horarios…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay horarios ese día. Probá otra fecha.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  disabled={saving}
                  onClick={() => confirm(slot)}
                  className="rounded-lg border border-input px-2 py-2 text-sm hover:border-primary/50 disabled:opacity-60"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button type="button" onClick={onCancel} className="mt-3 text-sm text-muted-foreground underline">
        Cancelar
      </button>
    </div>
  );
}

export default function PortalPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [appointments, setAppointments] = React.useState<PortalAppointment[] | null>(null);
  const [reschedulingId, setReschedulingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    api
      .get<{ data: PortalAppointment[] }>("/portal/appointments")
      .then((res) => setAppointments(res.data.data))
      .catch(() => setError("No se pudieron cargar tus citas."));
  }, []);

  React.useEffect(() => {
    api
      .get("/portal/me")
      .then(() => {
        setChecking(false);
        load();
      })
      .catch(() => router.replace("/portal/entrar"));
  }, [router, load]);

  async function logout() {
    try {
      await api.post("/portal/logout");
    } finally {
      router.replace("/portal/entrar");
    }
  }

  async function cancelAppointment(id: number) {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    try {
      await api.post(`/portal/appointments/${id}/cancel`);
      load();
    } catch {
      setError("No se pudo cancelar la cita.");
    }
  }

  if (checking) {
    return (
      <MarketingLayout>
        <PageHero eyebrow="Portal del dueño" title="Tu portal" lead="" />
        <p className="mx-auto max-w-2xl px-4 pb-24 text-sm text-muted-foreground sm:px-6">Cargando…</p>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <PageHero eyebrow="Portal del paciente" title="Tus citas médicas" lead="Gestioná tus citas médicas y las de tu grupo familiar: reagendá o cancelá cuando lo necesites." />
      <section className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={logout} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        {appointments === null ? (
          <p className="text-sm text-muted-foreground">Cargando tus citas…</p>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Todavía no tienes citas. <a href="/agendar-cita" className="text-primary underline">Agenda una</a>.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => {
              const canManage = a.status === "scheduled" || a.status === "confirmed";
              return (
                <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-elevation-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarClock className="size-4 text-primary" />
                      {whenLabel(a.starts_at)}
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[a.patient, a.service, a.practitioner].filter(Boolean).join(" · ")}
                  </p>

                  {canManage && (
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}
                        className="text-sm text-primary underline"
                      >
                        Reagendar
                      </button>
                      <button type="button" onClick={() => cancelAppointment(a.id)} className="text-sm text-destructive underline">
                        Cancelar cita
                      </button>
                    </div>
                  )}

                  {reschedulingId === a.id && (
                    <RescheduleForm
                      appointment={a}
                      onCancel={() => setReschedulingId(null)}
                      onDone={() => {
                        setReschedulingId(null);
                        load();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}

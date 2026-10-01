"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppointmentStatusAction } from "@/components/crud/appointment-status-action";
import { APPOINTMENT_STATUS_LABEL as STATUS_LABEL } from "@/lib/appointments";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { isoDateLocal as isoDate } from "@/lib/utils";
import { Appointment } from "@/lib/types";

const DAYS_ES  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isoStr(d: Date) {
  return isoDate(d);
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

type ViewMode = "month" | "week";

export default function AgendaPage() {
  const today = isoDate(new Date());
  const todayDate = new Date(today + "T12:00:00");

  const [view, setView] = React.useState<ViewMode>("month");
  const [year, setYear] = React.useState(todayDate.getFullYear());
  const [month, setMonth] = React.useState(todayDate.getMonth()); // 0-indexed
  const [weekAnchor, setWeekAnchor] = React.useState(today); // ISO, Monday of current week
  const [selected, setSelected] = React.useState(today);
  const [byDay, setByDay] = React.useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = React.useState(true);

  // Compute date range for the current view
  const { from, to, days } = React.useMemo(() => {
    if (view === "month") {
      const first = startOfMonth(year, month);
      // go back to Sunday of the week containing the 1st
      const startOffset = first.getDay(); // 0=Sun
      const start = addDays(first, -startOffset);
      // always show 6 weeks = 42 cells
      const end = addDays(start, 41);
      const all: Date[] = [];
      for (let i = 0; i <= 41; i++) all.push(addDays(start, i));
      return { from: isoStr(start), to: isoStr(end), days: all };
    } else {
      // week: anchor is first day of week shown
      const anchor = new Date(weekAnchor + "T12:00:00");
      const dow = anchor.getDay(); // 0=Sun
      const monday = addDays(anchor, -dow); // start from Sunday
      const all: Date[] = [];
      for (let i = 0; i < 7; i++) all.push(addDays(monday, i));
      return { from: isoStr(all[0]), to: isoStr(all[6]), days: all };
    }
  }, [view, year, month, weekAnchor]);

  const load = React.useCallback(() => {
    setLoading(true);
    api
      .get<{ data: Appointment[] }>("/appointments", {
        params: { date_from: from, date_to: to, per_page: 500 },
      })
      .then((r) => {
        const grouped: Record<string, Appointment[]> = {};
        for (const a of r.data.data) {
          const d = a.starts_at.slice(0, 10);
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(a);
        }
        setByDay(grouped);
      })
      .catch(() => toast.error("No se pudo cargar la agenda."))
      .finally(() => setLoading(false));
  }, [from, to]);

  React.useEffect(() => { load(); }, [load]);

  function prevPeriod() {
    if (view === "month") {
      if (month === 0) { setYear(y => y - 1); setMonth(11); }
      else setMonth(m => m - 1);
    } else {
      const anchor = new Date(weekAnchor + "T12:00:00");
      setWeekAnchor(isoStr(addDays(anchor, -7)));
    }
  }
  function nextPeriod() {
    if (view === "month") {
      if (month === 11) { setYear(y => y + 1); setMonth(0); }
      else setMonth(m => m + 1);
    } else {
      const anchor = new Date(weekAnchor + "T12:00:00");
      setWeekAnchor(isoStr(addDays(anchor, 7)));
    }
  }
  function goToday() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setWeekAnchor(today);
    setSelected(today);
  }

  const items = byDay[selected] ?? [];
  const periodLabel = view === "month"
    ? `${MONTHS_ES[month]} ${year}`
    : `Semana del ${days[0].getDate()} al ${days[6].getDate()} de ${MONTHS_ES[days[6].getMonth()]} ${days[6].getFullYear()}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
          <Button variant="ghost" size="icon" onClick={prevPeriod}><ChevronLeft className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={nextPeriod}><ChevronRight className="size-4" /></Button>
          <span className="text-base font-semibold">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "month" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              Mes
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm font-medium border-l border-border transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              Semana
            </button>
          </div>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="size-4" /></Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS_ES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {view === "month" ? (
            <div className="grid grid-cols-7">
              {days.map((date, i) => {
                const iso = isoStr(date);
                const isCurrentMonth = date.getMonth() === month;
                const isToday = iso === today;
                const isSel = iso === selected;
                const appts = byDay[iso] ?? [];
                const borderT = i >= 7 ? "border-t border-border" : "";
                const borderL = i % 7 !== 0 ? "border-l border-border" : "";
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={`min-h-[80px] p-1.5 text-left transition-colors ${borderT} ${borderL} ${isSel ? "bg-primary/5" : "hover:bg-muted/60"}`}
                  >
                    <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                      isToday ? "bg-primary text-primary-foreground" :
                      isSel ? "bg-primary/20 text-primary" :
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"
                    }`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {appts.slice(0, 3).map((a) => (
                        <div key={a.id} className="truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] font-medium text-primary">
                          {timeLabel(a.starts_at)} {a.patient ?? a.client ?? "Cita"}
                        </div>
                      ))}
                      {appts.length > 3 && (
                        <div className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          +{appts.length - 3} más
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Week view: columns */
            <div className="grid grid-cols-7 divide-x divide-border">
              {days.map((date) => {
                const iso = isoStr(date);
                const isToday = iso === today;
                const isSel = iso === selected;
                const appts = byDay[iso] ?? [];
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={`min-h-[200px] p-2 text-left transition-colors ${isSel ? "bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <span className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday ? "bg-primary text-primary-foreground" :
                      isSel ? "bg-primary/20 text-primary" : "text-foreground"
                    }`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-2 space-y-1">
                      {appts.map((a) => (
                        <div key={a.id} className="rounded bg-primary/15 px-1.5 py-1 text-[11px] text-primary">
                          <span className="font-semibold">{timeLabel(a.starts_at)}</span>
                          <span className="ml-1 font-normal">{a.patient ?? a.client ?? "Cita"}</span>
                        </div>
                      ))}
                      {appts.length === 0 && (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected day detail */}
      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">
          {new Date(selected + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {items.length > 0 && <span className="ml-2 text-muted-foreground font-normal">· {items.length} {items.length === 1 ? "cita" : "citas"}</span>}
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Sin citas para este día.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="w-16 shrink-0 text-sm font-semibold tabular-nums">{timeLabel(a.starts_at)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {a.patient_id ? (
                        <Link href={`/app/pacientes/${a.patient_id}`} className="text-primary hover:underline">
                          {a.patient ?? "Paciente"}
                        </Link>
                      ) : (a.patient)}
                      {a.client ? <span className="text-muted-foreground"> · {a.client}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[a.service, a.practitioner, a.resource, a.reason].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <StatusBadge status={a.status} label={STATUS_LABEL[a.status]} />
                  <AppointmentStatusAction appointment={a} onDone={load} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

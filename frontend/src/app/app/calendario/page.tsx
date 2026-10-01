"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { api, PaginatedResponse } from "@/lib/api";
import { ACTIVITY_TYPE_LABEL } from "@/lib/activity-fields";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActivityRow } from "@/lib/types";

function bucketLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "Vencidas";
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Manana";
  if (diff <= 7) return "Esta semana";
  return "Mas adelante";
}

const BUCKET_ORDER = ["Vencidas", "Hoy", "Manana", "Esta semana", "Mas adelante"];

export default function CalendarPage() {
  const [items, setItems] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<PaginatedResponse<ActivityRow>>("/activities", { params: { per_page: 100, completed: 0 } })
      .then((r) => setItems((r.data.data ?? []).filter((a) => a.due_date)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = React.useMemo(() => {
    const map = new Map<string, ActivityRow[]>();
    for (const a of [...items].sort((x, y) => (x.due_date! < y.due_date! ? -1 : 1))) {
      const key = bucketLabel(a.due_date!);
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => [b, map.get(b)!] as const);
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendario</h1>
        <p className="text-sm text-muted-foreground">Citas, llamadas y tareas pendientes con fecha.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay actividades pendientes con fecha.</p>
        </div>
      ) : (
        grouped.map(([bucket, rows]) => (
          <section key={bucket}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{bucket}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {rows.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {new Date(`${a.due_date}T00:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </span>
                  <StatusBadge status={a.type} label={ACTIVITY_TYPE_LABEL[a.type] ?? a.type} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.client?.name ?? ""}</span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

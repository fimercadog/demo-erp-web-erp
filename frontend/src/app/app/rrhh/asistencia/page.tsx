"use client";

import * as React from "react";
import { LogIn, LogOut, Clock, Calendar, CheckCircle2, AlertTriangle, UserCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "absent" | "justified_absence";
  work_duration_minutes: number | null;
  notes: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface AttendanceStatus {
  has_checked_in: boolean;
  has_checked_out: boolean;
  attendance: AttendanceRecord | null;
}

interface AttendanceSummary {
  total_records: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  justified_absence_count: number;
  total_hours_worked: number;
  average_daily_hours: number;
}

const STATUS_LABELS: Record<AttendanceRecord["status"], { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
  present: { label: "Presente", variant: "success" },
  late: { label: "Atraso", variant: "warning" },
  absent: { label: "Ausente", variant: "destructive" },
  justified_absence: { label: "Ausencia Justificada", variant: "default" },
};

export default function RrhhAsistenciaPage() {
  const [status, setStatus] = React.useState<AttendanceStatus | null>(null);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = React.useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  // Filters
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Novedad modal / form state
  const [showNovedadModal, setShowNovedadModal] = React.useState(false);
  const [novedadForm, setNovedadForm] = React.useState({
    user_id: "",
    date: new Date().toISOString().split("T")[0],
    status: "justified_absence" as AttendanceRecord["status"],
    notes: "",
  });

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, recordsRes, summaryRes] = await Promise.all([
        api.get<{ data: AttendanceStatus }>("/attendance/status"),
        api.get<{ data: AttendanceRecord[] }>("/attendance", {
          params: { start_date: startDate || undefined, end_date: endDate || undefined },
        }),
        api.get<{ data: AttendanceSummary }>("/attendance/summary", {
          params: { start_date: startDate || undefined, end_date: endDate || undefined },
        }),
      ]);

      setStatus(statusRes.data.data);
      setRecords(recordsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch {
      toast.error("Error al cargar datos de asistencia.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await api.post("/attendance/check-in", { notes: notes || undefined });
      toast.success("¡Entrada registrada con éxito!");
      setNotes("");
      await loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Error al registrar entrada.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      await api.post("/attendance/check-out", { notes: notes || undefined });
      toast.success("¡Salida registrada con éxito!");
      setNotes("");
      await loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Error al registrar salida.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveNovedad(e: React.FormEvent) {
    e.preventDefault();
    if (!novedadForm.user_id) {
      toast.error("Por favor ingresa el ID del empleado.");
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/attendance/novedad", {
        user_id: Number(novedadForm.user_id),
        date: novedadForm.date,
        status: novedadForm.status,
        notes: novedadForm.notes || undefined,
      });
      toast.success("Novedad de asistencia registrada.");
      setShowNovedadModal(false);
      setNovedadForm({ user_id: "", date: new Date().toISOString().split("T")[0], status: "justified_absence", notes: "" });
      await loadAll();
    } catch {
      toast.error("Error al registrar novedad.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Control de Asistencia RRHH</h1>
          <p className="text-sm text-muted-foreground">
            Registro diario de entrada y salida, reporte de horas trabajadas y novedades del personal.
          </p>
        </div>
        <Button onClick={() => setShowNovedadModal(true)} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" /> Registrar Novedad / Justificación
        </Button>
      </div>

      {/* Daily Check-in / Check-out Card */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" /> Marca de Asistencia Hoy ({new Date().toLocaleDateString()})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Estado hoy:{" "}
                {status?.has_checked_out ? (
                  <span className="text-muted-foreground font-semibold">Salida Registrada ✅</span>
                ) : status?.has_checked_in ? (
                  <span className="text-green-600 font-semibold">En Turno (Entrada: {status.attendance?.check_in ? new Date(status.attendance.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""})</span>
                ) : (
                  <span className="text-amber-600 font-semibold">Sin Registrar Entrada ⏳</span>
                )}
              </p>
              {status?.attendance?.notes && (
                <p className="text-xs text-muted-foreground">Observaciones: {status.attendance.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Observación opcional (ej: cambio de turno)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full sm:w-64 text-sm"
              />
              {!status?.has_checked_in ? (
                <Button onClick={handleCheckIn} disabled={actionLoading} className="gap-2 bg-green-600 hover:bg-green-700">
                  <LogIn className="h-4 w-4" /> Marcar Entrada
                </Button>
              ) : !status?.has_checked_out ? (
                <Button onClick={handleCheckOut} disabled={actionLoading} variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" /> Marcar Salida
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Turno Completado
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-green-600" /> Asistencias A Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.present_count ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Llegadas Tardías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary?.late_count ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Ausencias Justificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{summary?.justified_absence_count ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-600" /> Horas Promedio / Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.average_daily_hours ?? 0} hrs</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Attendance List */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium">Historial de Registros</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Desde:</span>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Hasta:</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }} className="h-8 text-xs">
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2">Empleado</th>
                  <th className="py-2">Entrada</th>
                  <th className="py-2">Salida</th>
                  <th className="py-2">Duración</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r) => {
                  const statusInfo = STATUS_LABELS[r.status] || { label: r.status, variant: "default" };
                  const durationHours = r.work_duration_minutes ? (r.work_duration_minutes / 60).toFixed(1) + " hrs" : "-";
                  return (
                    <tr key={r.id} className="hover:bg-muted/50">
                      <td className="py-2.5 font-medium pr-3">{r.date}</td>
                      <td className="py-2.5">
                        <span className="font-medium">{r.user?.name ?? `ID #${r.user_id}`}</span>
                        {r.user?.email && <span className="block text-xs text-muted-foreground">{r.user.email}</span>}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-2.5 tabular-nums">{durationHours}</td>
                      <td className="py-2.5">
                        <StatusBadge status={r.status} label={statusInfo.label} />
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground max-w-xs truncate">{r.notes ?? "-"}</td>
                    </tr>
                  );
                })}
                {records.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No se encontraron registros de asistencia para las fechas seleccionadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Novedad / Justificación */}
      {showNovedadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">Registrar Novedad / Licencia</h2>
            <form onSubmit={handleSaveNovedad} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">ID Empleado (Usuario)</label>
                <Input
                  type="number"
                  required
                  placeholder="ID del usuario"
                  value={novedadForm.user_id}
                  onChange={(e) => setNovedadForm({ ...novedadForm, user_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                <Input
                  type="date"
                  required
                  value={novedadForm.date}
                  onChange={(e) => setNovedadForm({ ...novedadForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado / Tipo de Novedad</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={novedadForm.status}
                  onChange={(e) => setNovedadForm({ ...novedadForm, status: e.target.value as AttendanceRecord["status"] })}
                >
                  <option value="justified_absence">Ausencia Justificada (Incapacidad / Permiso)</option>
                  <option value="absent">Ausente (Sin Justificar)</option>
                  <option value="present">Presente (Ajuste Manual)</option>
                  <option value="late">Atraso (Ajuste Manual)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observaciones / Justificación</label>
                <Input
                  placeholder="Ej: Permiso médico EPS #12345"
                  value={novedadForm.notes}
                  onChange={(e) => setNovedadForm({ ...novedadForm, notes: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowNovedadModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  Guardar Novedad
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

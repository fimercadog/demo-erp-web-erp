"use client";

import * as React from "react";
import { Syringe, MapPin, Clock, Truck, CheckCircle2, User, Phone, Plus, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";

interface DomiciliaryAppointment {
  id: number;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price: number;
  status: string;
  dispatch_status: "pending" | "assigned" | "en_route" | "arrived" | "completed";
  address: string;
  city: string;
  neighborhood: string;
  address_reference: string | null;
  notes: string | null;
  client?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
    price: number;
  };
  practitioner?: {
    id: number;
    name: string;
  };
}

const DISPATCH_BADGES: Record<DomiciliaryAppointment["dispatch_status"], { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  pending: { label: "Pendiente Asignación", variant: "destructive" },
  assigned: { label: "Enfermero Asignado", variant: "warning" },
  en_route: { label: "En Camino a Domicilio", variant: "default" },
  arrived: { label: "En Domicilio de Cliente", variant: "default" },
  completed: { label: "Terapia Completada ✅", variant: "success" },
};

export default function AdminSueroterapiaPage() {
  const [appointments, setAppointments] = React.useState<DomiciliaryAppointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Filters
  const [date, setDate] = React.useState("");
  const [dispatchStatus, setDispatchStatus] = React.useState("");

  // Modal State
  const [selectedAppt, setSelectedAppt] = React.useState<DomiciliaryAppointment | null>(null);
  const [nurseId, setNurseId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const loadAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DomiciliaryAppointment[] }>("/domiciliary-appointments", {
        params: {
          date: date || undefined,
          dispatch_status: dispatchStatus || undefined,
        },
      });
      setAppointments(res.data.data);
    } catch {
      toast.error("Error al cargar citas a domicilio.");
    } finally {
      setLoading(false);
    }
  }, [date, dispatchStatus]);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleDispatchUpdate(apptId: number, nextStatus: DomiciliaryAppointment["dispatch_status"]) {
    setActionLoading(true);
    try {
      await api.post(`/domiciliary-appointments/${apptId}/dispatch`, {
        dispatch_status: nextStatus,
        practitioner_id: nurseId ? Number(nurseId) : undefined,
        notes: notes || undefined,
      });

      toast.success(`Estado actualizado a: ${DISPATCH_BADGES[nextStatus].label}`);
      setSelectedAppt(null);
      setNurseId("");
      setNotes("");
      await loadAppointments();
    } catch {
      toast.error("Error al actualizar despacho.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExecuteTherapy(apptId: number) {
    setActionLoading(true);
    try {
      await api.post(`/domiciliary-appointments/${apptId}/execute`, {
        consumables: [],
      });

      toast.success("Terapia completada. Factura generada e insumos descontados.");
      await loadAppointments();
    } catch {
      toast.error("Error al finalizar sesión de sueroterapia.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Syringe className="h-6 w-6 text-primary" /> Sueroterapia a Domicilio — Gestión de Despacho
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de atención en residencia, asignación de enfermeros y ejecución de terapia intravenosa.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Fecha:</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Estado Despacho:</span>
              <select
                className="h-8 text-xs rounded-md border bg-background px-2"
                value={dispatchStatus}
                onChange={(e) => setDispatchStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente Asignación</option>
                <option value="assigned">Enfermero Asignado</option>
                <option value="en_route">En Camino</option>
                <option value="arrived">En Domicilio</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          </div>
          {(date || dispatchStatus) && (
            <Button variant="ghost" size="sm" onClick={() => { setDate(""); setDispatchStatus(""); }} className="h-8 text-xs">
              Limpiar Filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Domiciliary Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((appt) => {
          const badge = DISPATCH_BADGES[appt.dispatch_status] || { label: appt.dispatch_status, variant: "default" };
          return (
            <Card key={appt.id} className="border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {appt.service?.name ?? "Sueroterapia a Domicilio"}
                  </CardTitle>
                  <p className="text-xs font-medium text-primary mt-1">
                    Cita #{appt.id} • ${Number(appt.price ?? appt.service?.price ?? 0).toLocaleString("es-CO")}
                  </p>
                </div>
                <StatusBadge status={appt.dispatch_status} label={badge.label} />
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 border-y py-2 bg-muted/20 rounded px-2">
                  <div>
                    <span className="text-muted-foreground block font-medium">Cliente / Paciente</span>
                    <span className="font-semibold text-sm">{appt.client?.name ?? "Cliente Domiciliario"}</span>
                    {appt.client?.phone && <span className="block text-muted-foreground">{appt.client.phone}</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Hora Programada</span>
                    <span className="font-semibold text-sm">
                      {new Date(appt.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="block text-muted-foreground">({new Date(appt.starts_at).toLocaleDateString("es-CO")})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{appt.address} ({appt.neighborhood ?? appt.city})</span>
                  </div>
                  {appt.address_reference && (
                    <p className="text-muted-foreground italic pl-5">Ref: {appt.address_reference}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">
                    Profesional Asignado: <strong className="text-foreground">{appt.practitioner?.name ?? "Sin asignar"}</strong>
                  </span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {appt.dispatch_status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1"
                      onClick={() => setSelectedAppt(appt)}
                    >
                      <User className="h-3.5 w-3.5" /> Asignar Enfermero
                    </Button>
                  )}
                  {appt.dispatch_status === "assigned" && (
                    <Button
                      size="sm"
                      className="text-xs h-8 gap-1 bg-amber-600 hover:bg-amber-700"
                      onClick={() => handleDispatchUpdate(appt.id, "en_route")}
                      disabled={actionLoading}
                    >
                      <Truck className="h-3.5 w-3.5" /> Marcar En Camino
                    </Button>
                  )}
                  {appt.dispatch_status === "en_route" && (
                    <Button
                      size="sm"
                      className="text-xs h-8 gap-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleDispatchUpdate(appt.id, "arrived")}
                      disabled={actionLoading}
                    >
                      <MapPin className="h-3.5 w-3.5" /> Marcar Llegada Domicilio
                    </Button>
                  )}
                  {appt.dispatch_status === "arrived" && (
                    <Button
                      size="sm"
                      className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleExecuteTherapy(appt.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completar & Facturar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {appointments.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground border rounded-lg bg-muted/10">
            No hay citas a domicilio registradas para los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Modal Asignación de Enfermero */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">Asignar Profesional a Cita #{selectedAppt.id}</h2>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p><strong>Cliente:</strong> {selectedAppt.client?.name}</p>
              <p><strong>Dirección:</strong> {selectedAppt.address} ({selectedAppt.neighborhood})</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">ID Profesional / Enfermero</label>
                <Input
                  type="number"
                  placeholder="ID del usuario enfermero"
                  value={nurseId}
                  onChange={(e) => setNurseId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Observación de Despacho</label>
                <Input
                  placeholder="Ej: Llevar kit de mariposa 24G"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedAppt(null)}>Cancelar</Button>
              <Button onClick={() => handleDispatchUpdate(selectedAppt.id, "assigned")} disabled={actionLoading}>
                Confirmar Asignación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

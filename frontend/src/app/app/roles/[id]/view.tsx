"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Role } from "@/lib/types";

const PERMISSION_LABEL: Record<string, string> = {
  "dashboard.view": "Ver dashboard",
  "leads.view": "Ver leads",
  "clients.manage": "Gestionar clientes",
  "deals.manage": "Gestionar deals",
  "activities.manage": "Gestionar actividades",
  "orders.manage": "Gestionar pedidos",
  "products.manage": "Gestionar productos",
  "warehouses.manage": "Gestionar bodegas",
  "stock.manage": "Registrar movimientos de inventario",
  "suppliers.manage": "Gestionar proveedores",
  "purchase_orders.manage": "Gestionar ordenes de compra",
  "reports.view": "Ver reportes",
  "users.manage": "Gestionar usuarios",
  "roles.manage": "Gestionar roles",
  "audit.view": "Ver auditoria",
  "settings.manage": "Gestionar configuracion de la empresa",
  "services.manage": "Gestionar catálogo de servicios",
  "patients.manage": "Gestionar propietarios y pacientes",
  "appointments.manage": "Gestionar citas y agenda",
  "medical_records.manage": "Gestionar historia clínica",
  "vaccinations.manage": "Gestionar vacunas y desparasitación",
  "prescriptions.manage": "Gestionar prescripciones",
  "procedures.manage": "Gestionar procedimientos",
  "clinical_reports.view": "Ver reportes clínicos",
};

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRole] = React.useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const [roleRes, permsRes] = await Promise.all([
      api.get<{ data: Role }>(`/roles/${id}`),
      api.get<{ data: string[] }>("/permissions"),
    ]);
    setRole(roleRes.data.data);
    setAllPermissions(permsRes.data.data);
    setSelected(new Set(roleRes.data.data.permissions ?? []));
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get<{ data: Role }>(`/roles/${id}`, { signal: controller.signal }),
      api.get<{ data: string[] }>("/permissions", { signal: controller.signal }),
    ])
      .then(([roleRes, permsRes]) => {
        setRole(roleRes.data.data);
        setAllPermissions(permsRes.data.data);
        setSelected(new Set(roleRes.data.data.permissions ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/roles/${id}`, { permissions: Array.from(selected) });
      toast.success("Permisos actualizados");
      await load();
    } catch {
      toast.error("No se pudieron guardar los permisos.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !role) {
    return <p className="text-sm text-muted-foreground">Cargando rol...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{role.name}</h1>
          <p className="text-sm text-muted-foreground">Elegi que puede hacer este rol en el panel.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={role.status} />
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/roles")}>Volver</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Permisos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {allPermissions.map((name) => (
              <label key={name} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                <input type="checkbox" className="mt-1" checked={selected.has(name)} onChange={() => toggle(name)} />
                <span>
                  <span className="block font-medium">{PERMISSION_LABEL[name] ?? name}</span>
                  <span className="block text-xs text-muted-foreground">{name}</span>
                </span>
              </label>
            ))}
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Guardar permisos"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

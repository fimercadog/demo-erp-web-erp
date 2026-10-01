"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { PurchaseOrder } from "@/lib/types";

const STATUS_LABEL: Record<PurchaseOrder["status"], string> = {
  draft: "Borrador",
  ordered: "Ordenada",
  partial: "Parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({ product_id: "", quantity: "", unit_cost: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data } = await api.get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`);
    setOrder(data.data);
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`, { signal: controller.signal })
      .then((r) => setOrder(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/purchase-orders/${id}/items`, {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost),
      });
      setForm({ product_id: "", quantity: "", unit_cost: "" });
      toast.success("Linea agregada");
      await load();
    } catch {
      toast.error("No se pudo agregar la linea. Revisa el ID de producto.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(itemId: number) {
    try {
      await api.delete(`/purchase-orders/${id}/items/${itemId}`);
      toast.success("Linea eliminada");
      await load();
    } catch {
      toast.error("No se pudo eliminar la linea.");
    }
  }

  async function receiveOrder() {
    setSaving(true);
    try {
      await api.post(`/purchase-orders/${id}/receive`);
      toast.success("Orden recibida. Stock actualizado.");
      await load();
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? "No se pudo recibir la orden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !order) {
    return <p className="text-sm text-muted-foreground">Cargando orden...</p>;
  }

  const canReceive = order.status === "draft" || order.status === "ordered" || order.status === "partial";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orden de compra #{order.id}</h1>
          <p className="text-sm text-muted-foreground">{order.supplier?.name ?? `Proveedor #${order.supplier_id}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/ordenes-compra")}>Volver</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Lineas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="w-10 py-2 pr-3 text-right tabular-nums">#</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cantidad</th>
                  <th className="py-2">Recibido</th>
                  <th className="py-2">Pendiente</th>
                  <th className="py-2">Costo unitario</th>
                  <th className="py-2">Subtotal</th>
                  {order.status === "draft" ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item, i) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{item.product ?? `#${item.product_id}`}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{item.received_quantity ?? 0}</td>
                    <td className="py-2">{item.pending_quantity ?? item.quantity}</td>
                    <td className="py-2">${Number(item.unit_cost).toLocaleString("es-CO")}</td>
                    <td className="py-2">${Number(item.line_total ?? item.quantity * Number(item.unit_cost)).toLocaleString("es-CO")}</td>
                    {order.status === "draft" ? (
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {(order.items ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Sin lineas todavia.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">${Number(order.total).toLocaleString("es-CO")}</span>
          </div>

          {order.status === "draft" ? (
            <form onSubmit={addItem} className="grid gap-3 border-t pt-4 sm:grid-cols-4">
              <Input placeholder="ID producto" type="number" min={1} required value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} />
              <Input placeholder="Cantidad" type="number" min={1} required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <Input placeholder="Costo unitario" type="number" min={0} step={100} required value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))} />
              <Button type="submit" disabled={saving}>Agregar linea</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {canReceive ? (
        <Button onClick={receiveOrder} disabled={saving || (order.items ?? []).length === 0}>
          Recibir pendiente
        </Button>
      ) : null}
    </div>
  );
}

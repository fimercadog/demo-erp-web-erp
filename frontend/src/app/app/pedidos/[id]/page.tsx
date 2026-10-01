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
import { Order } from "@/lib/types";

const STATUS_LABEL: Record<Order["status"], string> = { draft: "Borrador", confirmed: "Confirmado", cancelled: "Cancelado" };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({ product_id: "", quantity: "", unit_price: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data } = await api.get<{ data: Order }>(`/orders/${id}`);
    setOrder(data.data);
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ data: Order }>(`/orders/${id}`, { signal: controller.signal })
      .then((r) => setOrder(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/orders/${id}/items`, {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
      });
      setForm({ product_id: "", quantity: "", unit_price: "" });
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
      await api.delete(`/orders/${id}/items/${itemId}`);
      toast.success("Linea eliminada");
      await load();
    } catch {
      toast.error("No se pudo eliminar la linea.");
    }
  }

  async function confirmOrder() {
    setSaving(true);
    try {
      await api.post(`/orders/${id}/confirm`);
      toast.success("Pedido confirmado. Stock descontado.");
      await load();
    } catch (error) {
      const response = (error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response;
      toast.error(response?.data?.errors?.items?.[0] ?? response?.data?.message ?? "No se pudo confirmar el pedido.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !order) {
    return <p className="text-sm text-muted-foreground">Cargando pedido...</p>;
  }

  const isDraft = order.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pedido #{order.id}</h1>
          <p className="text-sm text-muted-foreground">{order.client?.name ?? `Cliente #${order.client_id}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/pedidos")}>Volver</Button>
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
                  <th className="py-2">Precio unitario</th>
                  <th className="py-2">Subtotal</th>
                  {isDraft ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item, i) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{item.product ?? `#${item.product_id}`}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">${Number(item.unit_price).toLocaleString("es-CO")}</td>
                    <td className="py-2">${(item.quantity * Number(item.unit_price)).toLocaleString("es-CO")}</td>
                    {isDraft ? (
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

          {isDraft ? (
            <form onSubmit={addItem} className="grid gap-3 border-t pt-4 sm:grid-cols-4">
              <Input placeholder="ID producto" type="number" min={1} required value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} />
              <Input placeholder="Cantidad" type="number" min={1} required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <Input placeholder="Precio unitario" type="number" min={0} step={100} required value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} />
              <Button type="submit" disabled={saving}>Agregar linea</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {isDraft ? (
        <Button onClick={confirmOrder} disabled={saving || (order.items ?? []).length === 0}>
          Confirmar pedido
        </Button>
      ) : null}
    </div>
  );
}

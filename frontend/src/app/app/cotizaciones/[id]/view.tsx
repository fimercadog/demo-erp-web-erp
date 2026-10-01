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
import { Quote } from "@/lib/types";

const STATUS_LABEL: Record<Quote["status"], string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({ product_id: "", description: "", quantity: "", unit_price: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data } = await api.get<{ data: Quote }>(`/quotes/${id}`);
    setQuote(data.data);
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ data: Quote }>(`/quotes/${id}`, { signal: controller.signal })
      .then((r) => setQuote(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  function apiError(error: unknown, fallback: string) {
    const res = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
    return res?.data?.errors?.decision?.[0] ?? res?.data?.message ?? fallback;
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/quotes/${id}/items`, {
        product_id: form.product_id ? Number(form.product_id) : null,
        description: form.description || null,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
      });
      setForm({ product_id: "", description: "", quantity: "", unit_price: "" });
      toast.success("Linea agregada");
      await load();
    } catch (e) {
      toast.error(apiError(e, "No se pudo agregar la linea."));
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(itemId: number) {
    try {
      await api.delete(`/quotes/${id}/items/${itemId}`);
      await load();
    } catch (e) {
      toast.error(apiError(e, "No se pudo eliminar la linea."));
    }
  }

  async function act(path: string, body: Record<string, unknown> | undefined, okMsg: string) {
    setSaving(true);
    try {
      const { data } = await api.post<{ order_id?: number }>(`/quotes/${id}/${path}`, body);
      toast.success(okMsg);
      if (data?.order_id) router.push(`/app/pedidos/${data.order_id}`);
      else await load();
    } catch (e) {
      toast.error(apiError(e, "No se pudo completar la accion."));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !quote) return <p className="text-sm text-muted-foreground">Cargando cotizacion...</p>;

  const isDraft = quote.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quote.title}</h1>
          <p className="text-sm text-muted-foreground">
            #{quote.id} · {quote.client ?? `Cliente #${quote.client_id}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={quote.status} label={STATUS_LABEL[quote.status]} />
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/cotizaciones")}>
            Volver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lineas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="w-10 py-2 pr-3 text-right tabular-nums">#</th>
                  <th className="py-2">Concepto</th>
                  <th className="py-2">Cantidad</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Subtotal</th>
                  {isDraft ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {(quote.items ?? []).map((item, i) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{item.product ?? item.description ?? `#${item.product_id}`}</td>
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
                {(quote.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      Sin lineas todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">${Number(quote.total).toLocaleString("es-CO")}</span>
          </div>

          {isDraft ? (
            <form onSubmit={addItem} className="grid gap-3 border-t pt-4 sm:grid-cols-5">
              <Input placeholder="ID producto (opcional)" type="number" min={1} value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} />
              <Input placeholder="o Descripcion libre" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Input placeholder="Cantidad" type="number" min={1} required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <Input placeholder="Precio" type="number" min={0} step={100} required value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} />
              <Button type="submit" disabled={saving}>Agregar</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {isDraft ? (
          <Button onClick={() => act("send", undefined, "Cotizacion enviada")} disabled={saving || (quote.items ?? []).length === 0}>
            Enviar
          </Button>
        ) : null}
        {quote.status === "sent" ? (
          <>
            <Button onClick={() => act("respond", { decision: "accepted" }, "Cotizacion aceptada")} disabled={saving}>
              Marcar aceptada
            </Button>
            <Button variant="outline" onClick={() => act("respond", { decision: "rejected" }, "Cotizacion rechazada")} disabled={saving}>
              Marcar rechazada
            </Button>
          </>
        ) : null}
        {quote.status === "accepted" && !quote.converted_order_id ? (
          <Button onClick={() => act("convert", undefined, "Pedido creado desde la cotizacion")} disabled={saving}>
            Convertir en pedido
          </Button>
        ) : null}
        {quote.converted_order_id ? (
          <Button variant="ghost" onClick={() => router.push(`/app/pedidos/${quote.converted_order_id}`)}>
            Ver pedido #{quote.converted_order_id}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

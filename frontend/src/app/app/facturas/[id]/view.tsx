"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, FileText, Printer, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/types";

const STATUS_LABEL: Record<Invoice["status"], string> = {
  draft: "Borrador",
  issued: "Emitida",
  partially_paid: "Parcialmente pagada",
  paid: "Pagada",
  void: "Anulada",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Invoice }>(`/invoices/${id}`);
      setInvoice(data.data);
    } catch {
      toast.error("No se pudo cargar la factura.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function issueInvoice() {
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/issue`);
      toast.success("Factura emitida correctamente. Stock descontado y cuenta por cobrar creada.");
      await load();
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? "No se pudo emitir la factura.");
    } finally {
      setActionLoading(false);
    }
  }

  async function voidInvoice() {
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/void`);
      toast.success("Factura anulada.");
      await load();
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? "No se pudo anular la factura.");
    } finally {
      setActionLoading(false);
    }
  }

  async function printInvoice() {
    try {
      const res = await api.get(`/invoices/${id}/print`, { responseType: "text" });
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<pre style="font-family: monospace; padding: 20px; white-space: pre-wrap;">${res.data}</pre>`);
        win.document.close();
        win.print();
      }
    } catch {
      toast.error("No se pudo generar la vista de impresión.");
    }
  }

  if (loading || !invoice) {
    return <p className="text-sm text-muted-foreground">Cargando factura...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factura interna {invoice.number}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente: {invoice.client?.name ?? `#${invoice.client_id}`} · Documento administrativo (No DIAN)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} label={STATUS_LABEL[invoice.status]} />
          <Button variant="outline" size="sm" onClick={printInvoice}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimir
          </Button>
          {invoice.status === "draft" ? (
            <>
              <Button size="sm" onClick={issueInvoice} disabled={actionLoading}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Emitir factura
              </Button>
              <Button variant="destructive" size="sm" onClick={voidInvoice} disabled={actionLoading}>
                <XCircle className="mr-1.5 h-4 w-4" /> Anular
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/facturas")}>
            Volver
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle de productos / servicios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Cant.</th>
                    <th className="py-2 text-right">Precio unitario</th>
                    <th className="py-2 text-right">Descuento</th>
                    <th className="py-2 text-right">Impuesto</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(invoice as any).items?.map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="border-t">
                      <td className="py-2.5">
                        <p className="font-medium">{item.product_name}</p>
                        {item.sku ? <p className="text-xs text-muted-foreground">SKU: {item.sku}</p> : null}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 text-right tabular-nums">${Number(item.unit_price).toLocaleString("es-CO")}</td>
                      <td className="py-2.5 text-right tabular-nums">${Number(item.discount ?? 0).toLocaleString("es-CO")}</td>
                      <td className="py-2.5 text-right tabular-nums">${Number(item.tax ?? 0).toLocaleString("es-CO")}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums">${Number(item.line_total).toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {!(invoice as any).items?.length ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">
                        Sin ítems registrados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 border-t pt-4 text-right">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>${Number(invoice.subtotal).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descuentos</span>
                <span>-${Number(invoice.discount).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Impuestos</span>
                <span>+${Number(invoice.tax).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t pt-2">
                <span>Total Factura</span>
                <span>${Number(invoice.total).toLocaleString("es-CO")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información administrativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fecha emisión</p>
                <p className="font-medium">{invoice.issue_date ?? "Sin emitir"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha vencimiento</p>
                <p className="font-medium">{invoice.due_date ?? "No especificada"}</p>
              </div>
              {invoice.warehouse ? (
                <div>
                  <p className="text-xs text-muted-foreground">Bodega de despacho</p>
                  <p className="font-medium">{invoice.warehouse.name}</p>
                </div>
              ) : null}
              {invoice.notes ? (
                <div>
                  <p className="text-xs text-muted-foreground">Observaciones</p>
                  <p className="text-xs">{invoice.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {invoice.receivable ? (
            <Card>
              <CardHeader>
                <CardTitle>Cuenta por cobrar (Cartera)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor original:</span>
                  <span className="font-medium">${Number(invoice.receivable.original_amount).toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium text-success">${Number(invoice.receivable.paid_amount).toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Saldo pendiente:</span>
                  <span>${Number(invoice.receivable.balance).toLocaleString("es-CO")}</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

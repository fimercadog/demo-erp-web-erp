"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { Consultation, Product, Warehouse, CashSession } from "@/lib/types";
import { getStoredUser, hasAnyPermission } from "@/lib/auth";
import {
  isConsultationEditable,
  validateClinicalQuantity,
  validateClinicalUnitPrice,
  validatePaymentPayload,
} from "@/lib/consultation-helpers";

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-semibold text-muted-foreground block mb-1", className)} {...props} />;
}

function Soap({ letter, title, text }: { letter: string; title: string; text?: string | null }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {letter} — {title}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{text?.trim() || <span className="text-muted-foreground">Sin registro.</span>}</p>
      </CardContent>
    </Card>
  );
}

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = React.useState<Consultation | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal para agregar ítem
  const [openItemModal, setOpenItemModal] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [itemType, setItemType] = React.useState<"medication" | "supply" | "service" | "product">("medication");
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [itemName, setItemName] = React.useState("");
  const [itemQuantity, setItemQuantity] = React.useState("1");
  const [itemUnitPrice, setItemUnitPrice] = React.useState("0");
  const [isBillable, setIsBillable] = React.useState(true);
  const [isInventoriable, setIsInventoriable] = React.useState(true);
  const [itemNotes, setItemNotes] = React.useState("");
  const [isSubmittingItem, setIsSubmittingItem] = React.useState(false);

  // Modal para finalizar consulta y facturar
  const [openFinalizeModal, setOpenFinalizeModal] = React.useState(false);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>("");
  const [cashSessions, setCashSessions] = React.useState<CashSession[]>([]);
  const [withPayment, setWithPayment] = React.useState(false);
  const [paymentSessionId, setPaymentSessionId] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [paymentReference, setPaymentReference] = React.useState("");
  const [finalizing, setFinalizing] = React.useState(false);

  const currentUser = getStoredUser();
  const canManagePayments = hasAnyPermission(currentUser, ["payments.manage", "cash.manage"]);

  const fetchConsultation = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Consultation }>(`/consultations/${id}`);
      setC(res.data.data);
    } catch {
      toast.error("No se pudo cargar la consulta.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  // Cargar catálogos cuando se abren los modales
  const handleOpenItemModal = async () => {
    setOpenItemModal(true);
    if (products.length === 0) {
      try {
        const res = await api.get<{ data: Product[] }>("/products?per_page=100");
        setProducts(res.data.data);
      } catch {
        // ignorar
      }
    }
  };

  const handleOpenFinalizeModal = async () => {
    setOpenFinalizeModal(true);
    setWithPayment(false);
    try {
      const [wRes, sRes] = await Promise.all([
        api.get<{ data: Warehouse[] }>("/warehouses"),
        api.get<{ data: CashSession[] }>("/cash-sessions?status=open"),
      ]);
      setWarehouses(wRes.data.data);
      if (wRes.data.data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(String(wRes.data.data[0].id));
      }
      setCashSessions(sRes.data.data);
      if (sRes.data.data.length > 0 && !paymentSessionId) {
        setPaymentSessionId(String(sRes.data.data[0].id));
      }
    } catch {
      // ignorar
    }
  };

  // Autocompletar datos del producto
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => String(p.id) === prodId);
    if (prod) {
      setItemName(prod.name);
      setItemUnitPrice(String(prod.unit_price || 0));
      setIsInventoriable(true);
      setIsBillable(itemType !== "supply");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingItem) return;

    const qtyValidation = validateClinicalQuantity(itemQuantity);
    if (!qtyValidation.valid) {
      toast.error(qtyValidation.error || "Cantidad inválida.");
      return;
    }

    const priceValidation = validateClinicalUnitPrice(itemUnitPrice);
    if (!priceValidation.valid) {
      toast.error(priceValidation.error || "Precio inválido.");
      return;
    }

    try {
      setIsSubmittingItem(true);
      await api.post(`/consultations/${id}/items`, {
        item_type: itemType,
        product_id: selectedProductId ? Number(selectedProductId) : null,
        name: itemName.trim(),
        quantity: qtyValidation.quantity,
        unit_price: priceValidation.price,
        is_billable: isBillable,
        is_inventoriable: isInventoriable,
        notes: itemNotes.trim() || null,
      });
      toast.success("Ítem clínico agregado con éxito.");
      setOpenItemModal(false);
      // Reset form
      setSelectedProductId("");
      setItemName("");
      setItemQuantity("1");
      setItemUnitPrice("0");
      setItemNotes("");
      fetchConsultation();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al agregar el ítem a la consulta.");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm("¿Deseas quitar este ítem de la consulta?")) return;
    try {
      await api.delete(`/consultations/${id}/items/${itemId}`);
      toast.success("Ítem eliminado.");
      fetchConsultation();
    } catch {
      toast.error("No se pudo eliminar el ítem.");
    }
  };

  const handleFinalize = async () => {
    if (finalizing) return;

    const paymentVal = validatePaymentPayload({
      withPayment,
      canManagePayments,
      paymentMethod,
      paymentSessionId,
      hasOpenSessions: cashSessions.length > 0,
    });

    if (!paymentVal.valid) {
      toast.error(paymentVal.error);
      return;
    }

    try {
      setFinalizing(true);
      const payload: any = {
        warehouse_id: selectedWarehouseId ? Number(selectedWarehouseId) : null,
      };
      if (withPayment) {
        payload.payment = {
          method: paymentMethod,
          cash_session_id: paymentSessionId ? Number(paymentSessionId) : null,
          reference: paymentReference || `Pago consulta #${id}`,
        };
      }
      await api.post(`/consultations/${id}/finalize`, payload);
      toast.success("¡Consulta finalizada y facturada en el ERP con éxito!");
      setOpenFinalizeModal(false);
      fetchConsultation();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al finalizar la consulta.");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !c) return <p className="p-6 text-sm text-muted-foreground">Cargando consulta clínica...</p>;

  const patientName = typeof c.patient === "object" ? c.patient?.name : c.patient;
  const clientName = typeof c.patient === "object" ? c.patient?.client : null;
  const isCompleted = c.status === "completed";
  const isOpen = c.status === "open";

  // Calcular total de cargos a facturar
  const itemsTotal = (c.items || []).reduce((acc, it) => acc + (it.is_billable ? (it.unit_price || 0) * (it.quantity || 1) : 0), 0);
  const totalBillable = (Number(c.price) || 0) + itemsTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Consulta Clínica #{c.id}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800"
                  : c.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isCompleted ? "Finalizada y Facturada" : c.status === "cancelled" ? "Cancelada" : "En Atención (Abierta)"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Fecha: {formatDate(c.date)} · Motivo: <strong className="text-foreground">{c.reason}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Paciente:{" "}
            <Link href={`/app/pacientes/${c.patient_id}`} className="font-medium text-primary hover:underline">
              {patientName || `Paciente #${c.patient_id}`}
            </Link>
            {clientName && ` (Propietario: ${clientName})`}
            {c.vet && ` · Veterinario: ${c.vet}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Volver
          </Button>
          {isOpen && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleOpenFinalizeModal}>
              Finalizar y Facturar en ERP
            </Button>
          )}
        </div>
      </div>

      {/* Info ERP si ya fue finalizada */}
      {isCompleted && c.invoice && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-800">Factura Interna Generada en ERP</p>
              <p className="text-lg font-bold text-emerald-950">{c.invoice.number}</p>
              <p className="text-xs text-emerald-700">
                Total Facturado: {formatCurrency(c.invoice.total)} · Estado: <span className="font-semibold uppercase">{c.invoice.status}</span>
                {c.invoice.account_receivable && ` · Saldo CxC: ${formatCurrency(c.invoice.account_receivable.balance)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/app/facturas/${c.invoice.id}`}>
                <Button size="sm" variant="outline" className="bg-white">
                  Ver Factura
                </Button>
              </Link>
              {c.invoice.account_receivable && c.invoice.account_receivable.balance > 0 && (
                <Link href="/app/pagos">
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                    Registrar Cobro
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constantes vitales y honorarios */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Peso</p>
            <p className="text-xl font-bold">{c.weight ? `${c.weight} kg` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Temperatura</p>
            <p className="text-xl font-bold">{c.temperature ? `${c.temperature} °C` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Tarifa Consulta</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(Number(c.price) || 0)}</p>
            {c.service && <p className="text-xs text-muted-foreground">{c.service}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Registro Clínico SOAP */}
      <div>
        <h2 className="text-base font-semibold mb-3">Historia Clínica (SOAP)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Soap letter="S" title="Subjetivo (Anamnesis)" text={c.subjective} />
          <Soap letter="O" title="Objetivo (Examen Físico)" text={c.objective} />
          <Soap letter="A" title="Análisis (Diagnóstico / Evolución)" text={c.assessment} />
          <Soap letter="P" title="Plan Terapéutico" text={c.plan} />
        </div>
      </div>

      {/* Panel de Consumos e Ítems de la Consulta (ERP Integration) */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-base font-bold">Medicamentos, Insumos y Cargos Clínicos</h2>
              <p className="text-xs text-muted-foreground">
                Los ítems cobrables se integran a la Factura Interna y los inventariables descuentan existencias automáticamente.
              </p>
            </div>
            {isOpen && (
              <Button size="sm" onClick={handleOpenItemModal}>
                + Agregar Concepto Clínico
              </Button>
            )}
          </div>

          {(!c.items || c.items.length === 0) ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No se han registrado medicamentos ni insumos en esta consulta.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2">Concepto</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2 text-center">Cant.</th>
                    <th className="py-2 text-right">Precio Unit.</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-center">Trazabilidad ERP</th>
                    {isOpen && <th className="py-2 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {c.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 font-medium">
                        {it.name}
                        {it.notes && <span className="block text-[11px] text-muted-foreground">{it.notes}</span>}
                      </td>
                      <td className="py-2 uppercase text-[10px]">
                        <span className="rounded bg-muted px-1.5 py-0.5">{it.item_type}</span>
                      </td>
                      <td className="py-2 text-center font-medium">{it.quantity}</td>
                      <td className="py-2 text-right">{it.is_billable ? formatCurrency(it.unit_price) : <span className="text-muted-foreground">Incluido ($0)</span>}</td>
                      <td className="py-2 text-right font-semibold">{it.is_billable ? formatCurrency((it.unit_price || 0) * it.quantity) : "$0"}</td>
                      <td className="py-2 text-center space-x-1">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${it.is_billable ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                          {it.is_billable ? "Cobrable" : "Incluido"}
                        </span>
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${it.is_inventoriable ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}`}>
                          {it.is_inventoriable ? "Descuenta Stock" : "No Inventariable"}
                        </span>
                      </td>
                      {isOpen && (
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" className="h-6 text-red-600 hover:text-red-700" onClick={() => handleRemoveItem(it.id)}>
                            Quitar
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={4} className="py-3 text-right">Total a Facturar (Consulta + Medicamentos Cobrables):</td>
                    <td className="py-3 text-right text-base text-primary">{formatCurrency(totalBillable)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Agregar Ítem */}
      <Dialog open={openItemModal} onOpenChange={setOpenItemModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Concepto a la Consulta</DialogTitle>
            <DialogDescription>Medicamentos, insumos médicos, procedimientos o productos de farmacia.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <Label>Tipo de Concepto</Label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as any)}
                className="mt-1 w-full rounded-md border p-2 text-sm"
              >
                <option value="medication">Medicamento (Farmacia)</option>
                <option value="supply">Insumo Médico (Uso en consulta)</option>
                <option value="procedure">Procedimiento Clínico</option>
                <option value="product">Producto / Alimento</option>
              </select>
            </div>

            {products.length > 0 && (
              <div>
                <Label>Seleccionar del Catálogo de Inventario (Opcional)</Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="mt-1 w-full rounded-md border p-2 text-sm"
                >
                  <option value="">-- Ingresar manual o seleccionar producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {formatCurrency(p.unit_price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Nombre del Concepto *</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="Ej. Meloxicam suspensión, Jeringa 3ml" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad *</Label>
                <Input type="number" min="0.0001" step="any" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} required />
              </div>
              <div>
                <Label>Precio Cobrado ($) *</Label>
                <Input type="number" min="0" step="any" value={itemUnitPrice} onChange={(e) => setItemUnitPrice(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={isBillable} onChange={(e) => setIsBillable(e.target.checked)} className="rounded" />
                <span>¿Es cobrable al propietario? (Genera cargo en Factura)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={isInventoriable} onChange={(e) => setIsInventoriable(e.target.checked)} className="rounded" />
                <span>¿Es inventariable? (Descuenta existencias en Bodega)</span>
              </label>
            </div>

            <div>
              <Label>Indicaciones / Notas</Label>
              <Input value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} placeholder="Ej. Dosis, posología o motivo de uso" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenItemModal(false)} disabled={isSubmittingItem}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingItem}>
                {isSubmittingItem ? "Guardando..." : "Agregar Ítem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Finalizar Consulta y Facturar en ERP */}
      <Dialog open={openFinalizeModal} onOpenChange={setOpenFinalizeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Consulta y Emitir Factura</DialogTitle>
            <DialogDescription>
              Se descontará el stock de medicamentos e insumos y se creará la Factura Interna y Cuenta por Cobrar (CxC).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bodega para descuento de stock *</Label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="mt-1 w-full rounded-md border p-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Resumen de Facturación:</p>
              <div className="flex justify-between">
                <span>Honorarios de Consulta:</span>
                <span>{formatCurrency(Number(c.price) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Medicamentos / Cargos Cobrables:</span>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-primary pt-1 border-t">
                <span>Total a Cobrar:</span>
                <span>{formatCurrency(totalBillable)}</span>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              {canManagePayments ? (
                <>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input type="checkbox" checked={withPayment} onChange={(e) => setWithPayment(e.target.checked)} className="rounded" />
                    <span>Registrar cobro inmediato en Caja (Abono / Pago total)</span>
                  </label>

                  {withPayment && (
                    <div className="mt-3 space-y-2 pt-2 border-t">
                      {cashSessions.length === 0 ? (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                          ⚠️ No hay sesiones de caja abiertas actualmente.
                        </p>
                      ) : (
                        <div>
                          <Label className="text-[11px]">Sesión de Caja Abierta *</Label>
                          <select
                            value={paymentSessionId}
                            onChange={(e) => setPaymentSessionId(e.target.value)}
                            className="mt-1 w-full rounded-md border p-1.5 text-xs"
                          >
                            {cashSessions.map((s) => (
                              <option key={s.id} value={s.id}>
                                Sesión #{s.id} · Caja {s.cash_register_id} (Apertura: {formatCurrency(s.opening_amount)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px]">Método</Label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-1 w-full rounded-md border p-1.5 text-xs"
                          >
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta Débito/Crédito</option>
                            <option value="transfer">Transferencia</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px]">Referencia</Label>
                          <Input
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            className="h-8 text-xs"
                            placeholder="Ej. POS-001"
                          />
                        </div>
                      </div>

                      {paymentMethod === "cash" && (!paymentSessionId || cashSessions.length === 0) && (
                        <p className="text-[11px] text-red-600 font-semibold pt-1">
                          ⚠️ Para cobro en efectivo es obligatorio seleccionar una sesión de caja abierta.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded italic">
                  Cobro directo deshabilitado (se requiere permiso de gestión de pagos o caja).
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFinalizeModal(false)} disabled={finalizing}>
              Cancelar
            </Button>
            <Button onClick={handleFinalize} disabled={finalizing} className="bg-emerald-600 hover:bg-emerald-700">
              {finalizing ? "Finalizando..." : "Confirmar y Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

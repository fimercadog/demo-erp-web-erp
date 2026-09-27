"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface ThreeWayMatchData {
  purchase_order_id: number;
  status: "matched" | "pending" | "discrepancy";
  notes: string;
  summary: {
    has_receipts: boolean;
    receipts_count: number;
    has_invoices: boolean;
    invoices_count: number;
    total_ordered: number;
    total_invoiced: number;
    amount_difference: number;
  };
  items_breakdown: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    ordered_quantity: number;
    received_quantity: number;
    unit_cost: number;
    total_ordered: number;
    quantity_matched: boolean;
  }>;
}

export function ThreeWayMatchWidget({ purchaseOrderId }: { purchaseOrderId: number }) {
  const [data, setData] = React.useState<ThreeWayMatchData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchMatch = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ThreeWayMatchData }>(`/purchases/${purchaseOrderId}/three-way-match`);
      setData(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [purchaseOrderId]);

  React.useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Evaluando Matching de 3 Vías...
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const statusConfig = {
    matched: {
      label: "3 Vías Coinciden",
      variant: "success" as const,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",
    },
    pending: {
      label: "Pendiente 3 Vías",
      variant: "warning" as const,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
    },
    discrepancy: {
      label: "Discrepancia Detectada",
      variant: "destructive" as const,
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400",
    },
  };

  const current = statusConfig[data.status];
  const Icon = current.icon;

  return (
    <Card className={`border ${current.color}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className="h-5 w-5" />
          Matching de 3 Vías (Orden - Recepción - Factura)
        </CardTitle>
        <div className="flex items-center gap-2">
          <StatusBadge status={data.status} label={current.label} />
          <Button variant="ghost" size="sm" onClick={fetchMatch} className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{data.notes}</p>
        <div className="grid grid-cols-2 gap-4 rounded-md border p-3 text-xs sm:grid-cols-4 bg-background">
          <div>
            <span className="text-muted-foreground block">Recepciones en almacén</span>
            <span className="font-semibold text-sm">
              {data.summary.has_receipts ? `✅ ${data.summary.receipts_count} recepciones` : "❌ Sin recepciones"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Facturas / CxP</span>
            <span className="font-semibold text-sm">
              {data.summary.has_invoices ? `✅ ${data.summary.invoices_count} facturas` : "❌ Sin factura asociada"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Monto ordenado</span>
            <span className="font-semibold text-sm">{formatCurrency(data.summary.total_ordered)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Diferencia de monto</span>
            <span className={`font-semibold text-sm ${data.summary.amount_difference > 0 ? "text-rose-600 font-bold" : "text-green-600"}`}>
              {formatCurrency(data.summary.amount_difference)}
            </span>
          </div>
        </div>

        {data.items_breakdown.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Verificación por ítem</span>
            <div className="divide-y rounded-md border text-xs bg-background">
              {data.items_breakdown.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-2">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground ml-2">SKU: {item.sku}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Ordenado: {item.ordered_quantity}</span>
                    <span>Recibido: {item.received_quantity}</span>
                    <span className={item.quantity_matched ? "text-green-600 font-semibold" : "text-rose-600 font-semibold"}>
                      {item.quantity_matched ? "✅ Cuadra" : "❌ Discrepancia"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

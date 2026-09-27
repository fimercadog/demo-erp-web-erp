"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, CheckCircle2, FileUp, RefreshCw, Zap } from "lucide-react";

interface BankStatement {
  id: number;
  bank_name: string;
  account_number?: string;
  file_name: string;
  start_date?: string;
  end_date?: string;
  total_items: number;
  total_debits: number;
  total_credits: number;
  status: string;
  created_at: string;
}

interface StatementItem {
  id: number;
  date: string;
  concept: string;
  reference?: string;
  amount: string;
  type: "credit" | "debit";
  status: "unreconciled" | "reconciled" | "discrepancy";
  reconciliation?: {
    id: number;
    match_type: string;
    amount_difference: number;
    reconcilable?: {
      concept?: string;
      amount?: string;
    };
  };
}

export default function BankReconciliationPage() {
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [bankName, setBankName] = useState("Bancolombia");
  const [accountNumber, setAccountNumber] = useState("");
  const [rawCsvText, setRawCsvText] = useState("");

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: BankStatement[] }>("/finance/bank-statements");
      const list = res.data.data || [];
      setStatements(list);
      if (list.length > 0 && !selectedStatementId) {
        setSelectedStatementId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (statementId: number) => {
    try {
      setLoading(true);
      const res = await api.get<{ data: any }>(`/finance/bank-statements/${statementId}/report`);
      setReportData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  useEffect(() => {
    if (selectedStatementId) {
      fetchReport(selectedStatementId);
    }
  }, [selectedStatementId]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsvText.trim()) {
      alert("Por favor ingrese las líneas del extracto.");
      return;
    }

    // Simple line parser: Fecha, Concepto, Monto
    const lines = rawCsvText.trim().split("\n");
    const parsedItems: any[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 3) {
        const date = parts[0] || new Date().toISOString().split("T")[0];
        const concept = parts[1] || "Movimiento bancario";
        const refOrAmount = parts[2];
        const amountStr = parts[3] || parts[2];
        const reference = parts.length >= 4 ? parts[2] : "";

        const parsedAmount = parseFloat(amountStr.replace(/[^0-9.-]/g, ""));
        if (!isNaN(parsedAmount)) {
          parsedItems.push({
            date,
            concept,
            reference,
            amount: parsedAmount,
          });
        }
      }
    }

    if (parsedItems.length === 0) {
      alert("No se pudieron parsear líneas válidas. Formato esperado: Fecha, Concepto, Monto (o Fecha, Concepto, Referencia, Monto)");
      return;
    }

    try {
      const res = await api.post("/finance/bank-statements/import", {
        bank_name: bankName,
        account_number: accountNumber,
        file_name: `extracto_${new Date().toISOString().split("T")[0]}.csv`,
        items: parsedItems,
      });

      setShowImportModal(false);
      setRawCsvText("");
      const newStatement = res.data.data;
      fetchStatements();
      setSelectedStatementId(newStatement.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al importar el extracto bancario.");
    }
  };

  const handleAutoMatch = async () => {
    if (!selectedStatementId) return;
    try {
      setLoading(true);
      const res = await api.post(`/finance/bank-statements/${selectedStatementId}/auto-match`);
      alert(res.data.message || "Comparación automática ejecutada.");
      fetchReport(selectedStatementId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al ejecutar la comparación automática.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async (itemId: number, erpMovementId: number) => {
    try {
      await api.post("/finance/bank-reconciliations/manual", {
        bank_statement_item_id: itemId,
        reconcilable_type: "App\\Models\\CashMovement",
        reconcilable_id: erpMovementId,
      });
      if (selectedStatementId) fetchReport(selectedStatementId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al vincular el movimiento.");
    }
  };

  const metrics = reportData?.metrics;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conciliación Bancaria (Nivel 1)</h1>
          <p className="text-sm text-muted-foreground">
            Comparación directa de extractos bancarios cargados por el usuario contra los movimientos registrados en el ERP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchStatements()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Recargar
          </Button>
          <Button size="sm" onClick={() => setShowImportModal(true)}>
            <FileUp className="mr-2 h-4 w-4" /> Cargar Extracto Bancario
          </Button>
        </div>
      </div>

      {/* Select Statement Header */}
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
        <label className="text-xs font-semibold shrink-0">Seleccionar Extracto Cargado:</label>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm max-w-md"
          value={selectedStatementId || ""}
          onChange={(e) => setSelectedStatementId(Number(e.target.value))}
        >
          {statements.map((s) => (
            <option key={s.id} value={s.id}>
              {s.bank_name} {s.account_number ? `(${s.account_number})` : ""} - {s.file_name} [{s.total_items} movs] - {s.status}
            </option>
          ))}
        </select>

        {selectedStatementId && (
          <Button size="sm" variant="outline" onClick={handleAutoMatch} className="ml-auto">
            <Zap className="mr-2 h-4 w-4 text-amber-500" /> Comparar Coincidencias Automáticas
          </Button>
        )}
      </div>

      {/* Modal: Import Extract */}
      {showImportModal && (
        <Card className="border-primary/50 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Cargar / Importar Extracto Bancario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nombre del Banco</label>
                  <Input
                    placeholder="Ej. Bancolombia, BBVA, Banco de Bogotá"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Número de Cuenta (Opcional)</label>
                  <Input
                    placeholder="Ej. 982-123456-00"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Líneas del Extracto (Formato CSV o pegado: Fecha, Concepto, Monto)
                </label>
                <textarea
                  className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                  placeholder={`2026-09-26, Deposito Venta #101, 300000\n2026-09-26, Pago Serv. Publicos, -85000\n2026-09-25, Transferencia Cliente, REF-99, 150000`}
                  value={rawCsvText}
                  onChange={(e) => setRawCsvText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowImportModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Procesar Extracto</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs text-muted-foreground font-normal">Movimientos del Extracto</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{metrics.total_extract_items}</div>
              <p className="text-xs text-muted-foreground">Total en archivo cargado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs text-muted-foreground font-normal">Coincidentes Conciliados</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold text-emerald-600">{metrics.reconciled_items_count}</div>
              <p className="text-xs text-muted-foreground">Con cruce exacto/confirmado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs text-muted-foreground font-normal">Extracto Pendientes</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold text-amber-600">{metrics.unreconciled_items_count}</div>
              <p className="text-xs text-muted-foreground">Sin coincidencia en ERP</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs text-muted-foreground font-normal">Pendientes ERP</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold text-blue-600">{metrics.pending_erp_movements_count}</div>
              <p className="text-xs text-muted-foreground">Movimientos ERP sin banco</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Side-by-side comparison tables */}
      {reportData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Extract Items Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Extracto Bancario Cargado</span>
                <span className="text-xs text-muted-foreground">Total: ${metrics?.total_extract_amount?.toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Concepto</th>
                      <th className="py-2 px-2 text-right">Monto</th>
                      <th className="py-2 px-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items?.map((item: StatementItem) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono whitespace-nowrap">{item.date}</td>
                        <td className="py-2 px-2">
                          <div>{item.concept}</div>
                          {item.reference && <div className="text-[10px] text-muted-foreground">Ref: {item.reference}</div>}
                        </td>
                        <td className={`py-2 px-2 text-right font-mono font-bold ${item.type === "credit" ? "text-emerald-600" : "text-amber-600"}`}>
                          {item.type === "credit" ? "+" : "-"}${Number(item.amount).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.status === "reconciled"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : item.status === "discrepancy"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {item.status === "reconciled" ? "Conciliado" : item.status === "discrepancy" ? "Diferencia" : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ERP Movements Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Movimientos ERP Pendientes de Cruce</span>
                <span className="text-xs text-muted-foreground">
                  Total: ${metrics?.pending_erp_movements_total?.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Concepto</th>
                      <th className="py-2 px-2 text-right">Monto</th>
                      <th className="py-2 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.pending_erp_movements?.map((m: any) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono whitespace-nowrap">{m.created_at?.split("T")[0]}</td>
                        <td className="py-2 px-2">{m.concept || "Movimiento de Caja"}</td>
                        <td className={`py-2 px-2 text-right font-mono font-bold ${m.type === "in" ? "text-emerald-600" : "text-amber-600"}`}>
                          ${Number(m.amount).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {reportData.items?.find((i: any) => i.status === "unreconciled") ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => {
                                const targetItem = reportData.items.find((i: any) => i.status === "unreconciled");
                                if (targetItem) handleManualMatch(targetItem.id, m.id);
                              }}
                            >
                              <ArrowLeftRight className="h-3 w-3 mr-1" /> Vincular
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Ok</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Calculator, FileText, Plus, RefreshCw } from "lucide-react";

interface AccountChart {
  id: number;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  is_active: boolean;
}

interface JournalItem {
  account_chart_id: number;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  concept: string;
  reference?: string;
  status: string;
  items: Array<{
    id: number;
    account: { code: string; name: string };
    debit: string;
    credit: string;
    description?: string;
  }>;
}

interface TrialBalanceRow {
  account_id: number;
  code: string;
  name: string;
  type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"puc" | "asientos" | "mayor" | "balance">("puc");
  const [loading, setLoading] = useState(false);

  // PUC state
  const [accounts, setAccounts] = useState<AccountChart[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountChart["type"]>("asset");

  // Entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryConcept, setEntryConcept] = useState("");
  const [entryRef, setEntryRef] = useState("");
  const [entryItems, setEntryItems] = useState<JournalItem[]>([
    { account_chart_id: 0, debit: 0, credit: 0, description: "" },
    { account_chart_id: 0, debit: 0, credit: 0, description: "" },
  ]);

  // Balance state
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [balanceSummary, setBalanceSummary] = useState({ total_debit: 0, total_credit: 0, is_balanced: true });

  // General ledger state
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [ledgerData, setLedgerData] = useState<any>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: AccountChart[] }>("/accounting/chart");
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: JournalEntry[] }>("/accounting/entries");
      setEntries(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: TrialBalanceRow[]; summary: any }>("/accounting/trial-balance");
      setTrialBalance(res.data.data || []);
      setBalanceSummary(res.data.summary || { total_debit: 0, total_credit: 0, is_balanced: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralLedger = async (accId: number) => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/accounting/general-ledger?account_id=${accId}`);
      setLedgerData(res.data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === "asientos") fetchEntries();
    if (activeTab === "balance") fetchTrialBalance();
    if (activeTab === "puc") fetchAccounts();
  }, [activeTab]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    try {
      await api.post("/accounting/chart", {
        code: newCode,
        name: newName,
        type: newType,
      });
      setNewCode("");
      setNewName("");
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al crear la cuenta");
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = entryItems.filter((i) => i.account_chart_id > 0);
    if (validItems.length < 2) {
      alert("Debe agregar al menos 2 líneas de detalle válidas.");
      return;
    }

    const totalDebit = validItems.reduce((acc, curr) => acc + Number(curr.debit), 0);
    const totalCredit = validItems.reduce((acc, curr) => acc + Number(curr.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`El asiento está desbalanceado. Débito: $${totalDebit}, Crédito: $${totalCredit}`);
      return;
    }

    try {
      await api.post("/accounting/entries", {
        date: entryDate,
        concept: entryConcept,
        reference: entryRef,
        items: validItems,
      });
      setShowNewEntryModal(false);
      setEntryConcept("");
      setEntryRef("");
      setEntryItems([
        { account_chart_id: 0, debit: 0, credit: 0, description: "" },
        { account_chart_id: 0, debit: 0, credit: 0, description: "" },
      ]);
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al registrar el asiento contable.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contabilidad Básica</h1>
          <p className="text-sm text-muted-foreground">
            Plan Único de Cuentas (PUC), registro de Asientos Contables, Libro Mayor y Balance de Comprobación.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAccounts()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Recargar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "puc"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("puc")}
        >
          <BookOpen className="inline h-4 w-4 mr-1.5" /> Plan de Cuentas (PUC)
        </button>
        <button
          className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "asientos"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("asientos")}
        >
          <FileText className="inline h-4 w-4 mr-1.5" /> Asientos Contables
        </button>
        <button
          className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "mayor"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("mayor")}
        >
          <Calculator className="inline h-4 w-4 mr-1.5" /> Libro Mayor
        </button>
        <button
          className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "balance"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("balance")}
        >
          <Calculator className="inline h-4 w-4 mr-1.5" /> Balance de Comprobación
        </button>
      </div>

      {/* Tab 1: PUC */}
      {activeTab === "puc" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Crear Cuenta Contable</CardTitle>
              <p className="text-xs text-muted-foreground">Agregar nueva cuenta al plan general.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Código PUC</label>
                  <Input
                    placeholder="Ej. 1115"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nombre de la Cuenta</label>
                  <Input
                    placeholder="Ej. Cajas Menores"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipo de Cuenta</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                  >
                    <option value="asset">Activo (1)</option>
                    <option value="liability">Pasivo (2)</option>
                    <option value="equity">Patrimonio (3)</option>
                    <option value="revenue">Ingreso (4)</option>
                    <option value="expense">Gasto (5)</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Guardar Cuenta
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Catálogo de Cuentas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono font-bold text-xs">{acc.code}</td>
                        <td className="py-2 px-3">{acc.name}</td>
                        <td className="py-2 px-3 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              acc.type === "asset"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : acc.type === "liability"
                                ? "bg-amber-500/10 text-amber-600"
                                : acc.type === "revenue"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-purple-500/10 text-purple-600"
                            }`}
                          >
                            {acc.type}
                          </span>
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

      {/* Tab 2: Asientos Contables */}
      {activeTab === "asientos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Registro de Asientos Contables</h2>
            <Button onClick={() => setShowNewEntryModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Asiento Manual
            </Button>
          </div>

          {showNewEntryModal && (
            <Card className="border-primary/50 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Nuevo Asiento Contable Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEntry} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Fecha</label>
                      <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Concepto / Detalle</label>
                      <Input
                        placeholder="Ej. Registro de pago de servicios"
                        value={entryConcept}
                        onChange={(e) => setEntryConcept(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Referencia Documento</label>
                      <Input
                        placeholder="Ej. REC-9921"
                        value={entryRef}
                        onChange={(e) => setEntryRef(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-foreground">Líneas de Débito y Crédito (Partida Doble)</label>
                    {entryItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <select
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={item.account_chart_id}
                          onChange={(e) => {
                            const newItems = [...entryItems];
                            newItems[idx].account_chart_id = Number(e.target.value);
                            setEntryItems(newItems);
                          }}
                        >
                          <option value={0}>-- Seleccionar Cuenta --</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder="Débito"
                          value={item.debit || ""}
                          onChange={(e) => {
                            const newItems = [...entryItems];
                            newItems[idx].debit = Number(e.target.value);
                            setEntryItems(newItems);
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Crédito"
                          value={item.credit || ""}
                          onChange={(e) => {
                            const newItems = [...entryItems];
                            newItems[idx].credit = Number(e.target.value);
                            setEntryItems(newItems);
                          }}
                        />
                        <Input
                          placeholder="Descripción breve"
                          value={item.description || ""}
                          onChange={(e) => {
                            const newItems = [...entryItems];
                            newItems[idx].description = e.target.value;
                            setEntryItems(newItems);
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEntryItems([
                          ...entryItems,
                          { account_chart_id: 0, debit: 0, credit: 0, description: "" },
                        ])
                      }
                    >
                      + Agregar Línea
                    </Button>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setShowNewEntryModal(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Asiento Contable</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 px-3">Número</th>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Concepto</th>
                      <th className="py-2 px-3">Referencia</th>
                      <th className="py-2 px-3">Detalle Cuentas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono font-bold text-xs">{entry.entry_number}</td>
                        <td className="py-2 px-3">{entry.date}</td>
                        <td className="py-2 px-3">{entry.concept}</td>
                        <td className="py-2 px-3">{entry.reference || "-"}</td>
                        <td className="py-2 px-3">
                          <div className="space-y-1 text-xs">
                            {entry.items?.map((item) => (
                              <div key={item.id} className="flex justify-between gap-4 font-mono">
                                <span>
                                  {item.account?.code} - {item.account?.name}
                                </span>
                                <span>
                                  {Number(item.debit) > 0 && `DB: $${Number(item.debit).toLocaleString()}`}{" "}
                                  {Number(item.credit) > 0 && `CR: $${Number(item.credit).toLocaleString()}`}
                                </span>
                              </div>
                            ))}
                          </div>
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

      {/* Tab 3: Libro Mayor */}
      {activeTab === "mayor" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consulta del Libro Mayor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold mb-1">Seleccionar Cuenta</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={selectedAccountId}
                  onChange={(e) => {
                    const accId = Number(e.target.value);
                    setSelectedAccountId(accId);
                    if (accId) fetchGeneralLedger(accId);
                  }}
                >
                  <option value="">-- Seleccionar Cuenta --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {ledgerData && (
                <div className="space-y-4 pt-2">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Débitos Totales:</span>{" "}
                      <strong className="text-emerald-600">${ledgerData.total_debit?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Créditos Totales:</span>{" "}
                      <strong className="text-amber-600">${ledgerData.total_credit?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo Final:</span>{" "}
                      <strong className="text-blue-600">${ledgerData.ending_balance?.toLocaleString()}</strong>
                    </div>
                  </div>

                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-medium">
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Asiento</th>
                        <th className="py-2 px-3">Concepto</th>
                        <th className="py-2 px-3 text-right">Débito</th>
                        <th className="py-2 px-3 text-right">Crédito</th>
                        <th className="py-2 px-3 text-right">Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData.movements?.map((m: any) => (
                        <tr key={m.item_id} className="border-b border-border/50">
                          <td className="py-2 px-3">{m.date}</td>
                          <td className="py-2 px-3 font-mono text-xs">{m.entry_number}</td>
                          <td className="py-2 px-3">{m.concept}</td>
                          <td className="py-2 px-3 text-right font-mono">${m.debit?.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono">${m.credit?.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            ${m.running_balance?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Balance de Comprobación */}
      {activeTab === "balance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance de Comprobación</CardTitle>
            <p className="text-xs text-muted-foreground">Resumen de saldos débitos y créditos por cada cuenta activa.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 font-medium text-sm">
              <div>
                Total Débitos: <strong className="text-emerald-600">${balanceSummary.total_debit?.toLocaleString()}</strong>
              </div>
              <div>
                Total Créditos: <strong className="text-amber-600">${balanceSummary.total_credit?.toLocaleString()}</strong>
              </div>
              <div>
                Estado:{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    balanceSummary.is_balanced
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {balanceSummary.is_balanced ? "✅ BALANCEADO" : "❌ DESBALANCEADO"}
                </span>
              </div>
            </div>

            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Cuenta</th>
                  <th className="py-2 px-3 text-right">Total Débito</th>
                  <th className="py-2 px-3 text-right">Total Crédito</th>
                  <th className="py-2 px-3 text-right">Saldo Neto</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map((row) => (
                  <tr key={row.account_id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-3 font-mono text-xs font-bold">{row.code}</td>
                    <td className="py-2 px-3">{row.name}</td>
                    <td className="py-2 px-3 text-right font-mono">${row.total_debit?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">${row.total_credit?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">${row.balance?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

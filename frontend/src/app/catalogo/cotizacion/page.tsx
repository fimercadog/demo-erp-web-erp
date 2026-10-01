"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/marketing-ui";
import { LeadFields } from "@/components/marketing/lead-fields";
import { formatCOP, submitQuoteRequest } from "@/lib/catalog";
import { useCatalogCart } from "@/lib/catalog-cart";

export default function CotizacionPage() {
  const { items, total, setQty, remove, clear } = useCatalogCart();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      company_name: String(fd.get("company_name") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim() || null,
      consent: fd.get("consent") === "on",
      items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    };

    try {
      await submitQuoteRequest(payload);
      clear();
      setDone(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 429
          ? "Recibimos varios envios seguidos. Espera un momento e intenta de nuevo."
          : status === 422
            ? "Revisa los campos: el nombre, un correo valido y la autorizacion de datos son obligatorios."
            : "No se pudo enviar. Intenta de nuevo o escribenos por WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Cotización"
        title="Solicita tu cotización"
        lead="Revisa tu lista, déjanos tus datos y un asesor te envía precios y disponibilidad."
      />

      <Section className="pt-0">
        {done ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevation-2">
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4" />
              Recibimos tu solicitud de cotizacion. Te contactaremos pronto.
            </div>
            <Link href="/catalogo" className="mt-4 inline-block text-sm font-medium text-primary underline">
              Volver al catalogo
            </Link>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tu lista esta vacia.{" "}
            <Link href="/catalogo" className="font-medium text-primary underline">
              Explora el catalogo
            </Link>{" "}
            y agrega productos.
          </p>
        ) : (
          <div className="grid gap-10 *:min-w-0 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Cantidad</th>
                    <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku} · {formatCOP(item.unit_price)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => setQty(item.id, Number(event.target.value))}
                          aria-label={`Cantidad de ${item.name}`}
                          className="h-9 w-20 rounded-md border border-input bg-card px-2 text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCOP(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Quitar ${item.name}`}
                          className="inline-grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-4 py-4 font-bold" colSpan={2}>
                      Total estimado
                    </td>
                    <td className="px-4 py-4 text-right text-lg font-extrabold">{formatCOP(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              </div>
              <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                El total es una referencia con precios de lista. La cotizacion final la confirma un asesor.
              </p>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-elevation-2">
              <LeadFields messagePlaceholder="Cuéntanos qué insumo, medicamento o requerimiento médico necesitas..." />
              {error ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4" /> {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>
          </div>
        )}
      </Section>
    </MarketingLayout>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { api, primeCsrfCookie } from "@/lib/api";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary";

/**
 * El correo del enlace mágico apunta acá con `?url=<consume url firmada>`.
 * Se consume por fetch (withCredentials), no por navegación directa: solo así
 * el request lleva el header Origin que el backend necesita para tratarlo
 * como "stateful" y setear la cookie de sesión del portal.
 */
export default function PortalEntrarPage() {
  return (
    <React.Suspense fallback={null}>
      <PortalEntrarContent />
    </React.Suspense>
  );
}

function PortalEntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumeUrl = searchParams.get("url");

  const [consuming, setConsuming] = React.useState(Boolean(consumeUrl));
  const [consumeError, setConsumeError] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!consumeUrl) return;
    primeCsrfCookie()
      .then(() => api.get(consumeUrl))
      .then(() => router.replace("/portal"))
      .catch(() => setConsumeError(true))
      .finally(() => setConsuming(false));
  }, [consumeUrl, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    try {
      await api.post("/portal/login", { email });
      setSent(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 429 ? "Esperá un momento e intentá de nuevo." : "No se pudo enviar. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (consumeUrl) {
    return (
      <MarketingLayout>
        <PageHero eyebrow="Portal del dueño" title="Entrando a tu portal" lead="" />
        <section className="mx-auto max-w-md px-4 pb-24 text-center sm:px-6">
          {consuming ? (
            <p className="text-sm text-muted-foreground">Verificando tu enlace…</p>
          ) : consumeError ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              Este enlace ya venció o no es válido. Pide uno nuevo abajo.
            </div>
          ) : null}
        </section>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Portal del paciente"
        title="Entrá a tu portal"
        lead="Escribí tu correo y te enviamos un enlace para ver y gestionar tus citas médicas. Sin contraseña."
      />
      <section className="mx-auto max-w-md px-4 pb-24 sm:px-6">
        {sent ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4" />
            Si el correo está registrado, te enviamos un enlace de acceso.
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-elevation-2">
            <label className="block text-sm">
              <span>Correo *</span>
              <input name="email" type="email" required className={`mt-1 ${inputClass}`} />
            </label>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="mt-4 h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviarme el enlace"}
            </button>
          </form>
        )}
      </section>
    </MarketingLayout>
  );
}

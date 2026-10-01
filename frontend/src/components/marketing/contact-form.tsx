"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { LeadFields } from "@/components/marketing/lead-fields";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      company_name: String(fd.get("company_name") ?? "").trim() || null,
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim() || null,
      source: "contact",
      consent: fd.get("consent") === "on",
    };

    try {
      await api.post("/public/leads", payload);
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

  if (done) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-elevation-3">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4" />
          Recibimos tu mensaje. Te contactaremos pronto.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-card p-6 shadow-elevation-3 sm:p-8">
      <LeadFields
        messagePlaceholder="Cuéntanos cómo podemos ayudarte con tu mascota"
        secondaryField={{ placeholder: "Especie / Raza (opcional)", label: "Especie / Raza" }}
      />
      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}
      {/* Boton naranja -- mismo "SUBMIT" del formulario real de Contact en el pack. */}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-cta px-6 font-heading text-sm font-extrabold uppercase tracking-[0.05em] text-cta-foreground transition-colors hover:bg-cta-hover disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}

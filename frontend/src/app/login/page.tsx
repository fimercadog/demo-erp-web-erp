"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "./login-form";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const demoEmails: Record<string, string> = {
  superadmin: "superadmin@vetlosandes.co",
  admin: "admin@vetlosandes.co",
  veterinario: "veterinario@vetlosandes.co",
  veterinaria: "veterinaria@vetlosandes.co",
  recepcion: "recepcion@vetlosandes.co",
  inventario: "inventario@vetlosandes.co",
  ventas: "ventas@vetlosandes.co",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo") ?? "";
  const initialEmail = demoMode && demoParam ? demoEmails[demoParam] : undefined;

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-semibold text-foreground">Iniciar sesion</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {demoMode
          ? "Usa un usuario demo para entrar al panel y probar roles."
          : "Ingresa con las credenciales de tu cuenta."}
      </p>
      <LoginForm initialEmail={initialEmail} autoLogin={Boolean(initialEmail)} demoMode={demoMode} />
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<p className="p-8 text-center text-sm text-muted-foreground">Cargando...</p>}>
      <LoginContent />
    </React.Suspense>
  );
}

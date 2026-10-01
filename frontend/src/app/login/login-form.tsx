"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { isAxiosError } from "axios";
import { api, primeCsrfCookie } from "@/lib/api";
import { AuthUser, storeAuthSession } from "@/lib/auth";

const demoUsers = [
  ["Super Admin", "superadmin@vetdemo.co"],
  ["Admin veterinaria", "admin@vetdemo.co"],
  ["Veterinario/a", "veterinario@vetdemo.co"],
  ["Recepción", "recepcion@vetdemo.co"],
  ["Inventario / farmacia", "inventario@vetdemo.co"],
  ["Ventas", "ventas@vetdemo.co"],
];

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-card px-4 text-sm shadow-elevation-1 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

type LoginResponse = { user: AuthUser };

export function LoginForm({
  initialEmail = "",
  autoLogin = false,
  demoMode = false,
}: {
  initialEmail?: string;
  autoLogin?: boolean;
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(demoMode ? "password" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const autoLoginStarted = useRef(false);

  const login = useCallback(
    async (selectedEmail = email, selectedPassword = password) => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        await primeCsrfCookie();
        const response = await api.post<LoginResponse>("/auth/login", {
          email: selectedEmail,
          password: selectedPassword,
        });
        storeAuthSession(response.data.user);
        setSuccess(`Sesion iniciada como ${response.data.user.roles.join(", ")}`);
        router.push("/app/dashboard");
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 429) {
          const retryAfter = Number(err.response.headers["retry-after"]) || 60;
          setError(`Demasiados intentos fallidos. Espera ${retryAfter} segundos e intenta de nuevo.`);
        } else {
          setError("No se pudo iniciar sesion. Revisa el usuario y la contraseña.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, router],
  );

  useEffect(() => {
    if (!autoLogin || autoLoginStarted.current) return;
    autoLoginStarted.current = true;
    void login(initialEmail, "password");
  }, [autoLogin, initialEmail, login]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login();
  }

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <input
          className={inputClass}
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {error ? (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        ) : null}
        {success ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4 shrink-0" /> {success}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-elevation-2 transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar al panel"}
        </button>
      </form>

      {demoMode ? (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-4">
          <p className="text-sm font-bold">Usuarios demo</p>
          <p className="mt-1 text-xs text-muted-foreground">Contraseña para todos: password</p>
          <div className="mt-4 space-y-2">
            {demoUsers.map(([role, userEmail]) => (
              <button
                key={userEmail}
                type="button"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-accent"
                onClick={() => {
                  setEmail(userEmail);
                  setPassword("password");
                }}
              >
                <p className="font-bold">{role}</p>
                <p className="text-muted-foreground">{userEmail}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

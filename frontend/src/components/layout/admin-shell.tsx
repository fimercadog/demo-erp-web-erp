"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bot,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Contact2,
  Dna,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Menu,
  Moon,
  Package,
  PawPrint,
  Rabbit,
  Receipt,
  Repeat,
  Ruler,
  Settings,
  Shield,
  ShieldAlert,
  ListTodo,
  ShoppingCart,
  Wrench,
  Stethoscope,
  StickyNote,
  Sun,
  Syringe,
  Tag,
  Tags,
  TrendingUp,
  Truck,
  UserCircle,
  Users,
  Warehouse,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { BetaNotice } from "@/components/layout/beta-notice";
import { ContingencyBanner } from "@/components/layout/contingency-banner";
import { useContingency } from "@/lib/contingency/context";
import { planHidesRoute, planLocksAsPremium } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import {
  AUTH_EXPIRED_EVENT,
  AuthUser,
  clearAuthSession,
  getStoredUser,
  hasAnyPermission,
  updateStoredUser,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

// Una sola peticion /auth/me compartida: si el efecto se monta dos veces
// (StrictMode en dev, o doble render) no se dispara el request dos veces.
let meRequest: Promise<{ data: { user: AuthUser } }> | null = null;
function fetchMe() {
  meRequest ??= api
    .get<{ user: AuthUser }>("/auth/me")
    .finally(() => {
      meRequest = null;
    });
  return meRequest;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: string[];
  premium?: boolean;
  /** Control critico: color de alerta fijo aunque este inactivo. */
  alert?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [{ href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: ["dashboard.view"] }],
  },
  {
    label: "Clínica",
    items: [
      { href: "/app/agenda", label: "Citas del día", icon: CalendarDays, permissions: ["appointments.manage"] },
      { href: "/app/citas", label: "Citas", icon: CalendarClock, permissions: ["appointments.manage"] },
      { href: "/app/pacientes", label: "Pacientes", icon: PawPrint, permissions: ["patients.manage"] },
      { href: "/app/consultas", label: "Historia clínica", icon: Stethoscope, permissions: ["medical_records.manage"] },
      { href: "/app/vacunas", label: "Vacunas", icon: Syringe, permissions: ["vaccinations.manage"] },
      { href: "/app/vacunas-pendientes", label: "Vacunas por vencer", icon: AlertTriangle, permissions: ["vaccinations.manage"] },
      { href: "/app/recetas", label: "Recetas", icon: FileText, permissions: ["prescriptions.manage"] },
      { href: "/app/procedimientos", label: "Procedimientos", icon: ClipboardList, permissions: ["procedures.manage"] },
      { href: "/app/diagnosticos", label: "Diagnósticos", icon: ListChecks, permissions: ["medical_records.manage"] },
      { href: "/app/reportes-clinicos", label: "Reportes clínicos", icon: BarChart3, permissions: ["clinical_reports.view"] },
      { href: "/app/servicios", label: "Servicios", icon: Tag, permissions: ["services.manage"] },
      { href: "/app/especies", label: "Especies", icon: Rabbit, permissions: ["patients.manage"] },
      { href: "/app/razas", label: "Razas", icon: Dna, permissions: ["patients.manage"] },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/app/leads", label: "Solicitudes (Leads)", icon: Inbox, permissions: ["leads.view"] },
      { href: "/app/clientes", label: "Clientes / Propietarios", icon: Users, permissions: ["clients.manage"] },
      { href: "/app/contactos", label: "Contactos", icon: Contact2, permissions: ["clients.manage"] },
      { href: "/app/segmentos", label: "Segmentos", icon: Tags, permissions: ["clients.manage"] },
      { href: "/app/notas", label: "Notas", icon: StickyNote, permissions: ["clients.manage"] },
      { href: "/app/deals", label: "Planes y oportunidades", icon: Handshake, permissions: ["deals.manage"] },
      { href: "/app/cotizaciones", label: "Cotizaciones / Presupuestos", icon: FileText, permissions: ["deals.manage"] },
      { href: "/app/actividades", label: "Actividades", icon: ListChecks, permissions: ["activities.manage"] },
      { href: "/app/tareas", label: "Tareas", icon: ListTodo, permissions: ["activities.manage"] },
      { href: "/app/seguimientos", label: "Seguimientos", icon: CalendarClock, permissions: ["activities.manage"] },
      { href: "/app/calendario", label: "Calendario", icon: CalendarDays, permissions: ["activities.manage"] },
      { href: "/app/pedidos", label: "Pedidos", icon: Receipt, permissions: ["orders.manage"] },
    ],
  },
  {
    label: "Ventas",
    items: [
      { href: "/app/facturas", label: "Facturas", icon: FileText, permissions: ["invoices.manage"] },
      { href: "/app/pagos", label: "Pagos y abonos", icon: Receipt, permissions: ["payments.manage"] },
    ],
  },
  {
    label: "Inventario",
    items: [
      { href: "/app/productos", label: "Productos", icon: Package, permissions: ["products.manage"] },
      { href: "/app/categorias", label: "Categorias", icon: Tags, permissions: ["products.manage"] },
      { href: "/app/marcas", label: "Marcas", icon: Tag, permissions: ["products.manage"] },
      { href: "/app/unidades", label: "Unidades", icon: Ruler, permissions: ["products.manage"] },
      { href: "/app/bodegas", label: "Bodegas", icon: Warehouse, permissions: ["warehouses.manage"] },
      { href: "/app/movimientos-inventario", label: "Movimientos", icon: ArrowLeftRight, permissions: ["stock.manage"] },
      { href: "/app/transferencias", label: "Transferencias", icon: Repeat, permissions: ["stock.manage"] },
      { href: "/app/alertas-stock", label: "Alertas de stock", icon: AlertTriangle, permissions: ["products.manage"] },
    ],
  },
  {
    label: "Compras",
    items: [
      { href: "/app/proveedores", label: "Proveedores", icon: Truck, permissions: ["suppliers.manage"] },
      { href: "/app/ordenes-compra", label: "Ordenes de compra", icon: ShoppingCart, permissions: ["purchase_orders.manage"] },
      { href: "/app/recepciones-compra", label: "Recepciones", icon: ClipboardList, permissions: ["purchase_receipts.manage"] },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/app/cuentas-por-cobrar", label: "Cuentas por cobrar", icon: Receipt, permissions: ["accounts_receivable.view"] },
      { href: "/app/cuentas-por-pagar", label: "Cuentas por pagar", icon: FileText, permissions: ["accounts_payable.view"] },
      { href: "/app/cajas", label: "Cajas", icon: Warehouse, permissions: ["cash.manage"] },
      { href: "/app/sesiones-caja", label: "Sesiones de caja", icon: ClipboardList, permissions: ["cash.manage"] },
      { href: "/app/movimientos-caja", label: "Movimientos de caja", icon: ArrowLeftRight, permissions: ["cash.manage"] },
    ],
  },
  {
    label: "Analitica",
    items: [
      { href: "/app/reportes", label: "Reportes", icon: BarChart3, permissions: ["reports.view"] },
      { href: "/app/reportes-comerciales", label: "Reportes comerciales", icon: TrendingUp, permissions: ["reports.view"] },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { href: "/app/contingencia", label: "Modo contingencia", icon: WifiOff, alert: true },
      { href: "/app/ia", label: "Asistente IA", icon: Bot, premium: true },
    ],
  },
  {
    label: "Administracion",
    items: [
      { href: "/app/auditoria", label: "Auditoria", icon: ClipboardList, permissions: ["audit.view"] },
      { href: "/app/usuarios", label: "Usuarios", icon: UserCircle, permissions: ["users.manage"] },
      { href: "/app/roles", label: "Roles", icon: Shield, permissions: ["roles.manage"] },
      { href: "/app/configuracion", label: "Configuracion", icon: Settings, permissions: ["settings.manage"] },
    ],
  },
];

const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

function PremiumBadge() {
  return (
    <span className="ml-auto flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      <Lock className="h-3 w-3" /> Premium
    </span>
  );
}

// Contenido del modal "Premium" segun el modulo. Sin entrada => cae al de IA.
const PREMIUM_INFO: Record<string, { title: string; body: React.ReactNode }> = {
  "/app/contingencia": {
    title: "Modo contingencia (continuidad sin conexion)",
    body: (
      <>
        <p>
          El modo contingencia permite{" "}
          <strong className="font-semibold text-foreground">seguir atendiendo cuando se cae internet</strong>: las
          consultas, ventas de mostrador y movimientos de inventario se registran localmente y quedan en una cola.
        </p>
        <p>
          Al volver la conexion, todo lo encolado se{" "}
          <strong className="font-semibold text-foreground">sincroniza con el sistema</strong> y se resuelven los
          conflictos (por ejemplo, stock que cambio mientras estabas sin senal).
        </p>
        <p className="font-medium text-foreground">
          Esta funcionalidad esta disponible en el plan Premium. Para activarla o conocer las opciones, comunicate
          con el administrador de tu sistema.
        </p>
      </>
    ),
  },
  "/app/ia": {
    title: "Inteligencia Artificial para la clínica",
    body: (
      <>
        <p>
          Potenciá la gestión clínica con una herramienta de inteligencia artificial diseñada para{" "}
          <strong className="font-semibold text-foreground">
            apoyar la atención, facilitar el análisis de información y ayudarte en la toma de decisiones
          </strong>
          .
        </p>
        <p>
          Podés utilizarla para consultar la historia de un paciente, identificar vacunas por vencer, revisar la
          ocupación de la agenda, resumir datos relevantes y obtener apoyo para interpretar indicadores como
          rotación de inventario de medicamentos y desempeño de la clínica.
        </p>
        <p>
          La inteligencia artificial funciona como un{" "}
          <strong className="font-semibold text-foreground">asistente para el equipo de la clínica</strong>,
          permitiendo trabajar de forma más ágil y obtener información útil a partir de los datos disponibles
          en el sistema.
        </p>
        <p className="font-medium text-foreground">
          Esta funcionalidad está disponible en el plan Premium. Para activarla o conocer las opciones
          disponibles, comunicate con el administrador de tu sistema.
        </p>
      </>
    ),
  },
};

function NavLink({ item, stripe }: { item: NavItem; stripe?: boolean }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const { isActive: contingencyActive, pendingCount } = useContingency();
  const premiumLocked = item.premium || planLocksAsPremium(item.href);

  if (item.alert && !premiumLocked) {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-warning transition-colors hover:bg-warning/10",
          active ? "bg-warning/10" : stripe && "bg-muted",
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
        {contingencyActive ? (
          <span className="ml-auto rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Activo{pendingCount ? ` · ${pendingCount}` : ""}
          </span>
        ) : null}
      </Link>
    );
  }

  if (premiumLocked) {
    const info = PREMIUM_INFO[item.href] ?? PREMIUM_INFO["/app/ia"];
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn("flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground", stripe && "bg-muted")}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            <PremiumBadge />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{info.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">{info.body}</div>
        </DialogContent>
      </Dialog>
    );
  }

  const active = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active ? "bg-primary/10 font-semibold text-primary" : stripe && "bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  // Arranca en null: el server no tiene localStorage, sembrar el estado desde
  // getStoredUser() en el render inicial rompe la hidratacion (React #418).
  // El usuario cacheado se carga en el efecto, ya en cliente.
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Cierra el menu movil al navegar a otra ruta. `queueMicrotask` para no
  // hacer setState sincrono dentro del efecto (evita renders en cascada).
  React.useEffect(() => {
    queueMicrotask(() => setMobileNavOpen(false));
  }, [pathname]);

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local session should still be cleared if the token is already invalid.
    } finally {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router]);

  React.useEffect(() => {
    // La sesion vive en una cookie httpOnly (invisible a JS): no hay forma de
    // saber local si existe sin preguntarle a /auth/me. Pinta ya desde la
    // cache (cliente) mientras se resuelve, y redirige si /auth/me falla.
    const cached = getStoredUser();
    if (cached) {
      // Deferido: no hacer setState sincrono dentro del efecto.
      queueMicrotask(() => {
        setUser(cached);
        setCheckingSession(false);
      });
    }

    fetchMe()
      .then((response) => {
        updateStoredUser(response.data.user);
        setUser(response.data.user);
      })
      .catch(() => {
        // El interceptor 401 ya limpio la sesion; aqui solo redirigimos.
        clearAuthSession();
        router.replace("/login");
      })
      .finally(() => setCheckingSession(false));
  }, [router]);

  React.useEffect(() => {
    function handleExpiredSession() {
      clearAuthSession();
      router.replace("/login");
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, [router]);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !planHidesRoute(item.href) && hasAnyPermission(user, item.permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);

  // Guard por ruta: si la ruta actual corresponde a un modulo del menu y el
  // usuario no tiene su permiso, se muestra una pantalla de acceso denegado.
  // El backend igual responde 403; esto es UX (evita tabla rota + 403 en rojo).
  const activeNav = allNavItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const authorized =
    !planHidesRoute(activeNav?.href) &&
    !planLocksAsPremium(activeNav?.href) &&
    (!user || !activeNav || hasAnyPermission(user, activeNav.permissions));

  if (checkingSession && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-sm font-medium">Validando sesion</p>
          <p className="mt-1 text-xs text-muted-foreground">Preparando el panel privado...</p>
        </div>
      </div>
    );
  }

  const sidebarHeader = (
    <div className="flex h-16 items-center gap-3 border-b border-border px-5">
      <LogoMark size="sm" />
      <div>
        <p className="flex items-center gap-1.5 text-sm font-black tracking-tight text-foreground">
          Vet<span className="text-primary">·</span>Panel
          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            Beta
          </span>
        </p>
        <p className="text-xs text-muted-foreground">Panel privado</p>
      </div>
    </div>
  );

  const navBody = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {(() => {
        let rowIdx = 0;
        return visibleGroups.map((group, i) => (
          <div
            key={group.label || "general"}
            className={i > 0 ? "mt-2 space-y-0 border-t border-border pt-2" : "space-y-0"}
          >
            {group.label ? (
              <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const stripe = rowIdx++ % 2 === 0;
              return <NavLink key={item.href} item={item} stripe={stripe} />;
            })}
          </div>
        ));
      })()}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card shadow-[1px_0_12px_0_rgb(0_0_0/0.06)] lg:flex lg:flex-col">
        {sidebarHeader}
        {navBody}
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col border-r border-border bg-card">
            <div className="relative">
              {sidebarHeader}
              <Button
                variant="outline"
                size="icon"
                aria-label="Cerrar menu"
                title="Cerrar menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {navBody}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 backdrop-blur shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menu"
              title="Abrir menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0 max-w-32 sm:max-w-none">
              <p className="truncate text-sm font-medium">{user?.company?.name ?? "VetPanel"}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Panel de gestión veterinaria
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 sm:flex">
              <UserCircle className="h-4 w-4 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user?.name ?? "Usuario"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user?.roles?.[0] ?? user?.email}
                </p>
              </div>
            </div>
            <BetaNotice />
            <Button
              variant="outline"
              size="icon"
              aria-label="Cambiar tema"
              title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Cerrar sesion" title="Cerrar sesion" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <ContingencyBanner />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          {authorized ? (
            children
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground" />
              <h1 className="mt-4 text-lg font-semibold">No tienes acceso a esta seccion</h1>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tu rol no incluye los permisos necesarios. Si crees que es un error, contacta a un administrador.
              </p>
              <Link href="/app/dashboard" className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">
                Ir al dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

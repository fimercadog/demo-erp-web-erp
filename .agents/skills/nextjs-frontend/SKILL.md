---
name: nextjs-frontend
description: Convenciones de frontend en Next.js 16 (Turbopack, React 19, TypeScript, Tailwind CSS, Lucide icons, Sonner toast, componentes UI).
---

# Next.js Frontend Skill

Directrices de desarrollo frontend para la interfaz del ERP y sus módulos clínicos:

## 1. Arquitectura y App Router

- **Rutas App:** Organizadas en `src/app/app/...` para el panel administrativo y `src/app/...` para landing / portal público.
- **Client Components:** Usar `"use client";` al inicio cuando se requiera interactividad, hooks (`useState`, `useEffect`) o navegación.
- **Cliente API:** Centralizado en `src/lib/api.ts` con manejo de tokens JWT y errores 401/422.

## 2. Componentes UI y Estilos

- **Tailwind CSS:** Clases utilitarias estándar con tokens semánticos (`bg-card`, `text-primary`, `border-border`, `text-muted-foreground`).
- **Componentes Base:** Ubicados en `src/components/ui/` (`Button`, `Card`, `Dialog`, `Input`, `Badge`).
- **Notificaciones:** Usar `toast.success(...)` y `toast.error(...)` de `sonner`.
- **Formato:** Utilizar siempre `formatCurrency(val)` y `formatDate(val)` desde `src/lib/utils.ts`.

## 3. Tipado TypeScript

- Todos los tipos compartidos deben definirse en `src/lib/types.ts`.
- Cero tolerancia a errores de compilación (`npm run build` debe finalizar con código 0).

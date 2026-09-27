# FidelOS Multi-Repo & Verticalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish `fidelos-core` as the master baseline ERP repository and generate 9 specialized, independently testable and compilable vertical repositories (`fidelos-web-erp-<vertical>`) while preserving core zero-hardcode multi-tenant architecture.

**Architecture:** A hub-and-spoke repository topology where `fidelos-core-v1.0.0` serves as the single source of truth for generic ERP logic (CRM, Ventas, Inventario, Compras, Finanzas, Contabilidad Nivel 1, RRHH). Each vertical repository contains its specialized web site, industry seeders, vertical configuration, and domain-specific modules.

**Tech Stack:** Laravel 12 (PHP 8.3+), Next.js 16 (React 19 + Turbopack), Tailwind CSS v4, MySQL/MariaDB (SQLite for tests).

---

## Global Constraints

- Never commit vertical-specific hardcoded business rules, NITs, addresses, or prices into `fidelos-core`.
- Every vertical repository must pass 100% of PHPUnit tests (`php artisan test`) and compile 100% of Next.js static pages (`npm run build`).
- Do not modify or delete the source workspace until all 9 vertical structures are verified.

---

### Task 1: Baseline Tagging & Safety Snapshot

**Files:**
- Create: `docs/superpowers/plans/2026-09-26-verticalization-master-plan.md`
- Tag: Git tag `fidelos-core-v1.0.0`

- [ ] **Step 1: Check git workspace status**

Run: `git status && git branch -a && git log --oneline -5 && git worktree list`
Expected: Working tree clean or identified files on active `ips` branch.

- [ ] **Step 2: Create safety tag for FidelOS Core v1.0.0**

Run: `git tag -a fidelos-core-v1.0.0 -m "FidelOS Core Baseline v1.0.0 - Verified Multi-Tenant"`
Expected: Tag `fidelos-core-v1.0.0` created successfully.

---

### Task 2: Core Verification & Baseline Proof

**Files:**
- Verify: `backend/tests`
- Verify: `frontend/src`

- [ ] **Step 1: Run PHPUnit test suite on baseline core**

Run: `php artisan test` in `backend` directory
Expected: 311 passed (1,253 assertions, 0 failures).

- [ ] **Step 2: Run Next.js production build on baseline core**

Run: `npm run build` in `frontend` directory
Expected: 548 static pages compiled with 0 errors.

---

### Task 3: Vertical Repositories Scaffolding (Group 1: Health & Care)

**Verticals:**
1. `fidelos-web-erp-ips` (IPS / Salud Humana)
2. `fidelos-web-erp-clinica-estetica` (Clínica Estética & Medicina Estética)
3. `fidelos-web-erp-veterinaria` (Veterinaria & Zootecnia)
4. `fidelos-web-erp-sueroterapia-domicilio` (Sueroterapia a Domicilio)

- [ ] **Step 1: Verify branch/worktree initialization for IPS**
Run verification commands to confirm IPS module integrity.

- [ ] **Step 2: Verify branch/worktree initialization for Clínica Estética**
Run verification commands to confirm Estética module integrity.

- [ ] **Step 3: Verify branch/worktree initialization for Veterinaria**
Run verification commands to confirm Vet module integrity.

- [ ] **Step 4: Verify branch/worktree initialization for Sueroterapia**
Run verification commands to confirm Domiciliary IV module integrity.

---

### Task 4: Vertical Repositories Scaffolding (Group 2: Trade & Services)

**Verticals:**
5. `fidelos-web-erp-distribuidora` (Distribuidora & Comercio Mayorista)
6. `fidelos-web-erp-servicios` (Servicios Especializados & Consultoría)
7. `fidelos-web-erp-odontologia` (Centro Odontológico)
8. `fidelos-web-erp-gimnasios` (Gimnasios & Wellness)
9. `fidelos-web-erp-taller` (Taller Mecánico & Servicio Técnico)

- [ ] **Step 1: Verify branch/worktree initialization for Distribuidora**
Run verification commands to confirm Distribuidora module integrity.

- [ ] **Step 2: Verify branch/worktree initialization for Servicios**
Run verification commands to confirm Servicios module integrity.

- [ ] **Step 3: Verify branch/worktree initialization for Odontología**
Run verification commands to confirm Odontología module integrity.

- [ ] **Step 4: Verify branch/worktree initialization for Gimnasios**
Run verification commands to confirm Gimnasios module integrity.

- [ ] **Step 5: Verify branch/worktree initialization for Taller**
Run verification commands to confirm Taller module integrity.

---

### Task 5: Final Audit & Verification Gate Report

**Files:**
- Create: `docs/HARDCODE_AUDIT_ALL_VERTICALS_FINAL.md`

- [ ] **Step 1: Execute full PHPUnit test pass**
Run `php artisan test` across workspace.

- [ ] **Step 2: Execute full Next.js build pass**
Run `npm run build` across workspace.

- [ ] **Step 3: Generate Final Audit Report**
Document 100% resolution of hardcodes and test/build passing evidence.

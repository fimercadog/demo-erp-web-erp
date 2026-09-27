# Cierre de Auditoría Funcional Transversal ERP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the missing and partial transversal modules (Contabilidad Básica, Conciliación Bancaria Nivel 1, Matching 3 Vías, Asistencia RRHH, Exportador RIPS IPS, Visor Antes/Después Estética, Firma Digital Inmobiliaria) to achieve 100% functional completeness across all 8 operative verticals without breaking or altering existing capabilities.

**Architecture:** Add clean domain services, Laravel models/migrations, REST API controllers, React frontend views, and comprehensive PHPUnit test suites following backward-compatible, additive design.

**Tech Stack:** Laravel 10+, Next.js 14 / React 18, PostgreSQL / SQLite (testing), Tailwind CSS, PHPUnit 10+.

**Spec:** User request "PROMPT PARA GEMINI — CIERRE DE AUDITORÍA FUNCIONAL TRANSVERSAL" and baseline audit `docs/ERP_TRANSVERSAL_FUNCTIONAL_AUDIT.md`.

## Global Constraints

- **Empirical truth:** Never declare completed without passing tests and build execution.
- **Strict Scope on Bank Reconciliation:** ONLY Level 1 (Import extract CSV/Excel/OFX vs ERP CashMovements/Payments). Zero external banking APIs or live sync.
- **No breaking changes:** Keep existing 8 verticals fully operative.
- **No Git commits/pushes without authorization.**

---

### Task 1: Contabilidad Básica (PUC, Asientos Contables, Libro Mayor, Balance de Comprobación)

**Files:**
- Create: `backend/database/migrations/2026_09_26_000001_create_accounting_tables.php`
- Create: `backend/app/Models/AccountChart.php`
- Create: `backend/app/Models/JournalEntry.php`
- Create: `backend/app/Models/JournalEntryItem.php`
- Create: `backend/app/Services/AccountingService.php`
- Create: `backend/app/Http/Controllers/AccountingController.php`
- Modify: `backend/routes/api.php`
- Create: `src/app/contabilidad/page.tsx`
- Create: `src/components/accounting/ChartOfAccounts.tsx`
- Create: `src/components/accounting/JournalEntries.tsx`
- Create: `src/components/accounting/TrialBalance.tsx`
- Create: `backend/tests/Feature/AccountingTest.php`

**Interfaces:**
- Consumes: `Company`, `Invoice`, `Payment`, `AccountPayable`, `AccountReceivable`
- Produces: `AccountChart`, `JournalEntry`, `JournalEntryItem`, `/api/accounting/*` endpoints

- [ ] **Step 1: Create Migration and Models for Accounting**
- [ ] **Step 2: Create AccountingService (Auto journal entries on transactions + manual entries + Trial balance generator)**
- [ ] **Step 3: Create AccountingController and REST endpoints**
- [ ] **Step 4: Create Frontend Accounting page & components (`/app/contabilidad`)**
- [ ] **Step 5: Write and run `AccountingTest.php` (PHPUnit)**

---

### Task 2: Conciliación Bancaria — NIVEL 1 (Finanzas)

**Files:**
- Create: `backend/database/migrations/2026_09_26_000002_create_bank_reconciliation_tables.php`
- Create: `backend/app/Models/BankStatement.php`
- Create: `backend/app/Models/BankStatementItem.php`
- Create: `backend/app/Models/BankReconciliation.php`
- Create: `backend/app/Services/BankReconciliationService.php`
- Create: `backend/app/Http/Controllers/BankReconciliationController.php`
- Modify: `backend/routes/api.php`
- Create: `src/app/finanzas/conciliacion/page.tsx`
- Create: `src/components/finance/BankReconciliationWidget.tsx`
- Create: `backend/tests/Feature/BankReconciliationTest.php`

**Interfaces:**
- Consumes: `CashMovement`, `Payment`, `BankStatement`
- Produces: `BankReconciliationService::compareExtractWithErp()`, `/api/finance/bank-reconciliation/*`

- [ ] **Step 1: Create Migration and Models for Bank Statement & Reconciliation**
- [ ] **Step 2: Create BankReconciliationService (Extract parsing, auto-match by date/amount/ref, summary metrics)**
- [ ] **Step 3: Create BankReconciliationController endpoints**
- [ ] **Step 4: Create Frontend UI for Bank Reconciliation (`/app/finanzas/conciliacion`)**
- [ ] **Step 5: Write and run `BankReconciliationTest.php` (PHPUnit)**

---

### Task 3: Matching de Compras en 3 Vías (Core Compras)

**Files:**
- Create: `backend/database/migrations/2026_09_26_000003_add_three_way_match_to_purchases.php`
- Create: `backend/app/Services/ThreeWayMatchingService.php`
- Create: `backend/app/Http/Controllers/ThreeWayMatchingController.php`
- Modify: `backend/routes/api.php`
- Create: `src/components/purchases/ThreeWayMatchBadge.tsx`
- Create: `backend/tests/Feature/ThreeWayMatchingTest.php`

**Interfaces:**
- Consumes: `PurchaseOrder`, `PurchaseReceipt`, `AccountPayable`
- Produces: `ThreeWayMatchingService::evaluateMatch()`, `/api/purchases/three-way-match/{po_id}`

- [ ] **Step 1: Create Migration for 3-Way Matching flags**
- [ ] **Step 2: Create ThreeWayMatchingService (Compare quantities, unit prices, totals between PO, Receipt, and Invoice)**
- [ ] **Step 3: Create Controller & API route**
- [ ] **Step 4: Add Frontend widget to Purchase detail page**
- [ ] **Step 5: Write and run `ThreeWayMatchingTest.php`**

---

### Task 4: RRHH Asistencia Básica (Entrada / Salida / Historial)

**Files:**
- Create: `backend/database/migrations/2026_09_26_000004_create_employee_attendances_table.php`
- Create: `backend/app/Models/EmployeeAttendance.php`
- Create: `backend/app/Services/AttendanceService.php`
- Create: `backend/app/Http/Controllers/EmployeeAttendanceController.php`
- Modify: `backend/routes/api.php`
- Create: `src/app/recursos-humanos/asistencia/page.tsx`
- Create: `backend/tests/Feature/EmployeeAttendanceTest.php`

**Interfaces:**
- Consumes: `Employee`
- Produces: `EmployeeAttendance`, `/api/hr/attendance/*`

- [ ] **Step 1: Create Migration and EmployeeAttendance Model**
- [ ] **Step 2: Create AttendanceService (clock-in, clock-out, status reporting)**
- [ ] **Step 3: Create EmployeeAttendanceController & endpoints**
- [ ] **Step 4: Create Frontend UI for Attendance in HR (`/app/recursos-humanos/asistencia`)**
- [ ] **Step 5: Write and run `EmployeeAttendanceTest.php`**

---

### Task 5: Cierre de Módulos Parciales (RIPS ZIP IPS + Visor Estética + Firma Inmobiliaria)

**Files:**
- Create: `backend/app/Services/RipsExporterService.php`
- Create: `backend/app/Http/Controllers/RipsExporterController.php`
- Create: `src/components/esthetic/BeforeAfterSlider.tsx`
- Create: `backend/app/Services/LeaseSignatureService.php`
- Create: `backend/app/Http/Controllers/LeaseSignatureController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/RipsExporterTest.php`
- Create: `backend/tests/Feature/LeaseSignatureTest.php`

**Interfaces:**
- Consumes: `PatientHistory` (IPS), `Patient` (Estética), `PropertyLease` (Inmobiliaria)
- Produces: RIPS ZIP stream, Before/After Slider UI component, Simple digital signature status

- [ ] **Step 1: Implement RIPS ZIP Exporter Service & Endpoint (Res 2275 Minsalud)**
- [ ] **Step 2: Implement Before/After interactive photo slider component for Esthetic Clinic**
- [ ] **Step 3: Implement Lease Simple Digital Signature status service & endpoint for Real Estate**
- [ ] **Step 4: Write and run feature tests for RIPS and Lease Signature**

---

### Task 6: Pruebas Globales, Matriz Final & Documento Final `docs/ERP_TRANSVERSAL_FUNCTIONAL_AUDIT_FINAL.md`

**Files:**
- Create: `docs/ERP_TRANSVERSAL_FUNCTIONAL_AUDIT_FINAL.md`

- [ ] **Step 1: Run full PHPUnit test suite (`php artisan test`) and verify 100% pass**
- [ ] **Step 2: Run full Next.js build (`npm run build`) and verify 0 errors**
- [ ] **Step 3: Generate final audit document with before/after matrix, evidence, DB details, and Nivel 1 Bank Reconciliation declaration**

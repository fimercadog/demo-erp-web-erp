# Roadmap — vertical veterinaria (Fase 3)

Rama: `vertical/veterinaria`, forkeada del tag `core-base-estable`.
Base del análisis: [`adaptacion-veterinaria.md`](adaptacion-veterinaria.md) ·
frontera core/vertical: [`core-reutilizable.md`](core-reutilizable.md).

> **Revisión 2 (2026-09-09)** — ajustes aprobados por Fidel:
> 1. Slice nuevo **S4 — Servicios veterinarios** (`Service` ≠ `Product`). Renumerado S4→S12.
> 2. `Appointment` lleva **solo `patient_id`** — el propietario se obtiene por `Appointment → Patient → Client`. Sin `client_id` denormalizado.
> 3. Portal público: **"Solicita tu cita"** (no "Reservá") — el flujo NO crea una cita confirmada.
> 4. Vacunas: estrategia de lotes documentada; **inventario por lote/vencimiento queda como evolución futura**, no se implementa en el MVP.
> 5. El grupo de nav **"Clínica" no se muestra vacío** — aparece solo cuando tiene ≥1 módulo visible (comportamiento que el core ya tiene: `visibleGroups` filtra los grupos sin items).

## Reglas de ejecución

- **Keep the core generic.** Los módulos nuevos se montan sobre el motor CRUD
  (`BaseCrudController` ↔ `ModuleTablePage`). `Client`, `Product` y familia **no
  se renombran** — se relabelan en la UI y se extienden.
- **No se toca el core** salvo que aparezca un defecto real; en ese caso se
  corrige también en el proyecto base (`master`) y se cherry-pickea.
- Cada slice es **verificable**: no se avanza al siguiente si su check está rojo.
- Dato clínico usa **soft-delete** (nivel 4 de
  [`soft-delete-strategy.md`](soft-delete-strategy.md)).
- Todo modelo nuevo lleva `company_id` + se scopea por `BaseCrudController`
  (mismo patrón manual del core — ver [`multitenancy.md`](multitenancy.md)).
- **Sin denormalizar relaciones** que se pueden navegar. Si en algún momento hace
  falta un dato "congelado" (snapshot histórico), se diseña explícitamente y se
  documenta el porqué.

## Dependencias

```
S0 fork/rebrand
  └─ S1 plan + permisos + roles vet
       ├─ S2 especies/razas ── S3 pacientes ──┬─ S5 citas/agenda
       │                                      ├─ S6 historia clínica (consultas SOAP)
       │                                      │    ├─ S7 vacunas + desparasitación (+ stock)
       │                                      │    └─ S8 prescripciones · procedimientos · diagnósticos
       │                                      └─ S9 portal público "solicita tu cita"
       ├─ S4 servicios veterinarios ──────────┘   (S5 referencia S4 de forma opcional)
       └─ S10 reportes clínicos + dashboard vet
S11 hospitalización · documentos · laboratorio   (v1.1, fuera del MVP)
S12 release gate de la vertical
```

### MVP vendible

**S0 → S10**, con **S12** (gate) al cierre.

- **S9 (portal público)** es MVP solo si la clínica quiere presencia web con
  captación de citas online. Si no, se difiere sin bloquear nada (el resto no
  depende de S9).
- **S11** es ampliación v1.1.

Ruta feliz que el MVP tiene que soportar:
**web → solicitud de cita → lead → recepción agenda → consulta SOAP →
vacuna (baja stock) → receta PDF → dashboard.**

---

## S0 — Fork y rebranding

| | |
|---|---|
| **Datos** | ninguno |
| **Backend** | `.env` de la vet (dominios, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, `CORS_EXTRA_ORIGINS`); limpiar branding heredado en `config/cors.php` hardcodes, seeders de demo |
| **Frontend** | `NEXT_PUBLIC_*` de la vet; `login-form` `demoUsers` → usuarios vet; `metadataBase`/`sitemap`/`robots`/`site.ts`; `logo.tsx` + `icon`/`apple-icon`/`og`; paleta si el cliente la pide (si no, se mantiene el verde SaaS); wordmark |
| **Permisos** | ninguno |
| **Tests** | baseline completo en la rama (`scripts/baseline.ps1`) |
| **Criterios de aceptación** | baseline 100% verde en `vertical/veterinaria`; no queda ninguna referencia a "CRM+Inventario"/"VetDemo" en marketing ni en el shell |

---

## S1 — Plan de la vertical + catálogo de permisos + roles

| | |
|---|---|
| **Datos** | data-migration idempotente (patrón `2026_09_07_000004_add_clients_delete_permission`): agrega los permisos vet a `permissions` y los asigna a roles. Permisos: `services.manage`, `patients.manage`, `appointments.manage`, `medical_records.manage`, `vaccinations.manage`, `prescriptions.manage`, `procedures.manage`, `clinical_reports.view` |
| **Backend** | `DatabaseSeeder`: roles nuevos **Veterinario/a** (dashboard + todos los `*.manage` clínicos + `clients.manage` + `patients.manage` + `services.manage`) y **Recepción** (dashboard, `clients.manage`, `patients.manage`, `services.manage`, `appointments.manage`, `orders.manage`). `Ventas`/`Inventario` se mantienen |
| **Frontend** | `admin-shell.tsx`: `PREMIUM_INFO` copy vet; `roles/[id]` `PERMISSION_LABEL` con los permisos clínicos. **No se agrega el grupo "Clínica" todavía** (aparecería vacío). `lib/plan.ts` `BASE_PLAN_HIDDEN` de la vet: oculta `/app/deals`, `/app/reportes-comerciales`, y `/app/transferencias` si el cliente tiene una sola sede |
| **Permisos** | los 8 nuevos, definidos y seedeados |
| **Tests** | `VetPermissionsTest` (patrón `RolePermissionsTest`): `/api/permissions` lista los 8; el rol Veterinario los tiene; el rol Recepción NO tiene `medical_records.manage` |
| **Criterios de aceptación** | Deals/reportes-comerciales ocultos; login demo con Veterinario y Recepción funciona con sus permisos; el nav no muestra grupos vacíos |

**Toca core-adyacente:** `lib/plan.ts` sets y `PERMISSION_LABEL` — *dato de
dominio* en archivos core, edición esperada, no modificación del mecanismo.

---

## S2 — Catálogos: Especies y Razas

| | |
|---|---|
| **Datos** | `species` (`company_id`, `name`, `status`; unique `(company_id,name)`). `breeds` (`company_id`, `species_id` FK **RESTRICT**, `name`, `status`; unique `(company_id,species_id,name)`; índice `(company_id,species_id)`) |
| **Backend** | `Species`, `Breed` models. `SpeciesController`, `BreedController` extends `BaseCrudController` (`$filterable = ['species_id'=>'species_id']` en breeds). `StoreSpeciesRequest`, `StoreBreedRequest` (`species_id` → `Rule::exists('species','id')->where('company_id', …)`). Resources. Rutas `apiResource` con `can:patients.manage` |
| **Frontend** | `app/app/especies/page.tsx`, `app/app/razas/page.tsx` — configs de `ModuleTablePage`. Razas: columna especie + `CrudField` select `optionsResource: 'species'`. `lib/types.ts` +`Species` +`Breed`. **Nav: se crea el grupo "Clínica"** con estos 2 items (primer contenido visible del grupo) |
| **Permisos** | `patients.manage` |
| **Tests** | `SpeciesBreedTest`: CRUD de ambos; `breed` con `species_id` de otra empresa → 422; unique scoped; borrar especie con razas → 422 |
| **Criterios de aceptación** | alta/edición de especies y razas; razas se filtran por especie; no se puede borrar una especie en uso; el grupo "Clínica" aparece en el menú |

---

## S3 — Pacientes / Mascotas

| | |
|---|---|
| **Datos** | `patients` (`company_id`, `client_id` FK **RESTRICT** [propietario], `species_id` FK **RESTRICT**, `breed_id` FK nullOnDelete, `name`, `sex` string [`male`/`female`/`unknown`], `birth_date` nullable, `weight` decimal nullable, `microchip` string nullable unique `(company_id,microchip)`, `sterilized` bool default false, `photo_url` string nullable [server-only], `status`, `deleted_at`). Índices `(company_id,client_id)`, `(company_id,species_id)` |
| **Backend** | `Patient` model `use SoftDeletes` + relación `client()`. `PatientController` extends `BaseCrudController` + `photo` upload (patrón `ProductController::image`, path `patients/{companyId}/`) + `restore`. `StorePatientRequest`: `client_id`/`species_id`/`breed_id` exists+company; `breed` debe pertenecer a `species`. `PatientResource` (incluye el propietario resuelto). Ruta `can:patients.manage`. `ClientController::history` +sección "mascotas" |
| **Frontend** | `app/app/pacientes/page.tsx` (`ModuleTablePage`), `app/app/pacientes/[id]/page.tsx` (ficha: datos + tabs vacíos para historia/vacunas/citas). Selector propietario `optionsResource: 'clients'`. `clientes/[id]` lista sus mascotas. `lib/types.ts` +`Patient`. Nav: "Pacientes" en "Clínica" |
| **Permisos** | `patients.manage` |
| **Tests** | `PatientTest`: CRUD; `client_id`/`breed_id` de otra empresa → 422; `breed` de otra especie → 422; `destroy` → `deleted_at` set, no aparece en index, sí en auditoría; `restore`; foto en `patients/{companyId}/` y aislada |
| **Criterios de aceptación** | alta de mascota ligada a un propietario existente; ficha de la mascota; el propietario ve sus mascotas en su detalle; "borrar" es soft-delete y recuperable |

---

## S4 — Servicios veterinarios

Separa el **servicio que presta la clínica** del **producto físico del
inventario**. `Service` es una entidad nueva del vertical, no una conversión de
`Product`.

| | |
|---|---|
| **Datos** | `services` (`company_id`, `name`, `description` text nullable, `type` string nullable [`consulta`/`vacunacion`/`cirugia`/`curacion`/`hospitalizacion`/`peluqueria`/`otro`], `estimated_duration_minutes` uint nullable, `price` decimal(12,2) default 0, `status` [`active`/`inactive`]). Unique `(company_id,name)`. Índice `(company_id,status)` |
| **Backend** | `Service` model. `ServiceController` extends `BaseCrudController` (`$searchable=['name']`, `$filterable=['status'=>'status','type'=>'type']`). `StoreServiceRequest` (`name` required, `price` numeric ≥ 0, `type` in-lista o nullable, `estimated_duration_minutes` integer nullable ≥ 0). `ServiceResource`. Ruta `apiResource` con `can:services.manage`. Seeder: sembrar los servicios de ejemplo (Consulta general, Consulta especializada, Vacunación, Desparasitación, Cirugía, Curación, Hospitalización, Peluquería/Baño) |
| **Frontend** | `app/app/servicios/page.tsx` — config de `ModuleTablePage` (columnas nombre/tipo/duración/precio/estado; `CrudField` para todos). `lib/types.ts` +`Service`. Nav: "Servicios" en "Clínica" |
| **Permisos** | `services.manage` |
| **Tests** | `ServiceTest`: CRUD; `price` negativo → 422; unique scoped; aislamiento por empresa; borrar servicio en uso por una cita → 422 (FK RESTRICT desde `appointments.service_id`) |
| **Criterios de aceptación** | alta/edición del catálogo de servicios con precio y duración; los servicios sembrados aparecen; el catálogo alimenta el selector de la cita (S5) |

---

## S5 — Citas / Agenda

| | |
|---|---|
| **Datos** | `appointments` (`company_id`, `patient_id` FK **RESTRICT**, `service_id` FK **RESTRICT** nullable [servicio solicitado, opcional], `practitioner_id` FK users nullOnDelete, `starts_at`, `ends_at`, `duration_minutes` uint, `resource` string nullable [box/consultorio], `reason` string nullable, `status` string [`scheduled`/`confirmed`/`attended`/`no_show`/`cancelled`], `notes` text nullable). **Sin `client_id`** — el propietario se navega por `Appointment → Patient → Client`. Índices `(company_id,starts_at)`, `(company_id,practitioner_id,starts_at)`, `(company_id,status)` |
| **Backend** | `Appointment` model con relaciones `patient()`, `service()`, `practitioner()`, y accessor `client()` vía `patient` (`hasOneThrough` o `$appends`). `AppointmentController` extends `BaseCrudController` + acciones `confirm`/`cancel`/`markAttended`/`markNoShow` (transición de `status`, auditada). `StoreAppointmentRequest`: `patient_id`/`service_id` exists+company; `starts_at < ends_at`; `status` en la lista; si viene `service_id` y no `duration_minutes`, tomar `estimated_duration_minutes` del servicio. `AppointmentResource` incluye el propietario resuelto (para no obligar al frontend a un segundo request). Rutas `can:appointments.manage` |
| **Frontend** | `app/app/citas/page.tsx` (`ModuleTablePage` + filtros fecha/estado/profesional; columna propietario viene resuelta en el resource), `app/app/agenda/page.tsx` (vista día/semana sobre appointments — la vet usa esto en vez del "Calendario" core). Selector de servicio `optionsResource: 'services'`. Acciones de estado como `extraRowActions`. `lib/types.ts` +`Appointment`. Nav: "Citas" y "Agenda" |
| **Permisos** | `appointments.manage` |
| **Tests** | `AppointmentTest`: CRUD; `patient_id`/`service_id` de otra empresa → 422; `starts_at >= ends_at` → 422; cada transición de estado; index filtra por rango de fechas; el propietario correcto viene en el resource sin `client_id` en la tabla |
| **Criterios de aceptación** | agendar una cita (mascota + servicio opcional + profesional + horario + box); ver la agenda del día con el propietario visible; marcar confirmada/atendida/no asistió/cancelada |

---

## S6 — Historia clínica / Consultas (SOAP)

| | |
|---|---|
| **Datos** | `consultations` (`company_id`, `patient_id` FK **RESTRICT**, `appointment_id` FK nullOnDelete, `vet_id` FK users nullOnDelete, `date`, `reason` string, `weight` decimal nullable, `temperature` decimal nullable, `subjective`/`objective`/`assessment`/`plan` text nullable, `deleted_at`). Índice `(company_id,patient_id,date)` |
| **Backend** | `Consultation` model `use SoftDeletes`. `ConsultationController` (+ `restore`). Si se crea desde una cita, marca la cita `attended` (dentro de `DB::transaction`). `StoreConsultationRequest`: `patient_id`/`appointment_id` exists+company. Resource. `can:medical_records.manage` |
| **Frontend** | Tab "Historia clínica" en `pacientes/[id]` (timeline de consultas, más reciente primero), `app/app/consultas/[id]/page.tsx` (detalle SOAP + editar). Botón "Nueva consulta" desde la ficha y desde una cita. `lib/types.ts` +`Consultation` |
| **Permisos** | `medical_records.manage` (Recepción NO lo tiene) |
| **Tests** | `ConsultationTest`: CRUD; ligada a paciente de la empresa; `destroy` → soft-delete + auditoría; crear desde cita → cita pasa a `attended`; timeline ordenado por fecha desc |
| **Criterios de aceptación** | registrar una consulta SOAP para una mascota; verla en su historia clínica; editarla; "borrar" = soft-delete |

---

## S7 — Vacunas y Desparasitaciones (acto clínico + stock)

Se mantiene la separación **`Product` de inventario ≠ `ClinicalApplication` acto
clínico**.

**Estrategia de lotes (MVP):** `lot` y `expires_at` se registran **manualmente en
el acto clínico**. Si viene `product_id`, se genera el movimiento de stock
(descuento total sobre ese producto, como el core hace hoy).

**Evolución futura (no en el MVP):** inventario por lote/vencimiento — una tabla
`product_lots` (o `stock_batches`), y la aplicación clínica selecciona un lote
real; el movimiento descuenta ese lote específico. **No se implementa ahora**
porque el core todavía no maneja lotes; hacerlo sería sobrearquitectura del MVP.
Anotado como deuda consciente en la sección final.

| | |
|---|---|
| **Datos** | `clinical_applications` (`company_id`, `type` string [`vaccine`/`deworming`], `patient_id` FK **RESTRICT**, `product_id` FK nullOnDelete [ítem del inventario, opcional], `consultation_id` FK nullOnDelete, `name` string, `applied_at`, `lot` string nullable, `expires_at` date nullable, `next_due_at` nullable, `vet_id` FK users nullOnDelete, `stock_movement_id` FK nullOnDelete [si descontó stock], `deleted_at`). Índices `(company_id,type,next_due_at)`, `(company_id,patient_id)` |
| **Backend** | `ClinicalApplication` model `use SoftDeletes`. `ClinicalApplicationController` + `StoreClinicalApplicationRequest`. Al crear con `product_id`: `DB::transaction` → crea `StockMovement` tipo `out` (patrón `OrderController::confirm`), guarda su id. `soft-delete` **no** revierte el stock automáticamente (se hace ajuste manual — documentado). `VaccinationDueController` (`__invoke`, read-only, patrón `StockAlertController`): aplicaciones con `next_due_at <= ?`. Rutas `can:vaccinations.manage` |
| **Frontend** | `app/app/vacunas/page.tsx` (filtro por tipo), tab en `pacientes/[id]`, `app/app/vacunas-pendientes/page.tsx` (próximas por vencer). Card en el dashboard (S10). `lib/types.ts` +`ClinicalApplication` |
| **Permisos** | `vaccinations.manage` |
| **Tests** | `ClinicalApplicationTest`: aplicar con `product_id` descuenta stock (movimiento `out` creado, `stock_movement_id` guardado); sin `product_id` no toca stock; `lot`/`expires_at` se guardan tal cual; `next_due_at` alimenta la vista de pendientes; soft-delete no revierte stock; aislamiento por empresa |
| **Criterios de aceptación** | registrar una vacuna/desparasitación aplicada a una mascota, con lote y vencimiento manuales; si es un producto del inventario, baja el stock; ver "vacunas por vencer" |

---

## S8 — Prescripciones · Procedimientos · Diagnósticos

| | |
|---|---|
| **Datos** | `prescriptions` (`company_id`, `consultation_id` FK **RESTRICT**, `patient_id`, `vet_id` FK users nullOnDelete, `notes` text nullable, `deleted_at`) + `prescription_items` (`prescription_id` FK cascade, `product_id` FK nullOnDelete, `medication_name`/`sku` snapshot, `dosage`, `frequency`, `duration`). `procedures` (`company_id`, `patient_id` FK **RESTRICT**, `service_id` FK nullOnDelete [opcional], `type` string, `performed_at`, `vet_id` FK users nullOnDelete, `notes` text nullable, `consent_document_url` string nullable, `deleted_at`). `diagnoses` (`company_id`, `code` string nullable, `name`, `status`) + `consultation_diagnosis` pivot |
| **Backend** | 3 controllers + requests + resources (patrón line-items = `QuoteController`). Receta imprimible: `PrescriptionController::pdf` (patrón `ExportController` + dompdf). `can:prescriptions.manage` / `can:procedures.manage` / `can:medical_records.manage` (diagnósticos) |
| **Frontend** | Tabs en `pacientes/[id]` (recetas, procedimientos), páginas de lista, botón "Imprimir receta" (PDF). Adjuntar consentimiento (patrón file upload). `lib/types.ts` +tipos |
| **Permisos** | `prescriptions.manage`, `procedures.manage` |
| **Tests** | `PrescriptionTest` (CRUD + items con snapshot + PDF responde 200 `application/pdf`), `ProcedureTest` (CRUD + adjunto aislado por empresa), `DiagnosisTest` (catálogo + pivot) |
| **Criterios de aceptación** | emitir una receta desde una consulta e imprimirla en PDF; registrar un procedimiento con consentimiento adjunto; asociar diagnósticos a una consulta |

---

## S9 — Portal público "Solicita tu cita"

El flujo público **no crea una cita confirmada**. Solo genera un lead; recepción
revisa disponibilidad y agenda.

```
Formulario público  →  Lead (source=appointment)  →  Recepción revisa  →  Recepción crea/confirma el Appointment
```

| | |
|---|---|
| **Datos** | ninguno nuevo (usa `leads`) |
| **Backend** | `PublicAppointmentController` (patrón `PublicCatalogController`: sin auth, CSRF-exento en `api/public/*`, rate limiter nombrado `appointment-request` 5/min por IP). Crea un `Lead` con `source=appointment` y los datos de mascota + servicio de interés + fecha/franja preferida (en campos del lead o en `message`). **No** crea `Appointment`. `StorePublicAppointmentRequest`: honeypot + validación estricta + `consent` (Ley 1581) |
| **Frontend** | `app/solicitar-cita/page.tsx` (público, `MarketingLayout`): datos de contacto + mascota + motivo/servicio + fecha/franja preferida. Copy explícito: **"la clínica confirmará disponibilidad y te contactará"**. Link "Solicita tu cita" en el header de marketing. Los leads caen en `/app/leads` con `source=appointment` |
| **Permisos** | ninguno (público) |
| **Tests** | `PublicAppointmentTest`: crea `Lead` con `source=appointment`; **no** crea ningún `Appointment`; honeypot lleno → descartado silenciosamente; throttle 5/min; sin `consent` → 422; resuelve la única empresa, no filtra datos entre empresas |
| **Criterios de aceptación** | un visitante solicita una cita desde el sitio; recibe un mensaje claro de que la clínica confirmará; aparece como lead `source=appointment` para que recepción lo agende manualmente |

---

## S10 — Reportes clínicos + Dashboard veterinario

| | |
|---|---|
| **Datos** | ninguno |
| **Backend** | `ClinicalReportController` (`__invoke` + métodos, read-only aggregates): pacientes atendidos por período, vacunas/desparasitaciones aplicadas, ocupación de agenda (citas por estado/profesional), ingresos por servicio (de `orders`/`services`/`consultations`). `DashboardController`: métricas vet (citas hoy, pacientes activos, vacunas por vencer, ingresos del mes). Rutas `can:clinical_reports.view` / `can:reports.view` |
| **Frontend** | `app/app/reportes-clinicos/page.tsx`; `dashboard/page.tsx` re-hecho con las KPIs vet (los componentes de gráfico `Recharts` se reutilizan; ver skill `dashboard-charts`). Ocultar del dashboard lo que ya no aplica (deals) |
| **Permisos** | `clinical_reports.view` |
| **Tests** | `ClinicalReportTest` (shape + métricas correctas con datos sembrados), `DashboardTest` actualizado |
| **Criterios de aceptación** | el dashboard muestra métricas veterinarias reales; reporte mensual de pacientes atendidos y vacunas aplicadas; ingresos por servicio |

**Toca core-adyacente:** `DashboardController` y `dashboard/page.tsx` — se
reescriben las métricas (dato de dominio), no el mecanismo. Si aparece un bug del
motor de agregación, se corrige también en `master`.

---

## S11 — Hospitalización · Documentos · Laboratorio  (v1.1, fuera del MVP)

| | |
|---|---|
| **Datos** | `hospitalizations` (`patient_id` FK RESTRICT, `service_id` FK nullOnDelete, `admitted_at`, `discharged_at` nullable, `resource`, `status`, `deleted_at`) + `hospitalization_notes` (evoluciones, append-only + autor). `clinical_documents` (`patient_id`, `type`, `file_url`). `lab_results` (`patient_id`, `consultation_id` nullOnDelete, `name`, `file_url`, `values` json nullable) |
| **Backend** | 3 controllers + requests + resources; file upload por empresa (patrón `ProductController::image`) |
| **Frontend** | tabs en `pacientes/[id]`; páginas de lista |
| **Permisos** | `medical_records.manage` (documentos/lab), permiso nuevo `hospitalization.manage` |
| **Tests** | CRUD + adjuntos aislados + soft-delete donde aplica |
| **Criterios de aceptación** | internar y dar de alta un paciente con evoluciones; adjuntar resultados de laboratorio a una consulta |

---

## S12 — Release gate de la vertical

Ejecutar el release gate del orquestador
(`~/.claude/skills/project-reuse-orchestrator/references/release-gate.md`) completo:

- Migraciones limpias desde #1 en **SQLite y MySQL/MariaDB**.
- Suite backend verde en ambos motores.
- `pint`, `tsc`, `npm run build`.
- Permisos: cada endpoint clínico nuevo chequea su permiso; el nav esconde lo que el rol no puede usar; ningún grupo de nav vacío.
- Integridad referencial: FKs clínicas revisadas (RESTRICT / SET NULL / snapshot, nunca CASCADE hacia historia clínica).
- Soft-delete verificado en todos los módulos de nivel 4.
- **E2E Playwright** (flujo crítico): solicitud pública → lead → recepción agenda cita → confirmar → consulta SOAP → aplicar vacuna (baja stock) → emitir receta PDF → dashboard refleja la actividad. Más el flujo offline de contingencia si se habilita para módulos vet.
- `verifier` / `comprehensive-review:full-review` sobre el diff acumulado de la rama vs `core-base-estable`.
- Checklist de infra: `APP_DEBUG=false`, dominios/CORS/Sanctum, SMTP real (reset de password), backup de BD + plan de rollback.

**Estado final:** `READY` / `NEEDS FIXES` / `BLOCKED` con el reporte del
orquestador.

---

## Deuda consciente (no bloquea el MVP)

- **Inventario por lote/vencimiento** — el MVP registra `lot`/`expires_at` a mano
  en el acto clínico (S7). La evolución (tabla `product_lots`, descuento por lote
  real) se hace cuando el core maneje lotes, no antes.
- **Multitenancy manual** — OK para 1 deploy por clínica ([`multitenancy.md`](multitenancy.md)).
- **Stock = `SUM(stock_movements)` sin cache** — una clínica chica no lo nota.
- **`MAIL_MAILER=log`** en la config prod documentada — configurar SMTP en el gate (S12).
- **Endpoints públicos sin CAPTCHA** — S9 agrega honeypot; evaluar CAPTCHA si hay abuso.
- **Soft-delete de `ClinicalApplication` no revierte el movimiento de stock** — se
  corrige con un ajuste manual; documentado en S7.

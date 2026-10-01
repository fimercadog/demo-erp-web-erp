# Reporte de Verificación y Corrección Adversarial Backend Veterinario (Fase 1C + Fase 2)

**Fecha de actualización:** 16 de septiembre de 2026
**Rama Git:** `veterinaria`
**Base de datos:** SQLite (en memoria / testing)
**Resultado Suite Adversarial Final:** `10 passed (36 assertions)`
**Resultado Suite Completa Backend Final:** `270 passed (1010 assertions)`

---

## 1. Resumen General

Se completó la **FASE 2: CORRECCIÓN BACKEND VETERINARIO**, subsanando los 7 hallazgos detectados durante la Fase 1C sin introducir regresiones en los 260 tests unitarios y de integración originales del ERP Core y el módulo veterinario.

---

## 2. Detalle de Correcciones Aplicadas por Hallazgo

### C-03: Aislamiento Multiempresa de `warehouse_id`
- **Causa Raíz:** En `VeterinaryConsultationService::finalize`, el valor enviado en `$data['warehouse_id']` no se validaba contra el `company_id` de la consulta ni del usuario autenticado.
- **Corrección Aplicada:** Se agregó la consulta de verificación `Warehouse::where('company_id', $companyId)->find(...)` y aborto con HTTP 422 si la bodega no existe o pertenece a otra empresa.
- **Archivos Modificados:**
  - `backend/app/Services/VeterinaryConsultationService.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_c03_warehouse_de_otra_company_rejected` (`PASS`)

---

### A-01: Validación Estricta de `ConsultationItem`
- **Causa Raíz:** El método `addItem` en `VeterinaryConsultationService` no validaba que `quantity > 0` ni que `unit_price >= 0`, permitiendo registrar items con valores negativos. Tampoco validaba explícitamente la pertenencia multiempresa de los productos/servicios/procedimientos asociados.
- **Corrección Aplicada:** Se agregaron cláusulas `abort_if($quantity <= 0, 422)` y `abort_if($unitPrice < 0, 422)`, además de validar `company_id` en las consultas Eloquent de `Product`, `Service` y `Procedure`.
- **Archivos Modificados:**
  - `backend/app/Services/VeterinaryConsultationService.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_a01_cantidades_y_precios_negativos_rejected` (`PASS`)

---

### A-05: Máquina de Estados de Consultas
- **Causa Raíz:** `VeterinaryConsultationService::finalize` únicamente verificaba `abort_if($status === 'completed')`, permitiendo que consultas en estado `cancelled` transicionaran a `completed` y generaran facturas e inventario.
- **Corrección Aplicada:** Se restringió la finalización exclusivamente a consultas con `status === 'open'`, abortando con HTTP 422 en cualquier otro estado.
- **Archivos Modificados:**
  - `backend/app/Services/VeterinaryConsultationService.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_a05_finalizar_cancelled_rejected` (`PASS`)

---

### A-02: Inmutabilidad de Consultas Finalizadas/Canceladas
- **Causa Raíz:** `ConsultationController` heredaba el método `destroy` de `BaseCrudController`, el cual permitía la eliminación física/soft-delete de consultas finalizadas (`completed`) sin restricciones.
- **Corrección Aplicada:** Se sobrescribió `destroy` en `ConsultationController` para bloquear la eliminación (`DELETE`) de consultas con estado `completed` o `cancelled` (HTTP 422), preservando la inmutabilidad de la historia clínica. Se actualizó `update` para proteger también consultas canceladas.
- **Archivos Modificados:**
  - `backend/app/Http/Controllers/Api/ConsultationController.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_a02_modificacion_y_eliminacion_de_completed_rejected` (`PASS`)

---

### A-04: Efectivo y Control de Sesión de Caja
- **Causa Raíz:** `PaymentService::register` permitía registrar pagos con método `cash` omitiendo `cash_session_id`, liquidando cuentas por cobrar (CxC) sin generar el correspondiente movimiento de caja (`CashMovement`).
- **Corrección Aplicada:** Se agregó la validación obligatoria en `PaymentService::register`: si `method === 'cash'`, `cash_session_id` es requerido, debe pertenecer a la misma empresa y estar en estado `open`.
- **Archivos Modificados:**
  - `backend/app/Services/PaymentService.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_a04_efectivo_sin_cash_session_id_rejected` (`PASS`)

---

### A-03: Autorización para Efectos ERP y Pagos Directos
- **Causa Raíz:** No existía diferenciación entre la finalización clínica y el registro de cobros/pagos directos en el controlador.
- **Corrección Aplicada:** Se mantuvo que el permiso `medical_records.manage` permita la atención clínica y la emisión interna automática de factura/consumo de inventario. No obstante, si el payload incluye la estructura `payment` para cobro inmediato en caja, `ConsultationController::finalize` exige obligatoriamente los permisos ERP de caja/pagos (`payments.manage` o `cash.manage`), retornando HTTP 403 Forbidden si el usuario carece de ellos.
- **Archivos Modificados:**
  - `backend/app/Http/Controllers/Api/ConsultationController.php`
  - `backend/tests/Feature/VeterinaryAdversarialVerificationTest.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_a03_permisos_para_efectos_erp` (`PASS`)

---

### C-02: Precisión Decimal en Cantidades e Inventario
- **Causa Raíz:**
  1. `ErpTotals::calculate` casteaba `$quantity` a `(int)`.
  2. `InvoiceService::snapshotItems` casteaba `'quantity'` a `(int)`.
  3. `Product::stockOnHand` tenía firma de retorno `: int` y casteo `(int)`.
  4. La migración `stock_movements` definía la columna `quantity` como `integer`.
- **Corrección Aplicada:**
  - Se cambió el casteo de cantidad a `(float)` en `ErpTotals` e `InvoiceService`.
  - Se actualizó `Product::stockOnHand` para retornar `int|float` (manteniendo compatibilidad estricta con `assertSame` en números enteros y soportando flotantes en fraccionados).
  - Se agregó el casteo `'quantity' => 'float'` en `StockMovement` y `ConsultationItem`.
  - Se modificó la columna `quantity` en la migración `stock_movements` a `decimal(12, 4)`.
- **Archivos Modificados:**
  - `backend/app/Services/ErpTotals.php`
  - `backend/app/Services/InvoiceService.php`
  - `backend/app/Models/Product.php`
  - `backend/app/Models/StockMovement.php`
  - `backend/app/Models/ConsultationItem.php`
  - `backend/database/migrations/2026_09_05_000010_create_stock_movements_table.php`
- **Test de Regresión:** `VeterinaryAdversarialVerificationTest::test_c02_cantidades_decimales_0_5_1_5_2_75` (`PASS`)

---

## 3. Matriz Final de Resultados

| Caso | Descripción | Resultado Inicial | Resultado Final | Estado |
|---|---|---|---|---|
| **C-01** | Bypass de status=completed | ✓ PASSED | ✓ PASSED | NO REPRODUCIBLE / SEGURO |
| **C-02** | Cantidades 0.5, 1.5 y 2.75 | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **C-03** | Warehouse de otra company | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **C-04** | Idempotencia | ✓ PASSED | ✓ PASSED | NO REPRODUCIBLE / SEGURO |
| **C-05** | Doble consumo de stock | ✓ PASSED | ✓ PASSED | NO REPRODUCIBLE / SEGURO |
| **A-01** | Cantidades/precios negativos | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **A-02** | Modificación/eliminación de completed | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **A-03** | Permisos para efectos ERP | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **A-04** | Efectivo sin cash_session_id | ⨯ FAILED | ✓ PASSED | CORREGIDO |
| **A-05** | Finalizar cancelled | ⨯ FAILED | ✓ PASSED | CORREGIDO |

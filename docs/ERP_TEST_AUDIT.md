# AUDITORÍA DE PRUEBAS AUTOMATIZADAS Y COBERTURA E2E

> **Fecha:** 26 de Septiembre de 2026  
> **Resultado de la Suite de PHPUnit:** **289 Pruebas Aprobadas, 1155 Aserciones, 0 Fallos.**

---

## 1. Inventario de Archivos de Prueba Automatizados (PHPUnit Feature Tests)

| Archivo de Prueba (`tests/Feature/`) | Cantidad Tests | Cobertura Funcional de Código |
|---|:---:|---|
| `AccountsReceivablePayableTest.php` | 3 | Cuentas por Cobrar, Cuentas por Pagar, Cálculo de Antigüedad Aging 30/60/90/91+. |
| `AppointmentTest.php` | 10 | Creación de citas, validación de fechas, choques por médico/veterinario, estados. |
| `AppointmentEngineTest.php` | 4 | Motor de citas transversal, agendamiento de Clientes directos, choques por recurso/cancha, auto-bill. |
| `BatchManagementTest.php` | 4 | Creación de lotes, fecha de caducidad, valuación, reporte de vencimiento, trazabilidad. |
| `BranchManagementTest.php` | 4 | Creación de sedes, regla de sede principal, asignación de usuarios y resolución de sede activa. |
| `ClinicalApplicationTest.php` | 3 | Registro y control de aplicaciones clínicas y esquemas de vacunación. |
| `ConsultationTest.php` | 4 | Historias clínicas, consultas, asociación de diagnósticos y recetas. |
| `ContingencyTest.php` | 3 | Activación, estado y desactivación del Modo Contingencia Offline. |
| `CreditDebitNoteTest.php` | 3 | Emisión de Notas Crédito y Débito, reversión contable y ajuste de inventario. |
| `ErpFlowTest.php` | 1 | Flujo integrado ERP: Cliente $\rightarrow$ Cotización $\rightarrow$ Pedido $\rightarrow$ Factura $\rightarrow$ CxC $\rightarrow$ Pago. |
| `ExportTest.php` | 2 | Exportación masiva de recursos a formatos CSV y PDF. |
| `InvoiceTest.php` | 5 | Emisión de facturas, anulación, cálculo de subtotales e impuestos. |
| `OrderTest.php` | 4 | Pedidos de venta, reservación de ítems y conversión. |
| `PatientTest.php` | 5 | Registro de pacientes, borrado lógico, historial y restauración. |
| `PayrollFlowTest.php` | 3 | Liquidación de nómina, cálculo de netos, devengados, deducciones e integración CxP/Caja. |
| `PortalAppointmentTest.php` | 10 | Autenticación mágica del cliente/dueño, auto-agendamiento, reagendamiento y cancelación. |
| `ProductBatchControllerTest.php` | 4 | Endpoints API de gestión de lotes de inventario. |
| `PropertyLeaseFlowTest.php` | 4 | Contratos de arriendo, liquidación de cánones mensuales, CxC e ingreso a caja. |
| `PublicAppointmentTest.php` | 6 | Captura pública de prospectos/leads desde la landing web. |
| `PublicSchedulingTest.php` | 1 | Agendamiento público de citas confirmado. |
| `PurchaseOrderTest.php` | 4 | Órdenes de compra, costos de proveedores e ítems. |
| `PurchaseReceiptTest.php` | 3 | Recepción de mercancía física e incremento automático de kardex. |
| `QuoteTest.php` | 4 | Elaboración de cotizaciones y conversión. |
| `ReferentialIntegrityTest.php` | 2 | Protección contra eliminación de productos con historial transaccional. |
| `ReturnsTest.php` | 2 | Devoluciones de ventas (re-stock + nota crédito) y devoluciones de compras (baja de stock + ajuste CxP). |
| `RolePermissionsTest.php` | 4 | Asignación de roles, permisos Spatie y catálogo de permisos. |
| `ServiceTest.php` | 6 | Tarifario de servicios, precios y aislamiento multi-tenant. |
| `SpeciesBreedTest.php` | 6 | Especies, razas y validación de relaciones. |
| `SportsSchoolFlowTest.php` | 5 | Alumnos, categorías/equipos, matriculas, asistencias y tienda de uniformes. |
| `StockMovementValidationTest.php` | 1 | Signos y validación de movimientos kardex. |
| `StockTransferTest.php` | 5 | Transferencia entre bodegas, rechazo por stock insuficiente y alertas. |
| `SubscriptionManagementTest.php` | 4 | Crear planes, ciclo de vida de suscripción (pausa/resume/cancel), cobro recurrente automático y comando Artisan. |
| `TechnicalLoggingTest.php` | 11 | ID de Request, santitizado de contraseñas, auditoría inalterable y registros de error. |
| `TenancyResolutionTest.php` | 2 | Resolución del inquilino `Company` e independización de datos. |
| `UserManagementTest.php` | 12 | CRUD de usuarios, contraseñas temporales y aislamiento por empresa. |
| `VetPermissionsTest.php` | 5 | Permisos clínicos por rol (Médico, Recepción, Admin). |
| `WhatsAppGoldenPathTest.php` | 4 | Webhook de WhatsApp, Bot de atención con reconocedor de intenciones. |

---

## 2. Matriz de Cobertura E2E (End-to-End)

| Flujo Funcional | E2E Existente | Resultado | Cobertura Funcional |
|---|:---:|:---:|---|
| **Autenticación & RBAC** | ✅ Sí | PASS | Login, tokens Sanctum, permisos de menú y roles. |
| **Cliente / CRM** | ✅ Sí | PASS | Prospecto $\rightarrow$ Lead $\rightarrow$ Cliente $\rightarrow$ Contactos $\rightarrow$ Notas. |
| **Producto / Inventario** | ✅ Sí | PASS | Producto $\rightarrow$ Lote FEFO/FIFO $\rightarrow$ Kardex $\rightarrow$ Transferencia. |
| **Compra & Recepción** | ✅ Sí | PASS | Proveedor $\rightarrow$ Orden de Compra $\rightarrow$ Recepción $\rightarrow$ Entra a Stock $\rightarrow$ CxP. |
| **Venta & Facturación** | ✅ Sí | PASS | Cliente $\rightarrow$ Cotización $\rightarrow$ Pedido $\rightarrow$ Factura $\rightarrow$ Salida Stock. |
| **CxC & Cobranza** | ✅ Sí | PASS | Factura $\rightarrow$ Cuenta por Cobrar $\rightarrow$ Recibo de Pago $\rightarrow$ Ingreso Caja. |
| **Devolución Ventas** | ✅ Sí | PASS | Factura $\rightarrow$ Devolución Ventas $\rightarrow$ Re-stock Kardex $\rightarrow$ Nota Crédito. |
| **Devolución Compras** | ✅ Sí | PASS | Recepción $\rightarrow$ Devolución Compras $\rightarrow$ Baja Kardex $\rightarrow$ Ajuste CxP. |
| **Suscripciones Recurrentes** | ✅ Sí | PASS | Plan $\rightarrow$ Suscripción $\rightarrow$ Facturación Periódica $\rightarrow$ Factura + CxC. |
| **Agenda de Citas** | ✅ Sí | PASS | Disponibilidad $\rightarrow$ Cita $\rightarrow$ Reagendamiento $\rightarrow$ Asistida $\rightarrow$ Auto-Bill. |
| **Nómina (RRHH)** | ✅ Sí | PASS | Empleados $\rightarrow$ Liquidación Devengados/Deducciones $\rightarrow$ CxP Empleado. |
| **Arriendos (Inmobiliario)** | ✅ Sí | PASS | Propiedad $\rightarrow$ Contrato Arriendo $\rightarrow$ Canon Mensual $\rightarrow$ CxC $\rightarrow$ Recaudo. |
| **Cantera (Fútbol)** | ✅ Sí | PASS | Alumno $\rightarrow$ Inscripción $\rightarrow$ Asistencia Entrenamientos $\rightarrow$ Tienda. |
| **Historias Clínicas (IPS/Vet)**| ✅ Sí | PASS | Cita $\rightarrow$ Consulta Médica $\rightarrow$ Diagnóstico CIE-10 $\rightarrow$ Receta. |
| **Contabilidad Básica** | 🟡 Parcial | PASS | Asientos implícitos en CxC/CxP/Caja (Falta Libro Mayor/Diario automatizado). |

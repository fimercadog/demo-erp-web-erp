# AUDITORÍA DEL ERP CORE TRANSVERSAL

> **Fecha:** 26 de Septiembre de 2026  
> **Evidencia:** Inspección empírica de código (`backend/app/Models`, `Services`, `Controllers`, `routes/api.php`, `database/migrations`, `tests/Feature`, `frontend/src/app`).

---

## 1. Módulos Auditados del ERP Core

| Módulo | Funcionalidad | Evidencia Código Backend | Evidencia Frontend | Evidencia Tests | Estado |
|---|---|---|---|---|---|
| **CRM** | Clientes | `Client.php`, `ClientController.php` | `/app/clientes` | `UserManagementTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Prospectos (Leads) | `Lead.php`, `LeadController.php` | `/app/leads` | `PublicAppointmentTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Oportunidades (Deals) | `Deal.php`, `DealController.php` | `/app/deals` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Actividades | `Activity.php`, `ActivityController.php` | `/app/actividades` | `TechnicalLoggingTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Contactos Secundarios | `Contact.php`, `ContactController.php` | `/app/contactos` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Notas de Cliente | `ClientNote.php`, `ClientNoteController.php` | `/app/notas` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **CRM** | Segmentación | `Segment.php`, `SegmentController.php` | `/app/segmentos` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Cotizaciones | `Quote.php`, `QuoteController.php` | `/app/cotizaciones` | `QuoteTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Pedidos de Venta | `Order.php`, `OrderController.php` | `/app/pedidos` | `OrderTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Facturación Comercial | `Invoice.php`, `InvoiceController.php` | `/app/facturas` | `InvoiceTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Facturación Electrónica | `Invoice.php` (Numeración/Estructura) | `/app/facturas` | `InvoiceTest.php` | 🟡 PARCIAL (Sin DIAN XML directo) |
| **Ventas** | Notas Crédito | `CreditNote.php`, `CreditDebitNoteService` | `/app/facturas` | `CreditDebitNoteTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Notas Débito | `DebitNote.php`, `CreditDebitNoteService` | `/app/facturas` | `CreditDebitNoteTest.php` | 🟢 IMPLEMENTADO |
| **Ventas** | Devoluciones Ventas | `SalesReturn.php`, `ReturnsService` | `/app/facturas` | `ReturnsTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Productos & SKUs | `Product.php`, `ProductController.php` | `/app/productos` | `ProductBatchControllerTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Categorías | `Category.php`, `CategoryController.php` | `/app/categorias` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Marcas | `Brand.php`, `BrandController.php` | `/app/marcas` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Unidades Medida | `Unit.php`, `UnitController.php` | `/app/unidades` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Bodegas Multi-almacén | `Warehouse.php`, `WarehouseController.php` | `/app/bodegas` | `StockTransferTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Kardex / Movimientos | `StockMovement.php`, `StockMovementController` | `/app/movimientos-inventario` | `StockMovementValidationTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Transferencias Bodegas | `StockTransfer.php`, `StockTransferController` | `/app/transferencias` | `StockTransferTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Alertas Stock Mínimo | `StockAlertController.php` | `/app/alertas-stock` | `StockTransferTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Lotes & Caducidad | `ProductBatch.php`, `BatchService.php` | `/app/productos` | `BatchManagementTest.php` | 🟢 IMPLEMENTADO |
| **Inventario** | Salida FEFO / FIFO | `BatchService.php` (Despacho ordenado) | `/app/productos` | `BatchManagementTest.php` | 🟢 IMPLEMENTADO |
| **Compras** | Proveedores | `Supplier.php`, `SupplierController.php` | `/app/proveedores` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Compras** | Órdenes de Compra | `PurchaseOrder.php`, `PurchaseOrderController` | `/app/ordenes-compra` | `PurchaseOrderTest.php` | 🟢 IMPLEMENTADO |
| **Compras** | Recepciones Mercancía | `PurchaseReceipt.php`, `PurchaseReceiptController` | `/app/recepciones-compra` | `PurchaseReceiptTest.php` | 🟢 IMPLEMENTADO |
| **Compras** | Devoluciones Proveedor | `PurchaseReturn.php`, `ReturnsService` | `/app/ordenes-compra` | `ReturnsTest.php` | 🟢 IMPLEMENTADO |
| **Compras** | Matching 3 Vías | No existe verificador de coincidencia | N/A | N/A | ❌ NO IMPLEMENTADO |
| **Finanzas** | Caja & Arqueos | `CashRegister.php`, `CashRegisterController` | `/app/cajas` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Sesiones de Turno | `CashSession.php`, `CashSessionController` | `/app/sesiones-caja` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Movimientos de Caja | `CashMovement.php`, `CashMovementController` | `/app/movimientos-caja` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Recibos y Pagos | `Payment.php`, `PaymentController.php` | `/app/pagos` | `ErpFlowTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Cuentas por Cobrar (CxC)| `AccountReceivable.php`, `AccountsService` | `/app/cuentas-por-cobrar` | `AccountsReceivablePayableTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Cuentas por Pagar (CxP) | `AccountPayable.php`, `AccountsService` | `/app/cuentas-por-pagar` | `AccountsReceivablePayableTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Aging (30/60/90/91+) | `AccountsService.php` (Cálculo de morosidad) | `/app/cuentas-por-cobrar` | `AccountsReceivablePayableTest.php` | 🟢 IMPLEMENTADO |
| **Finanzas** | Conciliación Bancaria | No existe importador de extractos | N/A | N/A | ❌ NO IMPLEMENTADO |
| **Contabilidad**| Contabilidad Básica | Asientos derivados de CxC, CxP y Caja | `/app/reportes-comerciales` | `ErpFlowTest.php` | 🟡 PARCIAL (Sin Libro Mayor/Diario) |
| **Suscripciones**| Cobros Recurrentes | `Subscription.php`, `SubscriptionService` | `/app/facturas` | `SubscriptionManagementTest.php` | 🟢 IMPLEMENTADO |
| **Citas** | Agenda Transversal | `Appointment.php`, `AppointmentService` | `/app/citas` | `AppointmentEngineTest.php` | 🟢 IMPLEMENTADO |
| **Seguridad** | Usuarios & RBAC | `User.php`, `Role.php`, Spatie Permissions | `/app/usuarios`, `/app/roles` | `RolePermissionsTest.php` | 🟢 IMPLEMENTADO |
| **Seguridad** | Multi-Sucursal | `Branch.php`, `BranchService.php` | `/app/configuracion` | `BranchManagementTest.php` | 🟢 IMPLEMENTADO |
| **Auditoría** | Auditoría Operacional | `AuditLog.php`, `AuditLogController.php` | `/app/auditoria` | `TechnicalLoggingTest.php` | 🟢 IMPLEMENTADO |

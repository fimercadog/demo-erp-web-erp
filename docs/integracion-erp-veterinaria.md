# DOCUMENTO DE ARQUITECTURA E INTEGRACIÓN
# ERP VETERINARIO: INTEGRACIÓN CLÍNICA CON NÚCLEO TRANSVERSAL ERP

**Proyecto:** ERP Veterinario (Evolución desde ERP Pyme V1)  
**Rama Git:** `veterinaria` (Base estable: `erp` @ `3d94855`)  
**Fecha de Publicación:** 16 de Septiembre de 2026  
**Entorno de Datos:** SQLite / Transacciones ACID / Multi-Tenant  
**Alcance Fiscal:** Facturación Interna y Administrativa (**Sin Facturación Electrónica DIAN**)

---

## 1. Portada y Resumen Ejecutivo

El presente documento detalla la arquitectura, modelo de datos, servicios transaccionales, flujos de trabajo e interfaces de usuario que componen la integración del módulo de **Historial Clínico Veterinario** sobre el **Núcleo Transversal del ERP Pyme V1**.

La premisa rectora de esta evolución es la no duplicación de lógica: la vertical veterinaria (pacientes, consultas SOAP, procedimientos, recetas, vacunas y desparasitaciones) actúa como consumidor de primera clase de los subsistemas del ERP (Catálogo de Productos y Servicios, Inventario Multibodega, Cuentas por Cobrar, Facturación Administrativa, Sesiones de Caja/Arqueo y Trazabilidad de Auditoría).

---

## 2. Contexto de Partida (ERP Pyme V1)

El desarrollo parte formalmente de la rama `erp` en su commit de auditoría unitaria cerrada (`3d94855`), con un motor ERP funcional que ofrece:
- **Catálogo Unificado:** Productos tangibles (inventariables y no inventariables) y Servicios (intangibles con tarifa y duración).
- **Inventario Inmutable:** Control estricto de existencias a través del ledger `stock_movements`.
- **Facturación Administrativa:** Generación de facturas internas con numeración consecutiva por empresa (`FAC-YYYYMM-XXXX`) y control de vencimientos.
- **Cuentas por Cobrar (CxC):** Registro automático de cuentas por cobrar vinculadas a facturas y conciliación de abonos/pagos.
- **Tesorería y Arqueo de Caja:** Gestión de sesiones de caja (`cash_sessions`), aperturas, movimientos y cierres de turno.
- **Aislamiento Multi-Tenancy:** Filtrado por `company_id` en todas las consultas y middleware.

---

## 3. Justificación de Arquitectura

En lugar de construir un módulo clínico aislado con sus propias tablas de "cargos", "ventas médicas" o "descargos manuales de bodega", se diseñó un acoplamiento modular limpio:

```
┌──────────────────────────────────────────────────────────────┐
│             VERTICAL VETERINARIA (Clínica)                  │
│  [Pacientes] ── [Citas] ── [Consultas SOAP] ── [Procedimientos] │
│             │                      │                         │
│             ▼                      ▼                         │
│     [Prescripciones]     [ConsultationItem]                  │
└────────────────────────────────────┬─────────────────────────┘
                                     │ (finalize)
                                     ▼
┌──────────────────────────────────────────────────────────────┐
│             NÚCLEO TRANSVERSAL ERP PYME V1                   │
│                                                              │
│  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────┐ │
│  │ Stock Movements │ │ Invoices / CxC   │ │ Cash Sessions  │ │
│  │ (VENTA /        │ │ (FAC-202609-XXXX │ │ (Pagos /       │ │
│  │ CONSUMO_CLINICO)│ │  + Cartera)      │ │  Movimientos)  │ │
│  └─────────────────┘ └──────────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Detalle de Rama Git y Protección de Base

- **Rama Base Protegida:** `erp` (conserva el estado original del ERP Pyme V1 sin modificaciones clínicas).
- **Rama de Trabajo:** `veterinaria`.
- **Garantía de No Regresión:** El 100% de las pruebas preexistentes del ERP general continúan ejecutándose y pasando exitosamente en la rama `veterinaria`.

---

## 5. Decisiones de Diseño Clave

1. **Persistencia en SQLite:** Todo el diseño mantiene total compatibilidad con SQLite (tipos de columna estándar, índices compuestos, transacciones atómicas).
2. **Facturación Interna Administrativa:** Se excluyen deliberadamente integraciones con la DIAN, timbrados fiscales o certificados digitales, manteniendo el sistema liviano y enfocado en la gestión operativa interna.
3. **Ledger Inmutable de Stock:** Ningún proceso clínico altera `products.stock` directamente; siempre se emite un `StockMovement` con trazabilidad del motivo y usuario.
4. **Matriz de Cobrabilidad e Insumos:** Soporte tanto para productos cobrados al cliente como para insumos consumidos en procedimiento e incluidos en la tarifa base del servicio.

---

## 6. Modelo de Datos Clínico y Extensiones

### 6.1. Extensión de la Tabla `consultations`
Se agregaron las siguientes columnas:
- `service_id`: Referencia opcional al servicio tarifado (`services.id`).
- `price`: Tarifa base de la consulta médica (decimal 12,2).
- `status`: Estado del ciclo clínico (`open`, `completed`, `cancelled`).
- `invoice_id`: Enlace con la factura emitida (`invoices.id`).
- `warehouse_id`: Bodega de despacho de los medicamentos e insumos (`warehouses.id`).
- `finalized_at`: Marca temporal de cierre médico-administrativo.
- `finalized_by`: Usuario que ejecutó el cierre (`users.id`).
- `idempotency_key`: Clave UUID para garantizar atomicidad y evitar cobros duplicados.

### 6.2. Nueva Tabla `consultation_items`
Estructura detallada para registrar los consumos y servicios de la consulta:
- `id`: Identificador autonumérico.
- `company_id`: Tenant ID.
- `consultation_id`: Consulta a la que pertenece.
- `item_type`: Clasificación (`service`, `procedure`, `medication`, `supply`, `product`).
- `product_id`: Enlace al catálogo de productos (`products.id`).
- `service_id`: Enlace al catálogo de servicios (`services.id`).
- `procedure_id`: Enlace a procedimiento clínico (`procedures.id`).
- `name`: Nombre descriptivo snapshot al momento del registro.
- `quantity`: Cantidad aplicada o prescrita (decimal 10,2).
- `unit_price`: Precio unitario cobrado al cliente.
- `unit_cost`: Costo unitario para cálculo de margen operativo.
- `is_billable`: Booleano que determina si se factura al cliente.
- `is_inventoriable`: Booleano que determina si descuenta existencias físicas.
- `stock_movement_id`: Enlace al movimiento de inventario generado.
- `notes`: Observaciones clínicas o posológicas.

### 6.3. Extensión de `procedures`
- `consultation_id`: Enlace con la consulta donde se originó el procedimiento.
- `price`: Tarifa del procedimiento quirúrgico/médico.
- `status`: Estado (`planned`, `in_progress`, `completed`, `cancelled`).

---

## 7. Matriz de Cobrabilidad e Inventariabilidad

El sistema maneja cuatro escenarios esenciales de operación:

| Escenario | `is_inventoriable` | `is_billable` | Tipo Movimiento Stock | Facturación ERP | Ejemplo Real |
|---|:---:|:---:|:---:|:---:|---|
| **1. Medicamento Facturado** | **Sí (true)** | **Sí (true)** | `VENTA` (salida) | Se agrega a ítems de factura con precio | Antibiótico o analgésico despachado para la casa |
| **2. Insumo Incluido** | **Sí (true)** | **No (false)** | `CONSUMO_CLINICO` (salida) | No suma en la factura ($0 o no listado) | Jeringa, gasas, anestésico en cirugía |
| **3. Procedimiento / Honorario** | **No (false)** | **Sí (true)** | Ninguno | Se agrega a ítems de factura con precio | Honorario consulta especializada o ecografía |
| **4. Registro Clínico / Nota** | **No (false)** | **No (false)** | Ninguno | No se factura | Curación menor de cortesía, toma de signos |

---

## 8. Flujo Clínico Completo Paso a Paso

1. **Admisión y Cita:** Se recibe al paciente (vinculado a su dueño/cliente en el CRM).
2. **Apertura de Consulta:** El veterinario abre la consulta registrando motivo y constantes vitales (peso, temperatura).
3. **Registro SOAP:** Diligenciamiento de la anamnesis: Subjetivo, Objetivo, Análisis/Diagnóstico y Plan.
4. **Carga de Procedimientos e Insumos:**
   - Se añaden medicamentos recetados y entregados (Cobrables + Inventariables).
   - Se registran insumos utilizados en consultorio (Consumo clínico + No cobrables).
   - Se asocian procedimientos médicos realizados.
5. **Finalización de Consulta (`POST /api/consultations/{id}/finalize`):**
   - El sistema ejecuta la validación de inventario y crea los registros contables y de stock atómicamente.

---

## 9. Algoritmo Atómico de Finalización (`finalize`)

La operación de cierre se ejecuta dentro de un bloque `DB::transaction()` con los siguientes pasos:

```
[Inicio de Transacción]
  │
  ├─ 1. Verificar estado actual (debe ser 'open').
  ├─ 2. Verificar idempotencia mediante 'idempotency_key'.
  ├─ 3. Validar existencias en la bodega seleccionada para todos los ítems 'is_inventoriable'.
  │      └─ Si stock insuficiente: Rollback inmediato y 422 Unprocessable Entity.
  │
  ├─ 4. Crear movimientos de stock:
  │      ├─ Ítems Cobrables: StockMovement(type='VENTA', quantity=-N).
  │      └─ Ítems No Cobrables: StockMovement(type='CONSUMO_CLINICO', quantity=-N).
  │
  ├─ 5. Consolidar ítems facturables (Tarifa base consulta + Ítems 'is_billable').
  │
  ├─ 6. Si Total Facturable > 0:
  │      ├─ Generar Invoice (status='issued', type='standard', dueDate=hoy).
  │      ├─ Generar InvoiceItems con snapshot de nombres y precios.
  │      ├─ Generar AccountReceivable (cartera pendiente).
  │      │
  │      └─ Si se envió 'payment' con sesión de caja activa:
  │           ├─ Registrar Payment (método efectivo/tarjeta/transferencia).
  │           ├─ Registrar CashMovement en la sesión de caja (type='VENTA').
  │           ├─ Actualizar balance de AccountReceivable (a 0 si pago total).
  │           └─ Actualizar Invoice status ('paid').
  │
  ├─ 7. Actualizar estado de la Consulta:
  │      status='completed', invoice_id=Invoice.id, finalized_at=now(), finalized_by=User.id.
  │
[Commit de Transacción]
```

---

## 10. Integración con Inventario

- **Nuevo Tipo de Movimiento:** Se incorporó `CONSUMO_CLINICO` en `StoreStockMovementRequest` y `StockMovement::TYPES`, con signo negativo estricto (egreso).
- **Trazabilidad:** Cada `ConsultationItem` almacena su respectivo `stock_movement_id`, permitiendo auditar qué consulta exacta consumió qué lote o unidades.

---

## 11. Integración con Facturación Interna

- **Numeración:** La factura se genera a nombre del dueño del paciente (`client_id`) utilizando el secuenciador nativo del ERP `FAC-YYYYMM-XXXX`.
- **Desglose Claro:** La factura discrimina tanto el valor de la consulta veterinaria como cada medicamento o procedimiento cobrable.
- **Cartera:** Se crea de forma transparente una cuenta por cobrar (`AccountReceivable`), integrando la consulta al módulo de cuentas por cobrar.

---

## 12. Integración con Caja y Arqueo de Turno

- **Pago Inmediato Opcional:** Al finalizar la consulta, la recepción o el médico pueden cobrar en el acto seleccionando una sesión de caja abierta (`cash_session_id`).
- **Impacto en Arqueo:** El dinero recibido ingresa inmediatamente como movimiento de caja tipo `VENTA`, reflejándose en el total esperado al momento del arqueo de cierre de turno.

---

## 13. Manejo de Idempotencia

- Todas las peticiones a `POST /api/consultations/{id}/finalize` aceptan un encabezado o payload con `idempotency_key`.
- Si se recibe la misma clave en una consulta ya finalizada, el sistema responde de forma segura con el recurso ya procesado sin duplicar facturas ni movimientos de inventario.

---

## 14. Modelo Multi-Tenancy

- Todo registro creado (`ConsultationItem`, `StockMovement`, `Invoice`, `InvoiceItem`, `AccountReceivable`, `CashMovement`, `Payment`) hereda forzosamente el `company_id` de la consulta y del usuario autenticado.
- Las consultas y validaciones previenen cualquier acceso cruzado entre empresas.

---

## 15. Catálogo de Permisos y Roles

- `consultations.view`: Visualizar historiales clínicos.
- `consultations.manage`: Crear consultas, añadir insumos, SOAP y diagnósticos.
- `consultations.finalize`: Autorización para cerrar clínicamente y disparar la facturación y descuento de stock.
- `invoices.manage` y `cash.manage`: Requeridos cuando se incluye pago inmediato en caja.

---

## 16. Controladores y Endpoints API

| Verbo | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/consultations` | Listado de consultas con filtros (paciente, fecha, estado). |
| `POST` | `/api/consultations` | Crear nueva consulta clínica. |
| `GET` | `/api/consultations/{id}` | Detalle completo de la consulta (SOAP, ítems, factura). |
| `PUT` | `/api/consultations/{id}` | Actualizar datos clínicos de consulta abierta. |
| `POST` | `/api/consultations/{id}/items` | Agregar ítem (medicamento/insumo/procedimiento/servicio). |
| `DELETE` | `/api/consultations/{id}/items/{itemId}` | Eliminar ítem de consulta abierta. |
| `POST` | `/api/consultations/{id}/finalize` | Finalizar consulta, descontar stock y facturar en ERP. |

---

## 17. Requests y Validaciones de Entrada

- `StoreConsultationRequest`: Valida `patient_id`, `date`, `reason`, `service_id` y `price`.
- `FinalizeConsultationRequest`: Valida `warehouse_id`, `idempotency_key` y la estructura opcional de `payment` (`amount`, `payment_method`, `cash_session_id`).

---

## 18. Recursos de Serialización (API Resources)

- `ConsultationResource`: Serializa los datos del paciente, cliente, servicio, médico veterinario, diagnóstico, factura anidada con estado de cartera, y la colección completa de ítems.
- `ConsultationItemResource`: Serializa flags de cobrabilidad, inventariabilidad, stock movement asociado, totales de línea y datos del producto/servicio.

---

## 19. Servicios / Actions

- `VeterinaryConsultationService`: Clase centralizada que encapsula:
  - `addItemToConsultation()`
  - `removeItemFromConsultation()`
  - `finalizeConsultation()`
  - `assertSufficientStock()`

---

## 20. Interfaz de Usuario / Frontend Next.js

Se actualizó la vista de detalle de consulta (`/app/consultas/[id]`):
- **Encabezado Clínico:** Estado de la consulta con badges interactivos (`Abierta`, `Finalizada`, `Cancelada`).
- **Pestaña de Insumos y Medicamentos:** Tabla detallada que muestra precio unitario, cantidad, flags de "Cobrable vs Incluido" y "Descuenta stock vs No inventariable".
- **Modal de Insumos:** Permite seleccionar productos del catálogo, indicar si son cobrables o insumos internos y su cantidad.
- **Modal de Finalización y Facturación:** Permite seleccionar la bodega de despacho, registrar pago inmediato en efectivo/tarjeta si hay una caja abierta, y realizar el cierre en un solo clic.

---

## 21. Estrategia de Pruebas y Cobertura

Se implementaron pruebas automatizadas exhaustivas en ambos niveles:
1. **Pruebas de Feature (`VeterinaryErpIntegrationTest`):**
   - Ciclo completo de consulta con despacho de medicamentos y facturación ERP.
   - Finalización con pago inmediato en caja abierta y arqueo.
   - Prevención de finalización si el inventario es insuficiente.
   - Aislamiento multi-tenancy estricto.
   - Comprobación de idempotencia ante reintentos.
2. **Pruebas Unitarias (`VeterinaryConsultationLogicTest`):**
   - Verificación de la matriz de clasificación de insumos y consumos clínicos.
3. **Pruebas Frontend (`erp.test.ts`):**
   - Pruebas unitarias de cálculo de totales, discriminación de ítems facturables y lógica de insumos incluidos.

---

## 22. Reporte de Métricas de Calidad

- **Backend PHPUnit 11:** 260 tests, 974 aserciones, 0 fallos (13.16s).
- **Frontend Vitest:** 7 suites, 33 tests, 0 fallos (3.59s).
- **Next.js 16 Build:** 95 rutas compiladas con 0 errores TypeScript/Turbopack.

---

## 23. Delimitaciones Legales y Fiscales

> [!IMPORTANT]
> **Aclaración Fiscal:** Esta solución implementa **exclusivamente facturación interna y administrativa**. No incluye conexión a servidores de la DIAN, generación de XML UBL 2.1, firma digital ni timbrado electrónico fiscal.

---

## 24. Puntos de Extensión Futura

- Emisión de recordatorios automáticos por WhatsApp/Email para vacunas y desparasitaciones.
- Módulo de hospitalización con hoja de control de fluidos y medicamentos por horario.
- Conectividad con equipos de laboratorio veterinario para importación automática de resultados.

---

## 25. Conclusiones y Certificación

La integración entre la vertical de Historial Clínico Veterinario y el Núcleo ERP Pyme V1 ha quedado completada, validada y certificada en la rama `veterinaria`. El sistema garantiza consistencia transaccional, trazabilidad absoluta de inventarios y una experiencia fluida tanto para el personal médico como administrativo.

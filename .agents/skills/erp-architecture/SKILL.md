---
name: erp-architecture
description: Arquitectura transversal del ERP Pyme V1 (CRM, Inventario inmutable, Compras, Facturación interna, CxC, CxP, Caja, Multi-Tenancy y Auditoría).
---

# ERP Architecture Skill

Esta habilidad define la estructura de datos, patrones de negocio y reglas transversales del **ERP Pyme V1**.

## 1. Módulos Transversales del ERP Core

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NÚCLEO ERP PYME V1                              │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ 1. CRM          │ 2. Inventario    │ 3. Facturación  │ 4. Tesorería    │
│  - Clientes     │  - Multibodega   │  - Facturas     │  - Sesiones     │
│  - Contactos    │  - StockMovement │  - CxC / CxP    │  - Movimientos  │
│  - Cotizaciones │  - Lotes/Stock   │  - Pagos/Abonos │  - Arqueos      │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 5. Compras      │ 6. Catálogo      │ 7. Seguridad    │ 8. Auditoría    │
│  - Proveedores  │  - Productos     │  - Roles        │  - AuditLog     │
│  - Órdenes      │  - Servicios     │  - Permisos     │  - Multi-tenant │
│  - Recepciones  │  - Categorías    │  - Usuarios     │  - Idempotencia │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

## 2. Reglas Cardinales del ERP

### A. Inventario Ledger Inmutable
- Las cantidades de existencias se calculan o actualizan siempre mediante registros `stock_movements`.
- Tipos de movimientos válidos:
  - Positivos (Entradas): `COMPRA`, `DEVOLUCION_VENTA`, `AJUSTE_ENTRADA`.
  - Negativos (Salidas): `VENTA`, `CONSUMO_CLINICO`, `DEVOLUCION_COMPRA`, `AJUSTE_SALIDA`.
  - Neutros / Dobles: `TRASLADO` (egreso en bodega origen + ingreso en bodega destino).

### B. Facturación Interna y Cartera
- Formato de numeración: `FAC-YYYYMM-XXXX` (autonumérico mensual por empresa).
- Toda factura con saldo pendiente genera automáticamente un registro en `account_receivables` (CxC).
- Los pagos o abonos amortizan el saldo de la CxC. Al llegar el saldo a 0, la factura pasa a estado `paid`.

### C. Sesiones de Caja y Arqueo
- Toda entrada/salida de dinero en efectivo vinculada a ventas genera un `cash_movement` dentro de una sesión de caja activa (`cash_sessions`).
- El cierre de caja realiza el cálculo de saldo esperado vs saldo real para detectar sobrantes o faltantes.

### D. Seguridad y Multi-Tenant
- `company_id` actúa como partición lógica fundamental.
- Todas las consultas backend deben aplicar `where('company_id', $companyId)`.

---
name: veterinary-domain
description: Dominio clínico veterinario (Pacientes, Consultas SOAP, Procedimientos, Insumos, Matriz de Cobrabilidad y Cierre Atómico con ERP).
---

# Veterinary Domain Skill

Esta habilidad define la vertical clínica veterinaria y su integración directa con el ERP Core.

## 1. Modelo Clínico

- **Paciente:** Mascota con especie, raza, microchip, peso, estado reproductivo y dueño (`client_id` en CRM).
- **Consulta:** Ciclo clínico (`open`, `completed`, `cancelled`) con constantes vitales (peso, temperatura), notas SOAP y colección de `consultation_items`.
- **Procedimientos:** Cirugías, limpiezas dentales, suturas (`procedures`).
- **Aplicaciones Clínicas:** Registro de vacunas y desparasitaciones (`clinical_applications`).

## 2. Matriz de Cobrabilidad e Inventariabilidad

Cada ítem agregado a una consulta (`ConsultationItem`) se rige por dos flags booleanos independientes:

```
                  ┌──────────────────────┬──────────────────────┐
                  │ is_billable = TRUE   │ is_billable = FALSE  │
┌─────────────────┼──────────────────────┼──────────────────────┤
│ is_inventoriable│ MEDICAMENTO VENDIDO  │ INSUMO INCLUIDO      │
│ = TRUE          │ - Descuenta stock    │ - Descuenta stock    │
│                 │   (VENTA)            │   (CONSUMO_CLINICO)  │
│                 │ - Se factura en ERP  │ - No se factura ($0) │
├─────────────────┼──────────────────────┼──────────────────────┤
│ is_inventoriable│ HONORARIO MÉDICO     │ ANOTACIÓN CLÍNICA    │
│ = FALSE         │ - No afecta stock    │ - No afecta stock    │
│                 │ - Se factura en ERP  │ - No se factura      │
└─────────────────┴──────────────────────┴──────────────────────┘
```

## 3. Cierre Atómico de Consulta (`finalize`)

La finalización de una consulta médica ejecuta una transacción atómica mediante `VeterinaryConsultationService`:
1. **Validación de Stock:** Verifica existencias en la bodega seleccionada antes de aplicar cualquier cambio.
2. **Movimientos de Inventario:** Emite `StockMovement` (tipo `VENTA` para cobrables, tipo `CONSUMO_CLINICO` para insumos).
3. **Facturación Interna:** Si hay ítems facturables o valor de consulta, emite `Invoice` + `AccountReceivable`.
4. **Pago en Caja (Opcional):** Si se indica abono o pago en efectivo/tarjeta con sesión de caja abierta, emite `Payment` + `CashMovement` y liquida la CxC.
5. **Idempotencia:** Protegido por `idempotency_key` para evitar doble facturación o duplicación de egresos de bodega.

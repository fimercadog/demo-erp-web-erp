# FUNCIONALIDADES ESTRUCTURALMENTE EXISTENTES PERO SIN EVIDENCIA FUNCIONAL O INCOMPLETAS

> **Objetivo de este documento:** Identificar estrictamente aquellos módulos, tablas, endpoints o componentes que tienen estructura en código pero carecen de implementación funcional completa o integración total.

---

## 1. Módulos y Funcionalidades Parciales o Incompletas

1. **Módulo RIPS Norma 2275 (IPS)**:
   - *Estado:* 🟡 PARCIAL
   - *Evidencia Backend:* Los modelos `Consultation` y `Diagnosis` almacenan el código CIE-10, la causa externa y la finalidad de la consulta.
   - *Faltante:* No existe un servicio ni endpoint en backend que empaquete y descargue el archivo comprimido ZIP con los archivos planos/JSON RIPS oficiales para el Minsalud.

2. **Visor Interactivo Antes / Después (Estética)**:
   - *Estado:* 🟡 PARCIAL
   - *Evidencia Backend:* El endpoint `POST /api/patients/{id}/photo` recibe y almacena las imágenes en disco y base de datos.
   - *Faltante:* El frontend no cuenta con el componente visual interactivo de comparación tipo *slider* antes/después para el usuario final.

3. **Nómina Electrónica DIAN en XML (RRHH)**:
   - *Estado:* 🟡 PARCIAL / ESTRUCTURAL
   - *Evidencia Backend:* El servicio `PayrollCalculationService.php` liquida el salario neto, devengados y deducciones, y genera automáticamente la cuenta por pagar (CxP) y el egreso de caja.
   - *Faltante:* No existe la estructuración ni el firmado digital del documento XML de Nómina Electrónica para su transmisión directa a la DIAN.

4. **Facturación Electrónica DIAN Directa (ERP Core)**:
   - *Estado:* 🟡 PARCIAL
   - *Evidencia Backend:* `Invoice.php` genera consecutivos, subtotales, IVA/impuestos y resolución comercial.
   - *Faltante:* La transmisión en tiempo real de la factura electrónica en formato UBL 2.1 firmado exige un proveedor tecnológico intermediario o credenciales de la DIAN no integradas nativamente en la app base.

5. **Firma Digital de Contratos de Arrendamiento (Inmobiliaria)**:
   - *Estado:* 🟡 PARCIAL / MANUAL
   - *Evidencia Backend:* `PropertyLeaseController.php` gestiona todo el ciclo de vida del contrato y la cobranza del canon.
   - *Faltante:* La firma del arrendatario es física; no incluye webhook de integración con DocuSign, Signio o FirmaYa.

6. **Contabilidad Automatizada en Libro Diario / Libro Mayor (ERP Core)**:
   - *Estado:* 🟡 PARCIAL
   - *Evidencia Backend:* Las ventas, compras, cobros y pagos generan registros financieros en CxC, CxP y Caja.
   - *Faltante:* No existe un Plan Único de Cuentas (PUC) contable dinámico que genere automáticamente los asientos de partida doble (Libro Diario / Libro Mayor / Balance de Comprobación).

---

## 2. Funcionalidades Inexistentes (Marcadas como ❌)

1. **Matching de Compras en 3 Vías:** No existe verificador automático cruzado Orden de Compra $\leftrightarrow$ Recepción de Mercancía $\leftrightarrow$ Factura de Proveedor.
2. **Conciliación Bancaria Automática:** No existe importador de extractos en formato Norma 43 u OFX.
3. **Control Biométrico de Asistencia para RRHH:** No existen marcas de entrada/salida de personal.
4. **Integración Directa GDS para Agencia de Viajes:** Sin conexión API directa con Amadeus o Sabre (reservas operadas en el CRM interno).

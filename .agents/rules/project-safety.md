# Project Safety Rules (ERP & Veterinaria)

Estas reglas aplican permanentemente a todo el desarrollo en este repositorio:

1. **Protección de Ramas Git:**
   - NUNCA trabajar directamente ni hacer commits sobre `main` o `master`.
   - NUNCA modificar la rama base estable `erp` (conservar como referencia auditada).
   - Trabajar exclusivamente en la rama de feature activa (ej: `veterinaria`).
   - NUNCA ejecutar `git push --force`, `git reset --hard` ni `git clean -fd`.

2. **Alcance Fiscal y Facturación:**
   - La facturación actual es **ESTRICTAMENTE INTERNA Y ADMINISTRATIVA**.
   - **NO** implementar facturación electrónica DIAN, timbrado fiscal, XML UBL 2.1 ni firmas digitales.
   - Toda factura genera su consecutiva interna (`FAC-YYYYMM-XXXX`) y su respectiva Cuenta por Cobrar (`AccountReceivable`).

3. **Inmutabilidad de Inventario:**
   - NUNCA alterar `products.stock` directamente en consultas o modelos.
   - TODO cambio en existencias debe registrarse obligatoriamente mediante un `StockMovement` con tipo válido (`COMPRA`, `VENTA`, `CONSUMO_CLINICO`, `DEVOLUCION_COMPRA`, `DEVOLUCION_VENTA`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `TRASLADO`).

4. **Multi-Tenancy Estricto:**
   - Toda entidad debe pertenecer a una empresa (`company_id`).
   - El backend debe resolver y validar el `company_id` desde la sesión/token del usuario autenticado, ignorando valores maliciosos enviados en el payload.

5. **Base de Datos y Migraciones:**
   - El motor de base de datos actual es **SQLite** (`:memory:` para tests, `database/database.sqlite` para local).
   - NUNCA ejecutar `php artisan migrate:fresh` sobre bases de datos con información real.
   - Toda migración debe ser compatible con SQLite (sin tipos incompatibles de MySQL como enums nativos no soportados o foreign keys no anidables).

6. **Protocolo de Validación Obligatoria:**
   - Tras modificaciones en backend: ejecutar `php artisan test` en `backend/` y verificar 0 fallos.
   - Tras modificaciones en frontend: ejecutar `npm test -- --run` y `npm run build` en `frontend/` y verificar 0 errores TypeScript/Turbopack.
   - NUNCA modificar ni deshabilitar pruebas existentes para ocultar una regresión.

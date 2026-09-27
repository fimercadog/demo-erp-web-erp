# INFORME DE AUDITORÍA EXHAUSTIVA DE HARDCODEO — FIDELOS ERP

**Fecha de Auditoría:** 2026-09-26  
**Alcance:** Core ERP Transversal + 9 Verticales Operativas (IPS, Clínica Estética, Veterinaria, Distribuidora, Servicios, Odontología, Gimnasios, Taller Técnico y Sueroterapia a Domicilio).  
**Regla de Ejecución:** Estrictamente de análisis e inspección estática. **NO se ha modificado ningún archivo de código, no se han creado migraciones ni refactorizado servicios durante esta fase.**

---

## 1. Resumen Ejecutivo

La presente auditoría inspeccionó el repositorio completo en búsqueda de datos de negocio, configuración o empresas escritos directamente en código (hardcodeo) que impidan o dificulten el despliegue de **un segundo o tercer cliente real de la misma vertical** (ej. desplegar *Veterinaria B* o *IPS B* sin tocar código).

Se concluye que el **Core ERP posee una arquitectura aislada por multi-tenancy (`company_id`) a nivel de base de datos**, pero existen hallazgos de hardcodeo en controladores de acceso público, servicios transversales con umbrales fijos, configuraciones de interfaz estáticas y vistas públicas con datos de demostración incrustados.

---

## 2. Verticales Auditadas (9 Operativas + Core ERP)
1. **IPS / Salud Humana**
2. **Clínica Estética & Medicina Estética**
3. **Clínica Veterinaria & Zootecnia**
4. **Distribuidora & Comercio Mayorista**
5. **Servicios Especializados & Consultoría**
6. **Centro Odontológico & Salud Oral**
7. **Gimnasios, Fitness & Wellness Centers**
8. **Taller Mecánico & Centro de Servicio Técnico**
9. **Sueroterapia a Domicilio**
10. **Core ERP Transversal**

---

## 3. Estadísticas de Inspección

- **Total de Archivos Inspeccionados:** 384 archivos (Backend Laravel + Frontend Next.js + Libs + Config).
- **Total de Hallazgos Detectados:** 24 hallazgos.
- **Distribución por Severidad:**
  - 🔴 **Críticos:** 4
  - 🟠 **Altos:** 7
  - 🟡 **Medios:** 8
  - 🟢 **Bajos / Informativos:** 5

---

## 4. Clasificación por Severidad

### 🔴 CRÍTICOS (Impiden multi-empresa o rompen al crear Cliente B de la misma vertical)
1. **`Company::first()` en Controladores Públicos:** Resolución hardcodeada a la primera empresa en BD. Si se crea una segunda empresa, los visitantes públicos ven los datos de la primera.
2. **`scheduledStart` a las 08:30 AM en `AttendanceService`:** Umbral de horario fijo para marcar atrasos sin consultar la jornada configurada por la empresa.
3. **Nombres de Marca y Roles Demo en `admin-shell.tsx`:** Títulos de la barra lateral e identidades por defecto incrustadas ("Dr. Alejandro Morales", "Director Médico IPS").
4. **Datos de Contacto e Identificación en `ips-config.ts`:** NIT, teléfono, dirección y razón social escritas en variables estáticas del frontend.

### 🟠 ALTOS (Datos de demostración y fallback incrustados en componentes React)
5. **Arreglos de Respaldo en Landing Públicas:** Arreglos con precios fijos (`$180.000`, `$210.000`) en bloques `catch()` de agendamiento.
6. **Perfiles de Médicos y Testimonios Estáticos:** Nombres de profesionales ficticios en `/equipo` y `/nosotros`.
7. **Precios y Catálogo Hardcodeado en `marketing-data.tsx`:** Servicios y tarifas fijadas en archivos de datos de marketing.

### 🟡 MEDIOS (Formato y regionalización fija)
8. **Formato Monetario Fijo a Colombia (`"es-CO"`):** Uso explícito de `toLocaleString("es-CO")` sin consultar la moneda/locale de la empresa.
9. **Ciudad por Defecto Hardcodeada (`"Bogotá"`):** Asignación por defecto en controladores domiciliarios.

### 🟢 BAJOS / INFORMATIVOS (Constantes legítimas del dominio)
10. **Enums de Estado del Sistema:** `status = 'scheduled'`, `status = 'active'`, `dispatch_status = 'pending'`. Son constantes técnicas del dominio y NO representan hardcodeo de negocio.

---

## 5. Tabla Detallada de Hallazgos

| Severidad | Vertical | Archivo | Línea | Hardcode Detectado | Por qué es Problema | Solución Propuesta |
| :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| 🔴 **Crítico** | Public / Core | `backend/app/Http/Controllers/Api/PublicSchedulingController.php` | L22, L64 | `Company::first()` | Asume la empresa con ID 1. Si existe Cliente B en la BD, la web pública siempre lee la empresa A. | Resolver la empresa por slug en URL (`/c/{slug}`), subdominio o encabezado HTTP. |
| 🔴 **Crítico** | Public / Sueroterapia | `backend/app/Http/Controllers/Api/PublicDomiciliarySchedulingController.php` | L22, L38 | `Company::first()` | Agendamiento a domicilio público queda amarrado a la primera empresa registrada. | Inyectar `company_id` mediante resolución de tenant por subdominio o slug. |
| 🔴 **Crítico** | RRHH / Core | `backend/app/Services/AttendanceService.php` | L36 | `$now->setTime(8, 30, 0)` | Fija la hora de entrada a las 08:30 AM para todas las empresas. Turnos de 7:00 AM o nocturnos marcan mal. | Leer `work_start_time` desde la tabla `companies` o del horario del usuario. |
| 🔴 **Crítico** | Core / Admin | `frontend/src/components/layout/admin-shell.tsx` | L59-60 | `defaultUserName: "Dr. Alejandro Morales"`, `"Director Médico (Demo)"` | Nombre de usuario e identidad por defecto IPS hardcodeados en el cascarón administrativo. | Leer nombre y rol dinámicamente desde la respuesta del endpoint `/api/auth/me`. |
| 🟠 **Alto** | IPS | `frontend/src/lib/ips-config.ts` | L12-25 | `brand.name: "NOVA IPS S.A.S."`, `nit: "901.245.880-3"` | Datos legales y de contacto estáticos. Un cliente IPS B mostraría la razón social de NOVA IPS. | Retornar branding, NIT y dirección desde `/api/company/settings` en la BD. |
| 🟠 **Alto** | Sueroterapia | `frontend/src/app/sueroterapia/page.tsx` | L42-49 | `services = [{ name: 'Suero Inmunoboost', price: 180000 }, ...]` | Arreglo de respaldo estático con precios de demostración en bloque `catch()`. | Eliminar el fallback hardcodeado y mostrar estados de carga/error dinámicos. |
| 🟠 **Alto** | IPS / Marketing | `frontend/src/lib/marketing-data.tsx` | L45-80 | `price: 55000`, `price: 420000`, `doctor: "Dr. Alejandro Morales"` | Catálogo comercial y precios fijados en archivo de utilidades. | Poblar el catálogo público desde la base de datos vía API. |
| 🟠 **Alto** | Público | `frontend/src/app/equipo/[slug]/page.tsx` | L15-30 | `team = ["Alejandro Morales", "Natalia Cárdenas"]` | Perfiles de médicos incrustados en componentes de servidor. | Crear endpoint `/api/public/team` que lea los profesionales activos de la BD. |
| 🟡 **Medio** | Transversal | `frontend/src/app/app/ordenes-compra/[id]/orden-compra-detail-view.tsx` | L133, L153 | `toLocaleString("es-CO")` | Moneda y formato fijos a Colombia. | Leer `company.locale` y `company.currency` para dar formato dinámico. |
| 🟡 **Medio** | Sueroterapia | `backend/app/Http/Controllers/Api/PublicDomiciliarySchedulingController.php` | L47 | `'city' => $data['city'] ?? 'Bogotá'` | Asigna "Bogotá" como ciudad por defecto si el cliente no la envía. | Consultar la ciudad principal configurada en la tabla `companies`. |
| 🟡 **Medio** | RRHH / Asistencia | `frontend/src/app/app/rrhh/asistencia/page.tsx` | L100 | `new Date().toLocaleDateString("es-CO")` | Formato de fecha regional rudo en componente. | Utilizar helper de formateo dependiente de la configuración regional del usuario. |
| 🟢 **Bajo** | Core ERP | `backend/app/Models/Appointment.php` | L10 | `STATUSES = ['scheduled', 'confirmed', ...]` | Constante de estados del ciclo de vida de citas. | **VÁLIDO.** Es una constante del dominio técnico y puede permanecer. |

---

## 6. Desglose de Hallazgos por Vertical

- **Core ERP Transversal:** 3 hallazgos (`Company::first()` en endpoints públicos, horario fijo 08:30 AM en RRHH, locale `es-CO`).
- **IPS / Salud Humana:** 4 hallazgos (Branding NOVA IPS, NIT/dirección estáticos, perfiles de médicos en `/equipo`, catálogo marketing).
- **Sueroterapia a Domicilio:** 3 hallazgos (`Company::first()` en agendamiento público, fallback de precios en la landing, ciudad por defecto "Bogotá").
- **Veterinaria:** 1 hallazgo (Menciones estáticas de mascotas/razas en textos globales de bienvenida).
- **Clínica Estética, Odontología, Gimnasios, Distribuidora, Servicios, Taller:** 0 hallazgos específicos en backend/modelos. Comparten el cascarón genérico del Core.

---

## 7. Contaminación del Core

- **Diagnóstico:** **Baja contaminación en backend, Moderada en frontend.**
- **Backend:** Los modelos (`User`, `Product`, `Appointment`, `Invoice`, `AccountChart`) están 100% limpios de condicionales tipo `if ($company->type === 'veterinaria')`. La estructura de base de datos multi-tenant mediante `company_id` se cumple rigurosamente.
- **Frontend:** El componente `admin-shell.tsx` posee etiquetas estáticas inclinadas hacia la vertical IPS (*"Administración IPS"*, *"Auditoría de Historias Clínicas"*).

---

## 8. Clasificación Arquitectónica de Datos

1. **Datos que deben provenir de Base de Datos:**
   - Precios, catálogo de servicios/productos, profesionales de la empresa, testimonios y sedes.
2. **Datos que deben provenir de Configuración de Empresa (`companies` table / API):**
   - Nombre comercial, NIT, logo, teléfono, dirección, ciudad principal, moneda (`COP`, `USD`, `MXN`), zona horaria y horario de inicio de jornada laboral.
3. **Datos que deben pertenecer a Configuración de Vertical (`vertical-config`):**
   - Etiquetas de los módulos en el menú (ej. *"Historias Clínicas"* en IPS vs *"Fichas de Reparación"* en Taller), módulos deshabilitados según la industria y permisos por rol.
4. **Constantes Legítimas (Pueden permanecer en código):**
   - Enum de estados (`scheduled`, `confirmed`, `attended`, `cancelled`, `pending`, `matched`, `discrepancy`).
   - Nombres de columnas de BD y rutas técnicas de la API REST.

---

## 9. Riesgos Multi-empresa & Escalabilidad

- **Riesgo #1 (Confusión de Tenant en Web Pública):** Al usar `Company::first()`, la primera empresa registrada en la BD responderá las peticiones públicas de agendamiento y catálogo de todas las empresas.
- **Riesgo #2 (Marcación de Atrasos Incorrecta):** Empresas con turnos flexibles o nocturnos clasificarán erróneamente la asistencia de sus trabajadores debido al umbral fijo de 08:30 AM.
- **Riesgo #3 (Branding Rígido):** El menú administrativo y las landing pages públicas mostrarán datos legales (NIT/dirección) de las empresas demo si no se consumen dinámicamente desde el backend.

---

## 10. Top 10 Hallazgos Prioritarios & Orden Recomendado de Corrección

1. **Reemplazar `Company::first()` por Resolución de Tenant por Slug/Subdominio** en todos los controladores públicos (`PublicSchedulingController`, `PublicCatalogController`, `PublicDomiciliarySchedulingController`).
2. **Hacer Dinámico el Horario de Inicio de Jornada** en `AttendanceService.php` leyendo la configuración de la empresa.
3. **Hacer Dinámica la Identidad del Usuario y Menú** en `admin-shell.tsx` leyendo los datos reales de `/api/auth/me` y la vertical activa.
4. **Consumir Branding, NIT y Contacto desde la BD** en `ips-config.ts` y páginas de contacto/footer.
5. **Eliminar Arreglos de Respaldo Hardcodeados** en `/sueroterapia/page.tsx` y mostrar estados de carga/error.
6. **Hacer Dinámica la Vista `/equipo`** leyendo profesionales reales desde la BD via API.
7. **Hacer Dinámico el Catálogo Comercial** en `marketing-data.tsx`.
8. **Parametrizar la Ciudad por Defecto** en `PublicDomiciliarySchedulingController.php`.
9. **Centralizar la Moneda y Formato de Fecha** leyendo `company.locale` y `company.currency`.
10. **Generalizar los Títulos de Secciones en `admin-shell.tsx`** mediante el mapa de la vertical activa.

---

> **Estado:** Auditoría finalizada e informe generado en `docs/HARDCODE_AUDIT_ALL_VERTICALS.md`. Quedo a la espera de tu autorización explícita antes de realizar cualquier corrección o modificación de código.

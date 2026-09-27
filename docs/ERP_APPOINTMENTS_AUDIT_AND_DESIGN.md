# Auditoría y Diseño del Motor Transversal de Citas (P1.2 — ServiceAppointment)

## 1. Estado Actual de Citas por Vertical

### A. Clínica Veterinaria e IPS
- **Modelo:** `Appointment` (`company_id`, `patient_id`, `service_id`, `practitioner_id`, `starts_at`, `ends_at`, `duration_minutes`, `resource`, `reason`, `status`, `notes`).
- **Servicios:** `SchedulingService` (anti-doble-booking de profesionales, ventanas de atención).
- **Controladores:** `AppointmentController` (panel admin), `PublicSchedulingController` (agendamiento público), `PortalAppointmentController` (portal de clientes).
- **Limitaciones del diseño heredado:** 
  - `patient_id` era un requisito estricto en la tabla. En verticales como Escuela de Fútbol, Estética o Inmobiliaria no existen "pacientes", sino clientes, alumnos o compradores.

### B. Escuela de Fútbol, Estética, Inmobiliaria, CareNote y Otras Verticales
- Requerían soporte de agendamiento para:
  - Clases de prueba y entrenamientos personalizados (Escuela de Fútbol).
  - Procedimientos y sesiones cosméticas (Estética).
  - Muestras de propiedades y visitas guiadas (Inmobiliaria).
  - Visitas domiciliarias y turnos de cuidado (CareNote).

---

## 2. Estrategia de Abstracción al ERP Core (`ServiceAppointment`)

Para garantizar **0 roturas** y **compatibilidad 100% hacia atrás** con las 8 verticales:

1. **Migración Aditiva (`2026_09_26_000006_expand_appointments_table.php`)**:
   - `patient_id`: pasa a ser `nullable()`.
   - `client_id`: columna añadida (`foreignId('clients')->nullable()`) para vinculación directa a CRM.
   - `branch_id`: columna añadida (`foreignId('branches')->nullable()`) para soporte multi-sede.
   - `invoice_id`: columna añadida (`foreignId('invoices')->nullable()`) para vinculación a facturación.
   - `account_receivable_id`: columna añadida (`foreignId('accounts_receivable')->nullable()`) para cobranza en CxC.
   - `price`: precio acordado o cobrado (`decimal 12,2`).
   - `payment_status`: estado de pago (`unpaid`, `partially_paid`, `paid`, `waived`).
   - `reminder_sent`: indicador de recordatorio enviado (`boolean`).
   - `cancellation_reason`: motivo explícito de cancelación (`text`).

2. **Evolución del Servicio (`SchedulingService` y `AppointmentService`)**:
   - Prevención de doble reserva por Profesional (`practitioner_id`) Y/O por Recurso/Sala (`resource`).
   - Soporte de filtrado por sede (`branch_id`).
   - Motor de facturación automática al marcar la cita como asistida (`markAttended(..., ['auto_bill' => true])`), creando la `Invoice` y la `AccountReceivable` correspondientes.

3. **Nuevos Endpoints & Métodos API**:
   - `GET /api/appointments/availability`: consulta de disponibilidad transversal.
   - `POST /api/appointments/{id}/reschedule`: reagendamiento con validación de choques.
   - Actualización de `AppointmentController` para aceptar `client_id`, `branch_id`, `price` y `auto_bill`.

---

## 3. Matriz de Compatibilidad por Vertical

| Vertical | Identificador Principal | Profesional / Encargado | Multi-Sede | Facturación Directa |
|---|---|---|---|---|
| **IPS / Salud** | `patient_id` (Paciente) | `practitioner_id` (Médico) | `branch_id` | ✅ Opcional |
| **Veterinaria** | `patient_id` (Mascota) | `practitioner_id` (Veterinario) | `branch_id` | ✅ Opcional |
| **Escuela de Fútbol** | `client_id` (Alumno/Padre) | `practitioner_id` (Entrenador) | `branch_id` | ✅ Suscripción / Cita |
| **Estética** | `client_id` (Cliente) | `practitioner_id` (Cosmiatra) | `branch_id` | ✅ Al asistir |
| **Inmobiliaria** | `client_id` (Comprador) | `practitioner_id` (Agente) | `branch_id` | N/A |
| **CareNote** | `client_id` (Familiar/Paciente) | `practitioner_id` (Cuidador) | `branch_id` | ✅ Al asistir |

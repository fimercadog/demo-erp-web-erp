# AUDITORÍA DETALLADA POR VERTICAL REAL

> **Verticales Excluidas por Estar en Construcción / Próximas:**
> 1. **Sueroterapia & Terapia de Infusión** (En etapa de diseño conceptual, sin implementación terminada).
> 2. **Low-Ticket / E-Commerce Directo** (En etapa de desarrollo inicial en rama experimental).

---

## 1. IPS (Institución Prestadora de Servicios de Salud)

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| CRM | Clientes | 🟢 | 45 registros reales en `clients` | `Client.php`, `ClientController.php` | PASS |
| Asistencial | Pacientes Humano | 🟢 | 50 registros reales en `patients` | `Patient.php` (campos cédula/eps) | PASS |
| Asistencial | Historias Clínicas | 🟢 | 50 registros reales en `consultations` | `Consultation.php` | PASS |
| Asistencial | Diagnósticos CIE-10 | 🟢 | 50 códigos oficiales Minsalud | `Diagnosis.php`, `DatabaseSeeder` | PASS |
| Asistencial | Recetas Médicas | 🟢 | 48 registros en `prescriptions` | `Prescription.php` | PASS |
| Asistencial | Procedimientos | 🟢 | 30 registros en `procedures` | `Procedure.php` (Consentimiento PDF) | PASS |
| Asistencial | Módulo RIPS | 🟡 | Estructura en DB | Sin generador de archivo ZIP norma 2275 | Sin prueba |
| ERP Core | Inventario Insumos | 🟢 | $19.8M COP valorizado en `products` | `Product.php`, `StockMovement.php` | PASS |
| ERP Core | Facturación & CxC | 🟢 | $402K facturado, $277K en cartera | `Invoice.php`, `AccountReceivable.php` | PASS |

---

## 2. Veterinaria (Clínica Mascotas)

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| CRM | Dueños de Mascotas | 🟢 | Registros en `clients` | `Client.php` | PASS |
| Mascotas | Expediente Mascotas | 🟢 | 60 mascotas en `patients` | `Patient.php` (relación Especie/Raza) | PASS |
| Mascotas | Especies & Razas | 🟢 | Perros/Gatos + 25 razas | `Species.php`, `Breed.php` | PASS |
| Mascotas | Carnet Vacunación | 🟢 | Registros en `clinical_applications` | `ClinicalApplication.php` | PASS |
| Mascotas | Historias Clínicas | 🟢 | Registros en `consultations` | `Consultation.php` | PASS |
| Portal | Portal del Dueño | 🟢 | Magic Link de autenticación | `PortalAuthController.php` | PASS |
| Bot | WhatsApp Cloud API | 🟢 | Webhook & Intent Resolver | `WhatsAppAgentService.php` | PASS |

---

## 3. Clínica de Medicina Estética & Spa

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| CRM | Clientes Estéticos | 🟢 | Registros en `clients` | `Client.php` | PASS |
| Estética | Procedimientos / Sesiones | 🟢 | Registros en `procedures` | `Procedure.php` | PASS |
| Estética | Recetas Cosméticas | 🟢 | Registros en `prescriptions` | `Prescription.php` | PASS |
| Estética | Fotos Antes/Después | 🟡 | Registros en `patients` (`photo`) | Endpoint `/api/patients/{id}/photo` (Sin visor slider UI) | PASS API |

---

## 4. Recursos Humanos & Gestión de Personal

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| RRHH | Ficha de Empleados | 🟢 | Registros en `users` con HRMS | `User.php` | PASS |
| RRHH | Nómina Empresarial | 🟢 | Registros en `payrolls` | `Payroll.php`, `PayrollCalculationService.php` | PASS |
| RRHH | Integración Finance | 🟢 | Afiliación CxP y egreso caja | `PayrollController.php` | PASS |
| RRHH | Asistencia / Reloj | ❌ | Tabla inexistente | Sin implementación | — |
| RRHH | Nómina DIAN XML | ❌ | No existe generador XML DIAN | Sin implementación | — |

---

## 5. Inmobiliaria & Propiedad Raíz

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| Inmuebles | Catálogo Propiedades | 🟢 | Inmuebles etiquetados en `products` | `Product.php` | PASS |
| Inquilinos | Arrendatarios | 🟢 | Registros en `clients` | `Client.php` | PASS |
| Contratos | PropertyLease Engine | 🟢 | Registros en `property_leases` | `PropertyLease.php`, `PropertyLeaseController` | PASS |
| Finanzas | Recaudo de Cánones | 🟢 | CxC mensual e ingreso a caja | `PropertyLeaseController.php` | PASS |
| Firma | Firma Digital Online | ❌ | Sin API DocuSign/FirmaYa | Sin implementación | — |

---

## 6. Escuela de Fútbol & Cantera Deportiva

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| Alumnos | Ficha de Alumno | 🟢 | Registros en `students` | `Student.php`, `StudentController.php` | PASS |
| Categorías | Equipos por Edad | 🟢 | Registros en `teams` | `Team.php`, `TeamController.php` | PASS |
| Matrículas | Inscripciones | 🟢 | Registros en `enrollments` | `Enrollment.php`, `EnrollmentController.php` | PASS |
| Asistencia | Control Entrenamientos | 🟢 | Registros en `attendances` | `Attendance.php`, `AttendanceController.php` | PASS |

---

## 7. CareNote (Salud Domiciliaria)

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| Pacientes | Adultos Mayores | 🟢 | Registros en `patients` | `Patient.php` | PASS |
| Turnos | Citas Domiciliarias | 🟢 | Registros en `appointments` | `Appointment.php` | PASS |
| Bitácora | Evolución Cuidador | 🟢 | Registros en `consultations` | `Consultation.php` | PASS |
| Medicamentos | Aplicación Domiciliaria | 🟢 | Registros en `clinical_applications` | `ClinicalApplication.php` | PASS |

---

## 8. Agencia de Viajes & Turismo

| Módulo | Funcionalidad | Estado | Evidencia BD | Evidencia Código | Prueba |
|---|---|:---:|---|---|:---:|
| Paquetes | Cotizador Turístico | 🟢 | Registros en `quotes` e ítems | `Quote.php`, `QuoteController.php` | PASS |
| CRM | Itinerarios & Deals | 🟢 | Registros en `deals` | `Deal.php`, `DealController.php` | PASS |
| Vouchers | Impresión de Recibos | 🟢 | Registros en `invoices` | `Invoice.php` | PASS |
| GDS | Conexión Sabre/Amadeus | ❌ | Sin API GDS externa | Sin implementación | — |

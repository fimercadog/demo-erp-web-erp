---
name: laravel-backend
description: Patrones de arquitectura y convenciones de backend en Laravel 11 (FormRequests, API Resources, Service Layer, Transacciones ACID, SQLite).
---

# Laravel Backend Skill

Directrices de desarrollo backend para el ERP y sus verticales en Laravel 11:

## 1. Estructura de Capas

- **Controllers:** Delgados. Manejan autenticación, llamada a FormRequests y delegan a Services.
- **FormRequests:** Validan estrictamente los datos de entrada (`rules()`) y tipos.
- **Services / Actions:** Encapsulan la lógica de negocio y transacciones (`DB::transaction`).
- **API Resources:** Transforman modelos a respuestas JSON seguras y consistentes.
- **Models:** Definen relaciones Eloquent, scopes de tenant y casts de tipos.

## 2. Convenciones de Código

- **Transacciones:** Toda operación que modifique más de una tabla debe envolverse en `DB::transaction(function () { ... })`.
- **Manejo de Errores:** Lanzar excepciones específicas de validación (`ValidationException::withMessages(...)`) o `HttpException` controladas.
- **SQLite Compatibility:**
  - Evitar tipos nativos exclusivos de MySQL (como `enum` nativo en migraciones; usar `$table->string()` con validación en FormRequest).
  - Usar timestamps estándar.
- **Multi-Tenancy:**
  - NUNCA confiar en `$request->input('company_id')`.
  - Obtener siempre `$companyId = $request->user()->company_id;`.

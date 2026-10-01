---
name: testing-suite
description: Estrategia y ejecución de pruebas automatizadas (PHPUnit 11 en Backend, Vitest en Frontend y Playwright para E2E).
---

# Testing Suite Skill

Directrices para mantener y expandir la suite de pruebas automatizadas del proyecto:

## 1. Niveles de Pruebas

```
┌────────────────────────────────────────────────────────────┐
│ 1. E2E Tests (Playwright)                                  │
│    - Flujos de usuario completos en navegador real         │
├────────────────────────────────────────────────────────────┤
│ 2. Feature / Integration Tests (PHPUnit 11)                │
│    - Endpoints HTTP, Middlewares, DB Transactions, Tenancy │
├────────────────────────────────────────────────────────────┤
│ 3. Unit Tests (PHPUnit 11 / Vitest)                        │
│    - Lógica de negocio pura, cálculos, formateo, helpers   │
└────────────────────────────────────────────────────────────┘
```

## 2. Comandos de Ejecución

- **Backend (PHPUnit):**
  ```powershell
  cd backend
  php artisan test
  # O prueba específica:
  php artisan test --filter=VeterinaryErpIntegrationTest
  ```
- **Frontend (Vitest):**
  ```powershell
  cd frontend
  npm test -- --run
  ```
- **Frontend E2E (Playwright):**
  ```powershell
  cd frontend
  npx playwright test
  ```

## 3. Principios de Cobertura

- Toda nueva funcionalidad debe incluir su correspondiente prueba de Feature.
- Nunca modificar aserciones de pruebas existentes para encubrir una regresión.

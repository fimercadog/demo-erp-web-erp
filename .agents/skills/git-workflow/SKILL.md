---
name: git-workflow
description: Flujo de trabajo de ramas Git, protección de código base (main, erp) y convenciones de commits.
---

# Git Workflow Skill

Directrices de control de versiones y seguridad de ramas:

## 1. Topología de Ramas

- `main` / `master`: Código base original del repositorio. NUNCA trabajar directamente aquí.
- `erp`: Base estable auditada del ERP Pyme V1 (`3d94855`). NUNCA modificar directamente.
- `veterinaria`: Rama de evolución clínica veterinaria sobre el ERP Core.
- `feature/*`: Ramas de corta duración para nuevas características específicas.

## 2. Convenciones de Commits

Seguir el estándar *Conventional Commits*:
- `feat(...)`: Nueva funcionalidad.
- `fix(...)`: Corrección de bug.
- `test(...)`: Adición o mejora de pruebas.
- `docs(...)`: Documentación de arquitectura o auditoría.
- `refactor(...)`: Reestructuración de código sin alterar comportamiento.

## 3. Reglas de Integridad

- Antes de dar por finalizada una tarea, verificar `git status` limpio.
- Prohibido el uso de comandos destructivos (`--force`, `reset --hard`).

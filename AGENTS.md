# Antigravity Project Instructions & Skill Discovery Policy

## 🚀 AUTOMATIC SKILL DISCOVERY & FALLBACK SEARCH POLICY

Antes de ejecutar cualquier tarea en este repositorio, Antigravity ejecutará automáticamente el siguiente protocolo de descubrimiento, búsqueda e inyección de habilidades (skills):

### 1. Clasificación por Dominio y Búsqueda Automática
1. **Clasificar el Trabajo:** Identifica automáticamente los dominios involucrados (ej. Next.js, Laravel, UI/UX Editorial, Vitest/PHPUnit, n8n, Git Worktrees, Performance, etc.).
2. **Revisar Skills Locales Primero:** Consulta el catálogo de skills disponibles en el entorno (`<skills>`).
3. **Si Existe Skill Local Relevante:**
   - Lee su `SKILL.md` mediante `view_file` antes de redactar código o modificar componentes.
   - Aplica sus instrucciones sin preguntar al usuario salvo conflicto real entre skills.
4. **Fallback Search (Si NO Existe Skill Local):**
   - Busca automáticamente una skill compatible utilizando los mecanismos de búsqueda de skills disponibles en el entorno.
   - Prioriza skills especializadas en el framework, tecnología o tarea concreta.
   - Evalúa si realmente aporta un valor claro a la tarea.
5. **Instalación de Skills Externas:**
   - Informa al usuario sobre la skill externa encontrada.
   - Solicita autorización **únicamente** si instalarla modifica el entorno global o descarga código externo.
   - Una vez instalada, lee `SKILL.md` antes de continuar.
6. **Sin Skill Adecuada:** Continúa normalmente con las reglas del proyecto sin bloquear innecesariamente la tarea.
7. **Filtrado Inteligente:** Nunca instala una skill únicamente por una coincidencia parcial de palabra del prompt.

### 2. Matriz de Prioridad de Selección
Para la selección de skills se sigue estrictamente el siguiente orden jerárquico:
1. **Skill específica de la tarea** (ej. `surgical-patch`, `systematic-debugging`, `modern-web-guidance`).
2. **Skill específica del framework** (ej. Next.js, Laravel, React).
3. **Skill del dominio técnico** (ej. UI/UX, Testing, Database, Deployment).
4. **Skill genérica** (ej. `brainstorming`, `writing-plans`).
5. **Sin skill** (ejecución directa con reglas de proyecto).

### 3. Combinación Multidominio
Para tareas complejas que abarquen múltiples áreas, combina automáticamente skills compatibles:
- **Next.js + UI/UX:** `modern-web-guidance` + `brainstorming` + `frontend-design`
- **Laravel + Bugfix:** `systematic-debugging` + `surgical-patch`
- **Automatización & Workflows:** `n8n-mcp` + `n8n-skills`
- **Pruebas Automatizadas:** `test-driven-development` + Vitest/PHPUnit

### 4. Autonomía Directa
**NO solicitar confirmación para buscar o activar skills.** La detección y activación se realiza de forma silenciosa e implícita. Solo se solicita aprobación previa cuando una instalación externa modifique el sistema o descargue paquetes externos.

### 5. Trazabilidad de Skills (Skill Traceability)
Cuando una o más skills influyan materialmente en la ejecución de una tarea:
- Registra internamente qué skills fueron leídas e influenciaron el trabajo.
- **NO interrumpas la ejecución ni al usuario** durante el proceso para anunciarlo.
- En la respuesta o resumen final, incluye al pie del reporte el bloque:
  ```text
  Skills aplicadas:
  - nombre-de-la-skill-1
  - nombre-de-la-skill-2
  ```
- Si no se utilizó ninguna skill, omite la sección por completo.
- **NUNCA inventes** haber utilizado una skill que no haya sido realmente encontrada, leída y aplicada.

---

## 🎨 PREMIUM WEB DESIGN POLICY ("Design with intent, not defaults")

Para cualquier tarea de creación, rediseño o mejora visual de una web:

1. **Cargar y combinar prioritariamente:**
   - `frontend-design` (Dirección estética fuerte, personalidad visual no genérica)
   - `ui_ux_pro_max` / `ui-ux-kit` (Paletas, fuentes, patrones UX, brief routing)
   - `modern-web-guidance` (Estándares web modernos, accesibilidad, compatibilidad)
   - `frontend-developer` (Implementación sólida en React/Next.js, responsive, performance)

2. **Para experiencias inmersivas o cinematográficas:**
   - Si el brief requiere una experiencia altamente visual o estilo Awwwards, incorporar `antigravity-design-expert` (GSAP, motion, 3D CSS).

3. **Reglas Anti-AI-Slop:**
   - 🚫 **No generar interfaces genéricas de SaaS.**
   - 🚫 **No repetir grids de cards por defecto sin intención.**
   - 🚫 **No usar tipografías, colores o layouts por defecto sin una razón visual explícita.**

4. **Definir antes de implementar:**
   - Dirección estética y concepto visual.
   - Tipografía e identidad.
   - Paleta de colores y contrastes.
   - Ritmo espacial y composición.
   - Animaciones e interacciones.
   - Elemento visual diferenciador y memorable.

5. **Verificación de Calidad al Finalizar:**
   - Layout 100% responsive.
   - Accesibilidad (contrastes, aria, navegación por teclado).
   - Core Web Vitals (CWV).
   - Consistencia visual global.
   - Ausencia total de apariencia "AI-looking UI".

---

## ⚡ TOKEN EFFICIENCY POLICY ("Less context, more relevance")

Para optimizar el uso de tokens y la respuesta de la sesión:

1. **Lectura Quirúrgica:** Leer exclusivamente los archivos y rangos de líneas necesarios.
2. **Evitar Lecturas Redundantes:** No abrir archivos completos ni volver a leer archivos comprendidos salvo modificaciones reales.
3. **Búsquedas Eficientes:** Usar `grep_search` y `find_by_name` antes de listar directorios masivos.
4. **Resumen de Logs:** No volcar logs masivos en contexto; sintetizar la evidencia relevante.
5. **Progressive Disclosure:** Activar skills solo cuando la tarea lo exija.
6. **Ignorar Archivos Pesados:** Excluir `node_modules`, `.next`, `dist`, `build`, `coverage`, `vendor`, logs y binarios via `.antigravityignore`.
7. **Recomendación de `/compress`:** Sugerir `/compress` al usuario tras concluir hitos o fases extensas antes de iniciar un nuevo bloque.

---

## 🛠️ Reglas Principales del Proyecto

1. **Aislamiento por Rama:** Trabaja strictly en la rama activa asignada (ej. `ips`, `clinica-estetica`, `veterinaria`). No modifiques ramas paralelas ni ejecutes `git commit`, `push` o `merge` sin autorización expresa.
2. **Ejecución Silenciosa:** Ejecuta las herramientas necesarias en paralelo sin comentarios intermedios. Comunica los resultados únicamente al finalizar la tarea.
3. **Verificación Empírica Obligatoria:** Nunca declares victoria sin ejecutar y confirmar comandos reales de verificación (tests de Vitest/PHPUnit, Next.js build).
4. **Identidad de Marca:** Respeta estrictamente los assets, terminología y paleta de colores de la vertical activa.

---

## 🌿 CONTEXTUAL GIT COMMIT & PUSH POLICY

Esta política es obligatoria para cualquier operación Git que implique staging, commit o push.

### 1. Detectar contexto antes de tocar Git
Antes de hacer staging, commit o push:
1. Detecta la rama activa con: `git branch --show-current`
2. Detecta la tarea actual y la vertical actual (`ips`, `clinica-estetica`, `veterinaria`, `erp`).
3. Clasifica los cambios en:
   - propios de la rama actual;
   - compartidos necesarios;
   - pertenecientes a otra vertical;
   - temporales/generados;
   - dudosos.

### 2. Prohibido `git add .` indiscriminado
Nunca usar `git add .` o `git add -A` sin haber clasificado previamente los archivos. El staging debe hacerse por archivos explícitos o grupos verificados.

### 3. Regla por rama
- **Rama `ips`:** Incluir únicamente cambios, assets, configuración y documentación IPS, más compartidos necesarios para IPS. Excluir estrictamente veterinaria, clínica estética, assets aesthetic/veterinarian y documentación de otras verticales.
- **Rama `clinica-estetica`:** Incluir únicamente cambios de medicina estética, assets aesthetic, config y doc estética. Excluir IPS y veterinaria.
- **Rama `veterinaria` / `veterinaria-redesign`:** Incluir únicamente cambios, assets y documentación veterinaria. Excluir IPS y clínica estética.

### 4. Archivos compartidos
Si un archivo compartido (`admin-shell.tsx`, `page.tsx`, `marketing-data.tsx`, `vertical-config.ts`, `globals.css`) contiene cambios de varias verticales:
- NO añadirlo automáticamente.
- Revisar diff, identificar qué partes pertenecen a la rama activa, separar cambios si es necesario y evitar contaminar el commit.

### 5. Auditoría antes de commit
Siempre ejecutar:
```bash
git status
git diff --stat
git diff --name-only
```
Después de staging:
```bash
git diff --staged --stat
git diff --staged --name-only
```
Verificar que no haya archivos cruzados.

### 6. Naming de commits (Conventional Commits con scope por vertical)
- IPS: `feat(ips): ...`, `fix(ips): ...`, `docs(ips): ...`
- Clínica Estética: `feat(aesthetic): ...`, `fix(aesthetic): ...`, `docs(aesthetic): ...`
- Veterinaria: `feat(vet): ...`, `fix(vet): ...`, `docs(vet): ...`

### 7. Push contextual
- NUNCA usar `git push --all`.
- Hacer push únicamente de la rama activa: `git push origin <rama-activa>`.

### 8. Un trabajo = un commit contextual
No mezclar en un mismo commit diseño, deployment, documentación, fixes no relacionados o cambios de otra vertical. Commits pequeños y coherentes.

### 9. Archivos dudosos
Si un archivo no puede clasificarse con certeza: NO stagearlo. Reportarlo como *"Archivo dudoso — requiere revisión"* antes de continuar.

### 10. Antes de push
1. Confirmar rama activa.
2. Confirmar commit actual.
3. Confirmar staging limpio.
4. Ejecutar tests relevantes (PHPUnit, Vitest).
5. Ejecutar build si corresponde (`npm run build`).
6. Revisar `git status`.
7. Push solo de la rama activa.

### 11. No merge automático
Nunca hacer merge automático entre `erp`, `ips`, `clinica-estetica`, `veterinaria` o `veterinaria-redesign`. Los merges entre verticales requieren autorización explícita.

### 12. Reporte final
Después de un commit/push, incluir:
- **Rama:** `<nombre>`
- **Commit:** `<hash + mensaje>`
- **Archivos incluidos:** `<lista breve>`
- **Archivos excluidos deliberadamente:** `<lista breve>`
- **Push:** `<remote/rama>`
- **Tests:** `<resultado>`
- **Build:** `<resultado>`

---

## 🚀 AUTO COMMIT & PUSH PER FUNCTIONALITY

Cuando una funcionalidad quede completamente terminada:

1. **Verificación previa:**
   - La funcionalidad está 100% completa.
   - Los tests relevantes pasan (PHPUnit / Vitest).
   - El build compila sin errores (`npm run build`).
   - Cero archivos de otras verticales en staging.
   - Rama activa confirmada.

2. **Acción automática:**
   - Staging contextual selectivo de archivos de la funcionalidad (NUNCA `git add .` o `git add -A`).
   - Commit semántico con scope (`feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`).
   - Push exclusivo a la rama activa: `git push origin <rama-activa>` (NUNCA `git push --all`).

3. **Restricciones:**
   - NO auto-commit si hay tests fallando, archivos dudosos o incompletos.
   - NO auto-commit si el usuario indicó pausar o no commitear todavía.

4. **Reporte post-commit/push:**
   - Rama
   - Commit (hash + mensaje)
   - Archivos incluidos
   - Tests
   - Push realizado



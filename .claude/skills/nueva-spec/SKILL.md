---
name: nueva-spec
description: Redacta una spec nueva en docs/specs/ a partir de historias y tickets del backlog, con reglas DEBE/NO DEBE, tabla criterio → verificación y tabla ticket → archivos. Úsala antes de implementar cualquier funcionalidad.
disable-model-invocation: true
argument-hint: "<número> <nombre-corto> <HU o tickets que cubre>"
---

# Nueva spec

Argumentos: `$ARGUMENTS` (por ejemplo `03 deuda-tecnica D-1 D-2 D-3`).

1. Lee `AGENTS.md`, el PRD de `docs/prd/`, `docs/backlog/epicas.md` y la historia o el ticket indicados en
   `docs/backlog/`. Si la historia no tiene criterios DADO / CUANDO / ENTONCES, detente y pide refinarla.
2. Si la spec es de frontend, lee también `DESIGN.md`.
3. Crea `docs/specs/<número>-<nombre-corto>.md` con estas secciones y **sin escribir código**:
   1. **Alcance**: historias y tickets que cubre, y lo que queda fuera.
   2. **Contratos**: modelos, endpoints o componentes, con sus entradas, salidas y errores (400, 404, 409, 500).
   3. **Reglas**: una lista por historia con **DEBE** / **NO DEBE**. Cada regla de negocio del PRD aparece aquí.
   4. **Criterio → verificación**: una fila por criterio de aceptación, con un id `CA-x.y`, el tipo de
      verificación (test de dominio, test de integración, curl, revisión manual) y el archivo de prueba previsto.
   5. **Ticket → archivos**: una fila por ticket con los archivos que creará o modificará.
4. Revisa que cada criterio de la historia tenga al menos una fila de verificación y que cada regla DEBE
   tenga su criterio. Señala lo que no cuadre como «Punto abierto».
5. Muestra la spec a la persona y sugiere el commit `docs(E2): spec <número> <nombre-corto>`. No lo hagas tú.

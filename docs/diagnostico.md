# Diagnóstico del Proyecto 3 antes de la épica E2

Fecha: 11 de noviembre de 2026. Rama: `feature/e2-metas-rachas`, creada desde `main` (`a366fea`).

El agente (Claude Code) leyó el código del backend y del frontend, el README, las pruebas y el `render.yaml`, ejecutó las comprobaciones y entregó el estado del proyecto y la tabla de problemas. Las decisiones de qué bloquea la épica E2 y qué se difiere son mías y están justificadas abajo.

## 1. Estado del Proyecto 3

| Área | Estado | Evidencia |
| --- | --- | --- |
| Backend (Express 5 + TypeScript + Mongoose 8) | Funciona. Capas `routes → controllers → services → models`, middlewares `requestId`, `logger` y `errorHandler` | `backend/src/` |
| Modelos | `Videojuego` con `logros` embebidos (0 a 50) y `Partida` referenciada con validaciones | `models/Videojuego.ts`, `models/Partida.ts` |
| Resumen calculado | Correcto: total, horas redondeadas a un decimal, última fecha y avance de la partida más reciente | `services/videojuegos.service.ts:64-74` |
| Pruebas | 41 tests de integración con Vitest + supertest + mongodb-memory-server; **todos pasan** (3,2 s) | `npx vitest run` |
| Compilación | `tsc` sin errores en backend y frontend | `npx tsc --noEmit`, `npx tsc -b` |
| Frontend (React 19 + Vite 7) | Cinco pantallas, servicios por recurso y estados de carga, error y vacío | `frontend/src/pages/`, `frontend/src/api/` |
| Despliegue | API y sitio estático vivos en Render; `/api/health` responde 200 (arranque en frío de 32 s) | `render.yaml`, URLs del README |
| Git | `main` con un PR integrado (#1) y commits por capa | `git log` |

En resumen: el Proyecto 3 está completo y estable. La épica E2 se puede construir encima sin rehacer nada. Lo que falta es el harness del agente, la cadena SDD y algunas piezas puntuales que la épica necesita.

## 2. Tabla de problemas

| # | Problema | Evidencia | ¿Bloquea E2? | Decisión |
| --- | --- | --- | --- | --- |
| P-01 | No hay harness para el agente: faltan `AGENTS.md`, `CLAUDE.md`, skills, hooks y `DESIGN.md` | Raíz del repositorio | **Bloquea** | Se completa en la fase 2 |
| P-02 | No hay documentación SDD (PRD, épicas, historias, specs ni auditoría) | No existe `docs/` salvo capturas | **Bloquea** | Se completa en las fases 3 a 5 y 9 |
| P-03 | `HttpError` solo admite los estados 400 y 404, y `TipoError` no tiene un tipo de conflicto. No se puede responder 409 | `backend/src/errors.ts:4`, `middleware/errorHandler.ts` | **Bloquea** (regla de una meta activa) | Se completa en el ticket T-02 |
| P-04 | No hay capa de dominio: el resumen se calcula dentro del servicio, mezclado con la consulta a MongoDB, y solo se puede probar con base de datos | `services/videojuegos.service.ts:64-74` | Bloquea parcialmente: los hitos dependen de `porcentajeAvanceActual` | **Deuda pagada D-1**: extraer `calcularResumen` a `src/dominio/resumen.ts` con tests puros |
| P-05 | `Partida` acepta fechas futuras: una sesión «de mañana» alargaría la racha y contaría en una semana que no ha ocurrido | `models/Partida.ts:5` | Afecta la exactitud de la racha | **Deuda pagada D-2**: rechazar fechas futuras (con 5 minutos de tolerancia) |
| P-06 | Los estilos usan colores escritos a mano: `styles.css` declara 6 variables pero contiene **89 colores hexadecimales (71 distintos)** | `frontend/src/styles.css` | Choca con «estilos solo desde las variables de DESIGN.md» | **Deuda pagada D-3**: `tokens.css` + migración de los colores + test que impide colores literales |
| P-07 | El frontend no permite editar una partida, aunque la API sí lo hace (`PUT/PATCH /api/partidas/:id`) | `frontend/src/pages/`, `api/partidasApi.ts:12` | **Bloquea**: la E2 exige reconsultar el progreso al editar una partida | Se completa en el ticket T-09 |
| P-08 | Al eliminar un videojuego se borran sus partidas con dos operaciones sin transacción | `services/videojuegos.service.ts:39-44` | No | **Se difiere**: aplicación de uso personal, riesgo de concurrencia mínimo. Al agregar metas se mantiene el mismo patrón |
| P-09 | El frontend no tiene tests automatizados de componentes | `frontend/package.json` | No (la E2 exige tests de dominio en el backend) | **Se difiere** |
| P-10 | Las confirmaciones de P3 usan `window.confirm`, que no se puede estilizar con el sistema de diseño | `pages/VideojuegoDetalle.tsx:61`, `PartidasLista.tsx:15` | No | **Se difiere** para P3. La E2 usa una confirmación en línea propia |
| P-11 | Las fechas se muestran y se capturan en la zona horaria del dispositivo, mientras que la E2 agrupa los días en hora de Ecuador | `components/PartidasTabla.tsx:4`, `PartidaFormulario.tsx:148` | No: la persona usuaria está en Ecuador | **Se difiere** y se documenta como supuesto en el PRD |
| P-12 | Los espaciados, radios y tamaños del CSS heredado también son literales | `frontend/src/styles.css` | No | **Se difiere**: D-3 migra los colores. Los componentes nuevos de E2 usan tokens de espacio y radio |
| P-13 | Render (plan gratuito) tarda unos 30 s en el primer arranque | `curl` a `/api/health`: 32 s | No | **Se difiere**: es una limitación del plan |
| P-14 | «Logros» (marcados a mano) y los futuros «hitos» (calculados) pueden confundirse | `models/Videojuego.ts` y ficha E2 | No | Se mitiga con lenguaje distinto en DESIGN.md y en el PRD |

## 3. Decisiones tomadas

1. **No se reescribe nada de E1.** El modelo de `Videojuego` y `Partida`, el resumen, las capas y el `errorHandler` se mantienen. Solo se tocan para corregir P-03, P-04 y P-05.
2. **Lo que bloquea se completa dentro de la épica E2:** P-01 y P-02 en las fases de harness y documentación, P-03 en el ticket de errores y P-07 en el ticket de edición de partidas.
3. **Se pagan tres deudas con el ciclo completo** (criterio, test, código y verificación): D-1 (P-04), D-2 (P-05) y D-3 (P-06). Elegí estas porque cada una mejora directamente la épica: la capa de dominio, la exactitud de la racha y el uso de los tokens.
4. **El resto queda en la sección «Deuda técnica» del backlog** (`docs/backlog/E2-metas-y-rachas.md`), cada problema con su motivo para diferirlo.
5. **El código existente se formatea una sola vez con Prettier** al instalar el hook, en un commit separado, para que los diffs de la épica muestren solo cambios reales.

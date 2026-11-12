# Spec 03 · Deuda técnica pagada en la épica E2

## 1. Alcance

Paga tres problemas de [docs/diagnostico.md](../diagnostico.md) con el ciclo completo: criterio, test que falla, código y verificación. Tickets T-12, T-13 y T-14. El resto de la deuda queda diferida en el [backlog](../backlog/E2-metas-y-rachas.md#deuda-técnica).

| Deuda | Problema | Ticket |
| --- | --- | --- |
| D-1 | P-04 · El resumen se calcula dentro del servicio, mezclado con la consulta, sin tests puros | T-12 |
| D-2 | P-05 · `Partida` acepta fechas futuras | T-13 |
| D-3 | P-06 · 89 colores literales en `styles.css` | T-14 |

## 2. D-1 · Resumen en la capa de dominio

**Contrato:** `calcularResumen(partidas)` en `backend/src/dominio/resumen.ts`, pura. Recibe `{ fecha, duracionMinutos, porcentajeAvance, createdAt?, _id? }[]` en cualquier orden y devuelve `{ totalPartidas, horasTotales, ultimaPartida, porcentajeAvanceActual }` con las fórmulas del README de E1.

- **DEBE** ordenar por `fecha` descendente, luego `createdAt` descendente y luego `_id` descendente para elegir la partida más reciente (mismo desempate que E1).
- **DEBE** devolver `{ 0, 0, null, 0 }` sin partidas.
- **DEBE** ser usada por `resumen()` y por el servicio de progreso, que obtiene el avance actual de las mismas partidas que ya consultó, sin una segunda consulta.
- **NO DEBE** cambiar la respuesta de `GET /api/videojuegos/:id/resumen`.

| Criterio | Verificación |
| --- | --- |
| CA-D1.1 Suma, redondeo, última fecha y avance de la partida más reciente aunque llegue desordenada | Test puro `backend/tests/dominio/resumen.test.ts` |
| CA-D1.2 Empate de fechas resuelto por creación e id | Test puro |
| CA-D1.3 Sin partidas → ceros y `null` | Test puro |
| CA-D1.4 La respuesta HTTP del resumen no cambia | Tests de E1 en `backend/tests/api.test.ts` |
| CA-D1.5 El progreso usa la misma función | Revisión de código de `services/progreso.service.ts` |

## 3. D-2 · Partidas sin fecha futura

- **DEBE** rechazar con 400 (`VALIDACION`) una partida cuya fecha sea posterior a ahora más 5 minutos, al crear y al editar.
- **DEBE** aceptar fechas pasadas y la hora actual (la tolerancia cubre relojes desfasados entre el dispositivo y el servidor).
- **DEBE** limitar el campo de fecha del formulario de partidas con `max` igual a la hora actual.

| Criterio | Verificación |
| --- | --- |
| CA-D2.1 Crear con fecha futura → 400 y no se guarda | Test de integración en `backend/tests/api.test.ts` |
| CA-D2.2 Editar a una fecha futura → 400 y conserva la fecha anterior | Test de integración |
| CA-D2.3 Fecha actual o pasada → se acepta | Test de integración |
| CA-D2.4 El formulario no ofrece fechas futuras | Revisión manual del `max` del campo |

## 4. D-3 · Colores de `styles.css` desde tokens

- **DEBE** reemplazar cada color literal de `styles.css` por una variable de `tokens.css` según la tabla de color de DESIGN.md.
- **DEBE** eliminar las variables antiguas (`--primario`, `--primario-oscuro`, `--suave`, `--borde`, `--blanco`, `--radio`) y usar las de `tokens.css`.
- **NO DEBE** quedar ningún color literal (hexadecimal, `rgb()`, `hsl()`, `white` o `black`) en un CSS distinto de `tokens.css`.
- **DEBE** mantener la identidad visual de E1. Los únicos cambios visibles permitidos son los de accesibilidad que pide DESIGN.md: borde de campos de 3:1, foco de 3:1 y placeholders de 4,5:1.

| Criterio | Verificación |
| --- | --- |
| CA-D3.1 Sin colores literales fuera de `tokens.css` | Test `frontend/tests/tokens.test.mjs` (falla antes del cambio) |
| CA-D3.2 Sin variables antiguas en uso | Test `frontend/tests/tokens.test.mjs` |
| CA-D3.3 Cada `var(--…)` usado existe en `tokens.css` | Test `frontend/tests/tokens.test.mjs` |
| CA-D3.4 Las pantallas de E1 conservan su identidad | Revisión manual de biblioteca, detalle y formularios |

## 5. Ticket → archivos

| Ticket | Archivos |
| --- | --- |
| T-12 | `backend/tests/dominio/resumen.test.ts` (primero), `backend/src/dominio/resumen.ts`, `backend/src/services/videojuegos.service.ts`, `backend/src/services/progreso.service.ts` |
| T-13 | `backend/tests/api.test.ts` (primero), `backend/src/models/Partida.ts`, `frontend/src/pages/PartidaFormulario.tsx` |
| T-14 | `frontend/tests/tokens.test.mjs` (primero), `frontend/src/styles.css` |

# Diario de Progreso Gamer

## Proyecto
App web para registrar videojuegos y partidas, ver un resumen de progreso (E1) y fijar metas semanales con rachas e hitos (E2 · Metas y rachas). Una sola persona usuaria, en Ecuador.

## Stack
- Backend: Node 20+, Express 5, TypeScript, Mongoose 8 (MongoDB Atlas), CommonJS.
- Frontend: React 19, TypeScript, Vite 7, React Router 7. CSS plano.
- Tests: Vitest + supertest + mongodb-memory-server (backend); `node --test` (frontend).
- Formato: Prettier (hook automático). Despliegue: Render (`render.yaml`).

## Estructura
- `backend/src/models/` esquemas · `services/` reglas y consultas · `controllers/` HTTP · `routes/` rutas.
- `backend/src/dominio/` funciones puras sin base de datos (resumen, semana, racha, hitos).
- `backend/src/middleware/` requestId, logger, errorHandler · `backend/tests/` pruebas.
- `frontend/src/api/` servicios HTTP (`*Api.ts`) · `pages/` pantallas · `components/` piezas · `styles/` tokens.
- `docs/` diagnóstico, PRD, backlog, specs, auditoría y bitácora del agente.

## Comandos
- `npm --prefix backend run dev` — API en http://localhost:3000/api (requiere `backend/.env`).
- `npm --prefix backend test` — tests de dominio e integración (MongoDB en memoria).
- `npm --prefix frontend run dev` — cliente en http://localhost:5173.
- `npm --prefix frontend test` — tests del frontend (tokens de diseño).
- `npm run format` — Prettier en todo el código.

## Convenciones
- Dominio en español y camelCase (`meta`, `partida`, `rachaActual`). Rutas REST bajo `/api`.
- Capas: el controlador no calcula; el servicio consulta y llama al dominio; el dominio no importa Mongoose.
- Errores con `HttpError` y `errorHandler`: 400 validación/id, 404 no encontrado, 409 conflicto, 500 interno.
- Fechas: se guardan en UTC; los días y semanas se calculan en `America/Guayaquil` (lunes a domingo).
- Commits Conventional Commits en español; los de implementación nombran su ticket: `feat(E2): T-03 …`.

## Reglas
- Nunca leer ni modificar `.env` (hay un hook que lo bloquea). Nunca escribir credenciales en el código.
- Ninguna funcionalidad sin una spec en `docs/specs/`, y la spec se commitea antes que su código.
- Los tests de una función de dominio se escriben antes que la función.
- Ejecutar los tests (`npm test` en backend y frontend) antes de dar una tarea por terminada.
- No cambiar `Videojuego`, `Partida` ni el resumen de E1 salvo por un problema de `docs/diagnostico.md`.
- No hacer `git push` ni abrir PR sin que la persona lo pida.

## Frontend
- Antes de crear o modificar algo en `frontend/`, lee `DESIGN.md` y la spec vigente en `docs/specs/`.
- Colores, espacios, radios y fuentes solo desde `frontend/src/styles/tokens.css`; nada de colores literales.
- Sin librerías de UI, de CSS ni de gráficos. Las páginas usan los servicios de `src/api/`, nunca `fetch`.
- Cada pantalla que consulta la API muestra carga, error con reintento y estado vacío.

## Skills del proyecto
- `/commit` — commit con el ticket en el mensaje y sin secretos.
- `/nueva-spec` — crea una spec con reglas DEBE/NO DEBE y tablas de trazabilidad.

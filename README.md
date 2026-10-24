# Diario de Progreso Gamer

**Alexander · Universidad San Francisco de Quito · Desarrollo Web 3**  
Entregable 3 · Fecha límite: **23 de octubre de 2026, 23:59 (Ecuador)**.

Una biblioteca personal para responder: **¿qué estoy jugando, cuánto tiempo le he dedicado y qué tan avanzado voy?** Permite registrar videojuegos, anotar sesiones, consultar un resumen calculado y marcar logros.

## Estado de la entrega y ramas

El repositorio es local y no tiene remoto. `main` contiene el backend, sus pruebas, el Blueprint y la documentación. **`feature/frontend` contiene además el frontend completo y se entrega activa, sin fusionar.** Para ejecutar ambos, usa esa rama. Alexander debe publicar las dos ramas en su propio GitHub, abrir el pull request `feature/frontend → main` e integrarlo antes de conectar Render. No se creó repositorio de GitHub, no se hizo push y todavía no existe evidencia de PR ni despliegue público.

Consulta [PROGRESS.md](PROGRESS.md) para los comandos y resultados de verificación.

Después de crear un repositorio **vacío** en tu cuenta de GitHub (sin README ni `.gitignore` iniciales), desde esta carpeta ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
git push -u origin feature/frontend
```

En GitHub abre **Compare & pull request**: base `main`, compare `feature/frontend`. Revisa los commits por pantalla e integra el PR conservando sus commits (**Create a merge commit**). Guarda el enlace del PR como evidencia; después conecta `main` al Blueprint de Render. Para sincronizar tu copia local después de la integración: `git switch main` y `git pull --ff-only origin main`. Estos comandos quedan documentados para el operador; no se ejecutaron durante la preparación.

## Modelo de datos y decisiones

### Videojuego

| Campo | Tipo y validación |
| --- | --- |
| `nombre` | String obligatorio, sin espacios al inicio/final; no acepta solo espacios |
| `plataforma` | Enum obligatorio: `PC`, `PlayStation`, `Xbox`, `Switch`, `Movil` |
| `genero` | Enum obligatorio: `accion`, `rol`, `estrategia`, `puzzle`, `deportes`, `otro` |
| `estado` | Enum obligatorio: `jugando`, `pausado`, `completado`, `abandonado`; por defecto `jugando` |
| `logros` | Arreglo de subdocumentos `{ _id, nombre, obtenido }`; nombre obligatorio, obtenido booleano (por defecto false) |
| `createdAt`, `updatedAt` | Timestamps automáticos |

**Los logros se embeben** porque forman una lista corta y acotada que pertenece exclusivamente a un videojuego. Se leen junto a su ficha y no requieren búsquedas ni ciclo de vida independientes. El `_id` propio de cada subdocumento permite actualizar solo su estado obtenido.

### Partida

| Campo | Tipo y validación |
| --- | --- |
| `videojuego` | ObjectId obligatorio, `ref: "Videojuego"`; el servicio verifica que exista |
| `fecha` | Date obligatorio y válido |
| `duracionMinutos` | Number obligatorio, mínimo 1 minuto |
| `porcentajeAvance` | Number obligatorio, mínimo 0 y máximo 100 |
| `notas` | String opcional |
| `createdAt`, `updatedAt` | Timestamps automáticos |

**Partida se referencia** porque el historial crece sin límite: meses de sesiones no deben agrandar indefinidamente un único documento. Además, las partidas se consultan de forma independiente (lista global) y por juego (ruta anidada). `populate("videojuego")` incluye la ficha en la consulta global. Al eliminar un juego se eliminan sus partidas para evitar referencias huérfanas. Son dos operaciones de base de datos, sin transacción; esta aplicación académica supone uso personal y no ofrece atomicidad entre borrado y creaciones concurrentes.

### Resumen: fórmula exacta

La lógica vive en `backend/src/services/videojuegos.service.ts`, nunca en el controlador ni en el cliente. Se consulta el conjunto P de partidas del videojuego:

- `totalPartidas = P.length`.
- `horasTotales = Math.round((sum(P.duracionMinutos) / 60) * 10) / 10`.
- `ultimaPartida = fecha de la partida con fecha más reciente`.
- `porcentajeAvanceActual = porcentajeAvance de esa misma partida`, aunque sea menor que un avance anterior. No es el promedio ni el máximo.

Se ordena por `fecha DESC`, después `createdAt DESC` y finalmente `_id DESC` para resolver empates de forma determinista. Sin partidas: `{ "totalPartidas": 0, "horasTotales": 0, "ultimaPartida": null, "porcentajeAvanceActual": 0 }`. El resumen se calcula con cada GET; después de guardar una partida el frontend vuelve al detalle y vuelve a consultar el resumen. No hay caché ni mecanismo de actualización entre navegadores en tiempo real.

## Arquitectura

```text
backend/src/
  config/env.ts        # carga y validación de variables
  conexionDB.ts        # conexión MongoDB separada
  routes/ → controllers/ → services/ → models/
  middleware/          # requestId, logger, errorHandler
  scripts/             # seed y demostración con MongoDB en memoria
frontend/src/
  api/                 # cliente HTTP y servicios por recurso
  components/          # navegación y estados reutilizables
  pages/               # biblioteca, detalle, formulario, historial, nueva partida
```

Express 5 propaga los errores de controladores asíncronos al middleware central. Cada solicitud recibe `X-Request-Id`, también incluido en los errores y registros. Las páginas solo consumen servicios de `src/api`; los formularios son controlados. Las consultas muestran carga, error con reintento y ausencia de datos. Las etiquetas se muestran en español aunque los enums se envían exactamente como en la consigna.

## Instalación y ejecución local

Requisitos: Node.js **22.12 o superior** (verificado con 22.23.3), npm, MongoDB Atlas o una instancia local y dos terminales.

```bash
git switch feature/frontend
cd backend
npm ci
cp .env.example .env
```

Completa `backend/.env`: `MONGODB_URI` con tu cadena de conexión y una base de datos dedicada; `FRONTEND_URL=http://localhost:5173`; `PORT=3000`; `NODE_ENV=development`. Nunca publiques `.env`. En Atlas, crea un usuario de base de datos con acceso a esa base y permite tu IP de desarrollo en Network Access.

```bash
# Desde backend/
npm run seed
npm run dev
```

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm ci
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api
npm run dev
```

Abre `http://localhost:5173`. La variable `VITE_API_URL` incluye `/api` y se integra al compilar. `FRONTEND_URL` es el origen del frontend, sin ruta ni barra final. Vite usa puerto 5173 estricto para mantener coherencia con CORS.

### Comprobaciones

```bash
cd backend
npm test
npm run build
npm run demo:memoria
# En otra terminal, desde la raíz:
cd frontend
npm run build
```

`npm test` usa Vitest + supertest + mongodb-memory-server, una base efímera aislada y sin credenciales. Cubre todas las rutas, validaciones, populate, filtros, logros, resumen vacío y actualización después de agregar una partida; provoca también un error inesperado mediante mock de la base de datos, sin exponer rutas de fallo en producción. La primera ejecución descarga el binario de MongoDB y necesita acceso a Internet. La caché de binarios de prueba está en `/tmp/diario-mongodb-binaries`.

`npm run demo:memoria` inicia MongoDB temporal, asigna su URI al entorno del proceso, utiliza la misma conexión y aplicación Express, ejecuta el seed, abre un puerto HTTP efímero, solicita el resumen y comprueba su respuesta. Cierra servidor y base al terminar. No modifica Atlas. `npm run seed` utiliza exclusivamente `MONGODB_URI` del entorno: es repetible, no vacía colecciones y crea **Hollow Knight (demo)** con tres sesiones (235 minutos → 3.9 horas; avance 38 %).

## API REST

Base local: `http://localhost:3000/api`. POST devuelve 201, DELETE 204, las demás operaciones correctas 200.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/health` | Salud de API y conexión a MongoDB (200 o 503) |
| GET | `/videojuegos?nombre=&estado=&plataforma=&genero=` | Listar, con filtros opcionales combinables |
| GET | `/videojuegos/:id` | Obtener ficha |
| POST | `/videojuegos` | Crear ficha |
| PUT / PATCH | `/videojuegos/:id` | Actualizar campos enviados, validándolos |
| DELETE | `/videojuegos/:id` | Eliminar juego y sus sesiones |
| PATCH | `/videojuegos/:id/logros/:logroId` | Actualizar con `{ "obtenido": true }` o false |
| GET | `/videojuegos/:id/partidas` | Historial del videojuego, fecha descendente |
| GET | `/videojuegos/:id/resumen` | Resumen calculado con los cuatro campos de la consigna |
| GET | `/partidas` | Listar todas, con populate del videojuego |
| GET | `/partidas/:id` | Obtener una, con populate |
| POST | `/partidas` | Crear, comprobando referencia existente |
| PUT / PATCH | `/partidas/:id` | Actualizar, comprobando referencia y validaciones |
| DELETE | `/partidas/:id` | Eliminar sesión |

PUT y PATCH actualizan los campos enviados y conservan los restantes; los campos del modelo se permiten explícitamente. `nombre` busca texto literal sin distinguir mayúsculas. Los filtros de enum usan coincidencia exacta.

### Errores centralizados

| Tipo (`error.tipo`) | HTTP | Ejemplo |
| --- | --- | --- |
| `VALIDACION` | 400 | Nombre vacío, enum inválido, minutos < 1 o avance fuera de 0–100 |
| `ID_MALFORMADO` | 400 | ObjectId o cast de valor inválido (incluye fechas inválidas) |
| `NO_ENCONTRADO` | 404 | Juego referenciado inexistente, recurso o logro ausente |
| `INTERNO` | 500 | Fallo inesperado de base de datos; no se filtran detalles internos |

Ejemplo: `{ "error": { "tipo": "NO_ENCONTRADO", "mensaje": "No se encontró el videojuego.", "requestId": "…" } }`. Errores de esquema incluyen `detalles` en español. El logger registra método, ruta, status, duración y requestId, sin cuerpo ni URI de MongoDB.

## Despliegue en Render con Blueprint

1. Publica el repositorio en tu GitHub e integra `feature/frontend → main` mediante un pull request. Conserva el PR como evidencia de la rúbrica.
2. En MongoDB Atlas, prepara una base dedicada y un usuario con permisos de lectura/escritura. Configura Network Access con las IP de salida del Web Service de Render (visibles en su panel). Copia la URI únicamente al panel de variables de Render; sustituye los datos del usuario, contraseña y base de datos.
3. En Render entra a **New → Blueprint**, conecta tu repositorio, selecciona `main` y usa el archivo `render.yaml` de la raíz. Cambia los nombres de servicios si ya están ocupados; las URLs finales las asigna Render.
4. El Blueprint declara un **Web Service Node** (`backend/`) y un **Static Site** (`frontend/`). En los valores solicitados (`sync: false`) ingresa `MONGODB_URI`, `FRONTEND_URL` (origen público HTTPS del sitio) y `VITE_API_URL` (URL pública HTTPS de la API terminada en `/api`). Si aún no conoces las URLs, completa con valores provisionales sin secretos y corrígelos en el paso siguiente.
5. Una vez asignadas las URLs reales, en **Environment** del backend configura `FRONTEND_URL=https://TU-SITIO.onrender.com` (sin barra final). En el frontend configura `VITE_API_URL=https://TU-API.onrender.com/api`. Reinicia/redeploy del backend y ejecuta **Deploy latest commit** del frontend para recompilar Vite. No uses hostnames internos de Render en el navegador.
6. El backend compila con `npm ci --include=dev && npm run build` y arranca con `npm start`. Render proporciona `PORT`; se escucha en `0.0.0.0`. El frontend compila igual y sirve `./dist`; la regla `/* → /index.html` permite abrir rutas de React Router directamente.
7. Verifica `https://TU-API.onrender.com/api/health`, luego abre la biblioteca en el sitio. Crea un juego, registra tres partidas, confirma el resumen y marca un logro. Recarga una ruta de detalle directamente para comprobar la reescritura y revisa la consola del navegador para comprobar CORS.
8. Para datos iniciales en Atlas, configura tu `.env` local con la base de producción y ejecuta `npm run seed` desde `backend/`. Usa una base propia del proyecto; no se borran datos existentes. Actualiza las URLs de abajo y guarda evidencia de la demo y del PR.

Los valores `sync: false` se piden al crear el Blueprint; si agregas variables después, configúralas manualmente en cada servicio. Referencias oficiales: [especificación Blueprint](https://render.com/docs/blueprint-spec), [monorepos](https://render.com/docs/monorepo-support) y [reescrituras](https://render.com/docs/redirects-rewrites).

## Guion de demostración

1. Crear un videojuego con plataforma, género, estado y dos logros.
2. Abrir su detalle: comprobar el resumen vacío (ceros y última partida sin registrar).
3. Registrar una partida con fecha, 60 minutos y 20 %; volver al detalle y mostrar 1 partida, 1.0 horas y 20 %.
4. Agregar otras dos sesiones con fechas posteriores; explicar que el avance actual corresponde a la fecha más reciente.
5. Marcar un logro como obtenido y recargar para demostrar persistencia.
6. Mostrar el historial global con nombres de videojuegos (populate), el filtro de biblioteca, la edición y el PR integrado.

## Capturas de la verificación local

- [Detalle y resumen en escritorio](docs/capturas/detalle-escritorio.png).
- [Detalle en móvil](docs/capturas/detalle-movil.png).
- [Biblioteca en móvil](docs/capturas/biblioteca-movil.png).

El flujo se comprobó en Chromium sobre la compilación de producción, con API y base de datos temporales. Las capturas son evidencia local; el despliegue y la demo pública siguen pendientes.

## URLs públicas

Completar después del despliegue; **estos servicios aún no se han publicado**.

- Frontend: **PENDIENTE — pegar URL pública de Render**.
- Backend: **PENDIENTE — pegar URL pública de Render**.
- Health: **PENDIENTE — URL del backend + `/api/health`**.
- Repositorio GitHub: **PENDIENTE**.
- Pull request integrado: **PENDIENTE**.
- Demo en vivo o grabada: **PENDIENTE**.

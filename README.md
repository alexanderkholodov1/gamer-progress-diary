# Diario de Progreso Gamer

**Alexander · Universidad San Francisco de Quito · Desarrollo Web 3**  
Entregable 3 · Fecha límite: **23 de octubre de 2026, 23:59 (Ecuador)**.

Una biblioteca personal para responder: **¿qué estoy jugando, cuánto tiempo le he dedicado y qué tan avanzado voy?** Permite registrar videojuegos, anotar sesiones, consultar un resumen calculado y marcar logros.

## Ramas e integración

`main` es la rama de integración y despliegue. Contiene el backend, sus pruebas, el Blueprint de Render y la documentación. La rama `feature/frontend` contiene el frontend completo y se integra en `main` mediante un pull request con base `main` y comparación `feature/frontend`.

La integración utiliza **Create a merge commit** para conservar los commits organizados por capa y pantalla. El despliegue del proyecto completo se realiza desde `main` después de integrar el pull request. La sección «URLs públicas» reúne los enlaces del proyecto y se completa después del despliegue.

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

Requisitos: Node.js **22.12 o superior**, npm, MongoDB Atlas o una instancia local y dos terminales.

```bash
git switch feature/frontend
cd backend
npm ci
cp .env.example .env
```

Configuración de `backend/.env`: `MONGODB_URI` con la cadena de conexión y una base de datos dedicada; `FRONTEND_URL=http://localhost:5173`; `PORT=3000`; `NODE_ENV=development`. `.env` contiene configuración privada y está excluido del control de versiones. En Atlas se requiere un usuario con acceso a esa base y la IP de desarrollo autorizada en Network Access.

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

El frontend local está disponible en `http://localhost:5173`. La variable `VITE_API_URL` incluye `/api` y se integra al compilar. `FRONTEND_URL` es el origen del frontend, sin ruta ni barra final. Vite usa puerto 5173 estricto para mantener coherencia con CORS.

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

1. El código se aloja en GitHub y la rama `feature/frontend` se integra en `main` mediante un pull request. El enlace del PR documenta la integración.
2. MongoDB Atlas requiere una base dedicada y un usuario con permisos de lectura/escritura. Network Access debe autorizar las IP de salida del Web Service de Render, disponibles en su panel. La URI con las credenciales se configura únicamente en las variables privadas del servicio.
3. La opción **New → Blueprint** de Render conecta el repositorio, selecciona `main` y utiliza `render.yaml` de la raíz. Los nombres de los servicios deben estar disponibles; Render asigna las URLs finales.
4. El Blueprint declara un **Web Service Node** (`backend/`) y un **Static Site** (`frontend/`). Las variables solicitadas (`sync: false`) son `MONGODB_URI`, `FRONTEND_URL` (origen público HTTPS del sitio) y `VITE_API_URL` (URL pública HTTPS de la API terminada en `/api`). Las URLs provisionales se sustituyen por las definitivas una vez asignadas.
5. En **Environment** del backend, `FRONTEND_URL=https://TU-SITIO.onrender.com` se configura sin barra final. En el frontend, `VITE_API_URL=https://TU-API.onrender.com/api` requiere una URL pública accesible desde el navegador. Los cambios requieren un nuevo despliegue del backend y **Deploy latest commit** del frontend para recompilar Vite.
6. El backend compila con `npm ci --include=dev && npm run build` y arranca con `npm start`. Render proporciona `PORT`; se escucha en `0.0.0.0`. El frontend compila igual y sirve `./dist`; la regla `/* → /index.html` permite abrir rutas de React Router directamente.
7. La comprobación del despliegue incluye `https://TU-API.onrender.com/api/health`, la creación de un juego, el registro de tres partidas, la consulta del resumen y la actualización de un logro. La recarga directa de una ruta de detalle comprueba la reescritura; la consola del navegador permite comprobar CORS.
8. La carga de datos iniciales utiliza `npm run seed` desde `backend/`, con el `.env` local configurado para la base del proyecto. El seed no borra datos existentes. Los enlaces del sitio, la API, el PR y la demostración se registran en «URLs públicas» después del despliegue.

Los valores `sync: false` se piden al crear el Blueprint; las variables agregadas posteriormente se configuran manualmente en cada servicio. Referencias oficiales: [especificación Blueprint](https://render.com/docs/blueprint-spec), [monorepos](https://render.com/docs/monorepo-support) y [reescrituras](https://render.com/docs/redirects-rewrites).

## Guion de demostración

1. Crear un videojuego con plataforma, género, estado y dos logros.
2. Abrir su detalle: comprobar el resumen vacío (ceros y última partida sin registrar).
3. Registrar una partida con fecha, 60 minutos y 20 %; volver al detalle y mostrar 1 partida, 1.0 horas y 20 %.
4. Agregar otras dos sesiones con fechas posteriores; explicar que el avance actual corresponde a la fecha más reciente.
5. Marcar un logro como obtenido y recargar para demostrar persistencia.
6. Mostrar el historial global con nombres de videojuegos (populate), el filtro de biblioteca, la edición y el PR integrado.

## Capturas de la interfaz

- [Detalle y resumen en escritorio](docs/capturas/detalle-escritorio.png).
- [Detalle en móvil](docs/capturas/detalle-movil.png).
- [Biblioteca en móvil](docs/capturas/biblioteca-movil.png).

Las capturas muestran la biblioteca y el detalle con el resumen calculado en escritorio y móvil.

## URLs públicas

Enlaces por completar después del despliegue.

- Frontend: **PENDIENTE — URL pública de Render**.
- Backend: **PENDIENTE — URL pública de Render**.
- Health: **PENDIENTE — URL del backend + `/api/health`**.
- Repositorio GitHub: **PENDIENTE**.
- Pull request integrado: **PENDIENTE**.
- Demo en vivo o grabada: **PENDIENTE**.

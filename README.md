# Diario de Progreso Gamer

## Intención del proyecto

El Diario de Progreso Gamer permite a cada estudiante controlar los videojuegos que posee o está jugando, registrar sus partidas y consultar un resumen calculado de su progreso real. Responde la pregunta: **«¿qué estoy jugando ahora, cuánto le he dedicado, y qué tan avanzado voy?»**. La ficha reúne los datos y logros del juego; cada sesión aporta su fecha, duración y avance al resumen que calcula el backend.

**Alexander · Universidad San Francisco de Quito · Desarrollo Web 3**  
Entregable 3 · Fecha límite: **23 de octubre de 2026, 23:59 (Ecuador)**.

## Ramas e integración

`main` contiene el código completo del backend y frontend, las pruebas, el Blueprint de Render y esta documentación. La rama de trabajo `feature/frontend` ya se integró mediante el [pull request #1](https://github.com/alexanderkholodov1/gamer-progress-diary/pull/1), con base `main` y merge commit `b1a5c5f`. El historial conserva commits descriptivos por modelo, servicio, controlador, ruta y pantalla. Los dos servicios de Render se despliegan desde `main`; las URLs públicas constan al final.

## Modelo de datos y decisiones

### Videojuego

| Campo | Tipo y validación |
| --- | --- |
| `nombre` | String obligatorio, sin espacios al inicio/final; no acepta solo espacios |
| `plataforma` | Enum obligatorio: `PC`, `PlayStation`, `Xbox`, `Switch`, `Movil` |
| `genero` | Enum obligatorio: `accion`, `rol`, `estrategia`, `puzzle`, `deportes`, `otro` |
| `estado` | Enum obligatorio: `jugando`, `pausado`, `completado`, `abandonado`; por defecto `jugando` |
| `logros` | Arreglo obligatorio de 0 a 50 subdocumentos no nulos `{ _id, nombre, obtenido }` (por defecto `[]`); nombre obligatorio, obtenido booleano obligatorio (por defecto false). Rechaza `null` y objetos sueltos |
| `createdAt`, `updatedAt` | Timestamps automáticos |

**Los logros se embeben** porque forman una lista corta y acotada que pertenece exclusivamente a un videojuego. No tienen entidad propia fuera del juego: se leen siempre junto a su ficha y no requieren búsquedas ni ciclo de vida independientes. El límite de 50 metas personales por juego hace explícito que esta lista es corta y acotada; las sesiones no tienen ese límite. El `_id` propio de cada subdocumento permite actualizar solo su estado obtenido.

### Partida

| Campo | Tipo y validación |
| --- | --- |
| `videojuego` | ObjectId obligatorio, `ref: "Videojuego"`; el servicio verifica que exista |
| `fecha` | Date obligatorio y válido |
| `duracionMinutos` | Number obligatorio y finito, mínimo 1 minuto |
| `porcentajeAvance` | Number obligatorio, mínimo 0 y máximo 100 |
| `notas` | String opcional |
| `createdAt`, `updatedAt` | Timestamps automáticos |

**Partida se referencia** porque el historial crece sin límite: meses de sesiones no deben agrandar indefinidamente un único documento. Además, las partidas se consultan de forma independiente (lista global) y por juego (ruta anidada). `populate("videojuego")` incluye la ficha en la consulta global. Al eliminar un juego se eliminan sus partidas para evitar referencias huérfanas. Son dos operaciones de base de datos, sin transacción; esta aplicación académica supone uso personal y no ofrece atomicidad entre borrado y creaciones concurrentes.

### Resumen: fórmula exacta

La lógica vive en `backend/src/services/videojuegos.service.ts`, nunca en el controlador ni en el cliente. La lógica permanece en el servicio para que todos los clientes compartan la misma regla de negocio, sin duplicarla en cada frontend. Se consulta el conjunto P de partidas del videojuego:

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

Express 5 propaga los errores de controladores asíncronos al middleware central. Cada solicitud recibe `X-Request-Id`, también incluido en los errores y registros. Las páginas solo consumen servicios de `src/api`; los formularios son controlados. Las consultas muestran carga, error con reintento y ausencia de datos. Un 404 de videojuego en detalle o edición muestra «Videojuego no disponible» con regreso a la biblioteca; un fallo temporal conserva el reintento. El formulario de creación no necesita una consulta previa: muestra campos vacíos y maneja carga/error al guardar. Las etiquetas se muestran en español aunque los enums se envían exactamente como en la consigna.

## Instalación y ejecución local

Requisitos: Node.js **22.12 o superior**, npm, MongoDB Atlas o una instancia local y dos terminales.

```bash
git switch main
cd backend
npm ci
cp .env.example .env
```

Configuración de `backend/.env`: `MONGODB_URI` con la cadena de conexión; `MONGODB_DB` es opcional y permite elegir una base dedicada (por ejemplo, `diario-gamer`), con prioridad sobre la base de la URI. Si se omite o queda vacío, se usa la base indicada por la URI; `FRONTEND_URL=http://localhost:5173`; `PORT=3000`; `NODE_ENV=development`. `.env` contiene configuración privada y está excluido del control de versiones. En Atlas se requiere un usuario con acceso a esa base y la IP de desarrollo autorizada en Network Access.

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

### Variables de entorno

El [`.env.example` de la raíz](.env.example) documenta todas las variables sin valores reales. Es un catálogo: no se carga automáticamente ni se copia completo a un único servicio. Para desarrollo se usan [backend/.env.example](backend/.env.example) y [frontend/.env.example](frontend/.env.example) como se indica arriba. En Render los valores se configuran en **Environment** del servicio correspondiente.

| Variable | Destino y uso |
| --- | --- |
| `MONGODB_URI` | Backend; obligatoria; conexión privada a Atlas |
| `MONGODB_DB` | Backend; opcional; base con prioridad sobre la indicada en la URI |
| `FRONTEND_URL` | Backend; origen permitido por CORS; obligatorio explícitamente en producción |
| `PORT` | Backend; 3000 localmente; asignado por Render en producción |
| `NODE_ENV` | Backend; `development` localmente, `production` en Render |
| `VITE_API_URL` | Frontend; URL pública terminada en `/api`; se incorpora al compilar |
| `MONGOMS_DOWNLOAD_DIR` | Herramientas de test/demo; caché opcional del binario temporal de MongoDB |
| `NODE_VERSION` | Render; versión de Node fijada en `render.yaml` para ambos servicios |

Ninguna variable `VITE_*` debe contener secretos: su valor es público en el bundle. Las credenciales solo se guardan en el `.env` privado del backend o en el panel de Render. `.gitignore` excluye los archivos `.env` y admite únicamente los ejemplos.

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

`npm run demo:memoria` inicia MongoDB temporal, asigna su URI al entorno del proceso, utiliza la misma conexión y aplicación Express, ejecuta el seed, abre un puerto HTTP efímero, solicita el resumen y comprueba su respuesta. Cierra servidor y base al terminar. No modifica Atlas. `npm run seed` utiliza `MONGODB_URI` y la base opcional `MONGODB_DB` del entorno: es repetible, no vacía colecciones y crea **Hollow Knight (demo)** con tres sesiones (235 minutos → 3.9 horas; avance 38 %).

### Verificación HTTP con curl

Comprobación del 23 de octubre de 2026: ambos CRUD se ejecutaron por HTTP contra la API local conectada a **MongoDB Atlas**, usando una ficha temporal y eliminándola al terminar. Tres partidas de 60, 95 y 80 minutos dieron `totalPartidas=3`, `horasTotales=3.9`, última fecha `2026-10-22T20:00:00.000Z` y avance `38`; el 90 % de una sesión anterior no sustituyó el avance más reciente. Una cuarta sesión de 65 minutos y 20 % cambió inmediatamente el resumen a 4 partidas, 5 horas y 20 %. Editar y eliminar una sesión volvió a modificar el cálculo. También se verificaron filtros, `populate`, ruta anidada y persistencia del logro.

Reproducción desde una terminal Bash, con `npm run dev` del backend ya iniciado y `.env` apuntando a una base propia de Atlas. `node` extrae los identificadores JSON; no se requieren credenciales en los comandos:

```bash
API=http://localhost:3000/api
JUEGO=$(curl -fsS -X POST "$API/videojuegos" -H 'Content-Type: application/json' \
  -d '{"nombre":"Prueba HTTP temporal","plataforma":"PC","genero":"puzzle","estado":"jugando","logros":[{"nombre":"Primera meta","obtenido":false}]}')
JUEGO_ID=$(node -e 'console.log(JSON.parse(process.argv[1])._id)' "$JUEGO")
LOGRO_ID=$(node -e 'console.log(JSON.parse(process.argv[1]).logros[0]._id)' "$JUEGO")
curl -i "$API/videojuegos/$JUEGO_ID/resumen" # 200; ceros y ultimaPartida:null
curl -i "$API/videojuegos?nombre=Prueba&plataforma=PC&genero=puzzle&estado=jugando"
curl -i "$API/videojuegos/$JUEGO_ID"
curl -i -X PUT "$API/videojuegos/$JUEGO_ID" -H 'Content-Type: application/json' \
  -d '{"nombre":"Prueba HTTP editada"}'

curl -i -X POST "$API/partidas" -H 'Content-Type: application/json' \
  -d "{\"videojuego\":\"$JUEGO_ID\",\"fecha\":\"2026-10-20T20:00:00Z\",\"duracionMinutos\":60,\"porcentajeAvance\":90}"
curl -i -X POST "$API/partidas" -H 'Content-Type: application/json' \
  -d "{\"videojuego\":\"$JUEGO_ID\",\"fecha\":\"2026-10-21T20:00:00Z\",\"duracionMinutos\":95,\"porcentajeAvance\":26}"
PARTIDA=$(curl -fsS -X POST "$API/partidas" -H 'Content-Type: application/json' \
  -d "{\"videojuego\":\"$JUEGO_ID\",\"fecha\":\"2026-10-22T20:00:00Z\",\"duracionMinutos\":80,\"porcentajeAvance\":38}")
PARTIDA_ID=$(node -e 'console.log(JSON.parse(process.argv[1])._id)' "$PARTIDA")
curl -i "$API/videojuegos/$JUEGO_ID/resumen" # 3 partidas, 3.9 h, 38 %
curl -i "$API/videojuegos/$JUEGO_ID/partidas"
curl -i "$API/partidas" # videojuego poblado
curl -i "$API/partidas/$PARTIDA_ID"
curl -i -X PATCH "$API/videojuegos/$JUEGO_ID/logros/$LOGRO_ID" \
  -H 'Content-Type: application/json' -d '{"obtenido":true}'
curl -i "$API/videojuegos/$JUEGO_ID" # logro persistido
curl -i -X PUT "$API/partidas/$PARTIDA_ID" -H 'Content-Type: application/json' \
  -d '{"duracionMinutos":90}'
curl -i -X PATCH "$API/partidas/$PARTIDA_ID" -H 'Content-Type: application/json' \
  -d '{"porcentajeAvance":40}'
curl -i "$API/videojuegos/$JUEGO_ID/resumen" # cálculo actualizado
curl -i -X DELETE "$API/partidas/$PARTIDA_ID" # 204
curl -i "$API/videojuegos/$JUEGO_ID/resumen" # cálculo sin la sesión eliminada
curl -i -X DELETE "$API/videojuegos/$JUEGO_ID" # 204; limpia solo la ficha de prueba
```

Los cuatro tipos de error se provocaron y comprobaron con `curl`, además de las pruebas automatizadas:

| Solicitud/condición | Resultado verificado |
| --- | --- |
| `POST /api/videojuegos` con `{}` | 400, `VALIDACION` |
| `GET /api/videojuegos/no-id` | 400, `ID_MALFORMADO` |
| `POST /api/partidas` con ObjectId válido ausente | 404, `NO_ENCONTRADO`; ninguna partida creada |
| `GET /api/videojuegos` en proceso local aislado sin conexión y sin buffering | 500, `INTERNO`; respuesta genérica con requestId |

```bash
curl -i -X POST "$API/videojuegos" -H 'Content-Type: application/json' -d '{}'
curl -i "$API/videojuegos/no-id"
curl -i -X POST "$API/partidas" -H 'Content-Type: application/json' \
  -d '{"videojuego":"000000000000000000000000","fecha":"2026-10-23T20:00:00Z","duracionMinutos":60,"porcentajeAvance":0}'
```

Para reproducir el 500, desde `backend/` en otra terminal: `npm run build` y el siguiente proceso aislado. Importa la aplicación sin llamar a `conectarDB`; no desconecta Atlas ni incorpora rutas de fallo:

```bash
node -e 'require("mongoose").set("bufferCommands", false); const {app} = require("./dist/app"); app.listen(3002, "127.0.0.1");'
# En otra terminal:
curl -i http://127.0.0.1:3002/api/videojuegos
# Resultado: 500; error.tipo=INTERNO. Detener el proceso aislado con Ctrl+C.
```

En producción se comprobaron salud, resumen e historial del juego de demostración, lista poblada, los errores 400/404 y preflight de CORS para videojuegos, partidas y logros. Las rutas del cliente también devolvieron el HTML de la SPA al abrirlas directamente. Ejemplos reproducibles:

```bash
API_PUBLICA=https://gamer-progress-diary-api.onrender.com/api
ORIGEN=https://gamer-progress-diary-web.onrender.com
curl -i "$API_PUBLICA/health" # 200, estado disponible
curl -i -H "Origin: $ORIGEN" "$API_PUBLICA/videojuegos"
curl -i -X OPTIONS "$API_PUBLICA/partidas" -H "Origin: $ORIGEN" \
  -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type'
# 204; Access-Control-Allow-Origin coincide con ORIGEN y permite PATCH/content-type.
curl -i "$ORIGEN/partidas/nueva" # 200, HTML del frontend para React Router
```

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
4. El Blueprint declara un **Web Service Node** (`backend/`) y un **Static Site** (`frontend/`). Las variables solicitadas (`sync: false`) son `MONGODB_URI`, `FRONTEND_URL` (origen público HTTPS del sitio) y `VITE_API_URL` (URL pública HTTPS de la API terminada en `/api`). `MONGODB_DB` se fija como `diario-gamer` en el Blueprint y puede cambiarse en el panel para elegir otra base. Las URLs provisionales se sustituyen por las definitivas una vez asignadas.
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

Proyecto desplegado en Render, con el frontend y el backend comunicados en producción.

- Frontend: https://gamer-progress-diary-web.onrender.com
- Backend (API): https://gamer-progress-diary-api.onrender.com/api
- Health: https://gamer-progress-diary-api.onrender.com/api/health
- Repositorio GitHub: https://github.com/alexanderkholodov1/gamer-progress-diary
- Pull request integrado: https://github.com/alexanderkholodov1/gamer-progress-diary/pull/1
- Demo en vivo o grabada: https://youtu.be/odiBlS8cl-g.

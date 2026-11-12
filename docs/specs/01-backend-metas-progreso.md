# Spec 01 · Backend: metas y progreso semanal

## 1. Alcance

Cubre HU-2.1 a HU-2.6 del [backlog E2](../backlog/E2-metas-y-rachas.md) y los tickets T-01 a T-06. No incluye la interfaz (spec 02) ni las deudas técnicas (spec 03). No cambia `Videojuego`, `Partida` ni `GET /api/videojuegos/:id/resumen`.

## 2. Modelo `Meta` (`backend/src/models/Meta.ts`)

| Campo | Tipo y validación |
| --- | --- |
| `videojuego` | ObjectId, `ref: "Videojuego"`, obligatorio, indexado |
| `horasSemanales` | Number obligatorio, finito, **mayor que 0** y **como máximo 100** (admite decimales) |
| `diasPorSemana` | Number obligatorio, **entero** entre 1 y 7 |
| `activa` | Boolean, por defecto `true` |
| `hitos` | Arreglo embebido de 0 a **5** subdocumentos `{ descripcion, porcentajeObjetivo }`, por defecto `[]` |
| `hitos[].descripcion` | String obligatorio, sin espacios sobrantes, de 1 a 80 caracteres |
| `hitos[].porcentajeObjetivo` | Number obligatorio entre 1 y 100 |
| `createdAt`, `updatedAt` | Timestamps automáticos |

Índices: `{ videojuego: 1 }` **único parcial** con `activa: true` (como máximo una meta activa por juego, garantizado también por la base de datos) y `{ videojuego: 1, createdAt: -1 }` para el historial.

### Por qué este diseño

- **`Meta` se referencia y no se embebe en `Videojuego`** porque tiene su propio ciclo de vida: se crea, se edita y se desactiva sin tocar la ficha del juego, y un juego acumula un historial de metas anteriores. Si viviera dentro del juego, cada cambio de meta reescribiría la ficha y el historial la haría crecer sin control. Referenciarla también permite el índice único parcial que impide dos metas activas.
- **Los hitos se embeben dentro de la meta** porque son una lista corta (máximo 5), acotada y que solo tiene sentido dentro de su meta: no se consultan solos y se leen siempre con ella. Es el mismo criterio que los logros dentro de `Videojuego` en E1.
- **El estado «alcanzado» de un hito no se guarda**: se calcula en cada consulta comparando el `porcentajeAvanceActual` del resumen de E1 con el objetivo. Guardarlo duplicaría un dato que ya existe en las partidas y obligaría a sincronizarlo al crear, editar o eliminar cada partida. Esto es coherente con RN-11: si el avance baja, el hito vuelve a pendiente.

## 3. Endpoints

Todos responden JSON. Los errores usan el formato de E1: `{ "error": { "tipo", "mensaje", "detalles?", "requestId" } }`.

| Método y ruta | Entrada | Respuesta correcta | Errores |
| --- | --- | --- | --- |
| `POST /api/metas` | `{ videojuego, horasSemanales, diasPorSemana, hitos? }` (`activa` se ignora) | 201 con la meta | 400 validación o id malformado · 404 juego inexistente · 409 meta activa existente o juego completado/abandonado |
| `GET /api/metas/:id` | — | 200 con la meta | 400 id malformado · 404 |
| `GET /api/videojuegos/:id/metas?activa=true\|false` | Filtro opcional | 200 con las metas del juego, de la más reciente a la más antigua | 400 · 404 juego inexistente |
| `PUT` / `PATCH /api/metas/:id` | Cualquiera de `{ horasSemanales, diasPorSemana, hitos }` (`videojuego` y `activa` se ignoran) | 200 con la meta actualizada | 400 · 404 · 409 meta desactivada |
| `PATCH /api/metas/:id/desactivar` | — | 200 con la meta (`activa: false`) | 400 · 404 · 409 meta ya desactivada |
| `GET /api/videojuegos/:id/progreso-semanal` | — | 200 con el progreso (forma abajo) | 400 id malformado · 404 juego inexistente |

Forma de la respuesta del progreso, igual a la ficha, más `metaCumplida`:

```json
{
  "semana": { "inicio": "2026-11-09", "fin": "2026-11-15" },
  "meta": { "horasSemanales": 5, "diasPorSemana": 4 },
  "horasSemana": 3.5,
  "porcentajeHoras": 70,
  "diasJugadosSemana": 3,
  "metaCumplida": false,
  "rachaActual": 4,
  "mejorRacha": 9,
  "hitos": [{ "descripcion": "Llegar al 25 %", "porcentajeObjetivo": 25, "alcanzado": true }]
}
```

Sin meta activa: `meta: null`, `porcentajeHoras: null`, `metaCumplida: null`, `hitos: []`, con horas, días y rachas calculados.

## 4. Capa de dominio (`backend/src/dominio/progreso.ts`)

Funciones puras: reciben datos planos y una fecha `ahora`, y no importan Mongoose ni leen la hora del sistema. El servicio (`services/progreso.service.ts`) consulta el juego, sus partidas y su meta activa, obtiene el avance actual con el resumen de E1 y llama a `calcularProgresoSemanal`.

| Función | Contrato |
| --- | --- |
| `diaLocal(fecha)` | `"YYYY-MM-DD"` del instante en `America/Guayaquil` |
| `semanaDe(ahora)` | `{ inicio, fin }`: lunes y domingo de la semana local de `ahora` |
| `horasEnSemana(partidas, semana)` | Suma de `duracionMinutos / 60` de las partidas cuyo día de inicio está en la semana, con un decimal |
| `diasJugadosEnSemana(partidas, semana)` | Cantidad de días locales distintos con partidas dentro de la semana |
| `calcularRachas(partidas, ahora)` | `{ rachaActual, mejorRacha }` sobre todo el historial |
| `porcentajeDeHoras(horas, horasSemanales)` | `Math.round(horas / horasSemanales × 100)`, sin tope |
| `evaluarHitos(hitos, avanceActual)` | Hitos ordenados por objetivo, con `alcanzado = avanceActual ≥ objetivo` |
| `calcularProgresoSemanal({ partidas, meta, porcentajeAvanceActual, ahora })` | La respuesta completa de la sección 3 |

## 5. Reglas

### HU-2.1 · Fijar una meta

- **DEBE** crear una meta activa cuando el juego existe, está «jugando» o «pausado», no tiene meta activa y los datos son válidos.
- **DEBE** responder 400 si `horasSemanales` no es mayor que 0 y hasta 100, si `diasPorSemana` no es entero entre 1 y 7, o si los hitos son más de 5, no tienen descripción o tienen objetivo fuera de 1–100.
- **DEBE** responder 404 si el juego referenciado no existe, y 400 si su id está malformado.
- **DEBE** responder 409 con el mensaje «Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.» si ya hay una meta activa (RN-17).
- **DEBE** responder 409 si el juego está «completado» o «abandonado» (RN-12).
- **NO DEBE** permitir dos metas activas para el mismo juego, ni siquiera con solicitudes simultáneas: el índice único parcial lo garantiza y su error de clave duplicada también responde 409.
- **NO DEBE** aceptar `activa: false` al crear: toda meta nueva nace activa.

### HU-2.2 · Ajustar o desactivar

- **DEBE** actualizar horas, días e hitos de una meta activa, revalidándolos.
- **DEBE** desactivar una meta activa con `PATCH /api/metas/:id/desactivar`.
- **NO DEBE** editar ni reactivar una meta desactivada: responde 409 (RN-16).
- **NO DEBE** permitir cambiar el `videojuego` de una meta.
- **DEBE** listar las metas de un juego de la más reciente a la más antigua, con filtro opcional por `activa`.

### HU-2.3 · Semana en curso

- **DEBE** calcular la semana de lunes a domingo en `America/Guayaquil` (RN-03).
- **DEBE** sumar en `horasSemana` solo las partidas cuyo día de inicio cae en la semana, redondeando a un decimal (RN-04).
- **DEBE** contar un solo día por fecha local en `diasJugadosSemana` (RN-06).
- **DEBE** asignar una partida que cruza la medianoche al día en que empezó (RN-07).
- **DEBE** devolver `porcentajeHoras` sin tope superior: 7 h con meta de 5 h → 140 (RN-05).
- **DEBE** calcular con la meta activa en el momento de la consulta (RN-10).
- **DEBE** devolver `metaCumplida = true` solo si `horasSemana ≥ horasSemanales` **y** `diasJugadosSemana ≥ diasPorSemana` (RN-14).
- **DEBE** devolver `meta`, `porcentajeHoras` y `metaCumplida` en `null` y `hitos: []` si no hay meta activa (RN-18).
- **NO DEBE** contar partidas con fecha posterior a `ahora` (RN-15).

### HU-2.4 · Racha

- **DEBE** calcular `rachaActual` como los días locales consecutivos con partidas que terminan hoy, o ayer si hoy aún no hay partida (RN-09).
- **DEBE** devolver `rachaActual = 0` si no hubo partida ni hoy ni ayer.
- **DEBE** calcular `mejorRacha` como el tramo consecutivo más largo de todo el historial; siempre `mejorRacha ≥ rachaActual`.
- **NO DEBE** contar dos veces un día con varias partidas.

### HU-2.5 · Hitos

- **DEBE** marcar `alcanzado` cuando `porcentajeAvanceActual` (resumen de E1) es mayor o igual que `porcentajeObjetivo` (RN-11).
- **NO DEBE** guardar el estado alcanzado en la base de datos.
- **DEBE** devolver los hitos ordenados por `porcentajeObjetivo` ascendente.
- **DEBE** dejar todos los hitos sin alcanzar si el juego no tiene partidas (RN-19).

### HU-2.6 · Ciclo de vida

- **DEBE** eliminar todas las metas de un juego al eliminar el juego, junto con sus partidas (RN-13).
- **DEBE** desactivar la meta activa cuando el juego pasa a «completado» o «abandonado» (RN-12).
- **NO DEBE** desactivar la meta cuando el juego pasa a «pausado» o «jugando».

### Errores (T-02)

- **DEBE** distinguir 400 (`VALIDACION`, `ID_MALFORMADO`), 404 (`NO_ENCONTRADO`), 409 (`CONFLICTO`) y 500 (`INTERNO`).
- **NO DEBE** filtrar detalles internos en los 500.

## 6. Criterio → verificación

Tests de dominio: `backend/tests/dominio/progreso.test.ts` (sin base de datos). Tests de integración: `backend/tests/metas.test.ts` (MongoDB en memoria). Pruebas manuales: [docs/pruebas-api.md](../pruebas-api.md).

| Criterio | Regla | Verificación |
| --- | --- | --- |
| CA-2.1.1 Meta válida queda activa | HU-2.1 | Test de modelo (`validateSync`) + integración `POST /api/metas` → 201 |
| CA-2.1.2 Horas o días fuera de rango | HU-2.1 | Test de modelo (sin BD) + integración → 400 |
| CA-2.1.3 Hitos inválidos o más de 5 | HU-2.1 | Test de modelo (sin BD) + integración → 400 |
| CA-2.1.4 Segunda meta activa | RN-17 | Integración → 409 `CONFLICTO` + curl |
| CA-2.1.5 Juego completado/abandonado | RN-12 | Integración → 409 |
| CA-2.1.6 Juego inexistente | HU-2.1 | Integración → 404 + curl |
| CA-2.2.1 Editar con la meta nueva | RN-10 | Dominio (la meta recibida decide el porcentaje) + integración `PATCH` y progreso |
| CA-2.2.2 Desactivar | HU-2.2 | Integración `PATCH …/desactivar` → juego sin meta activa |
| CA-2.2.3 Meta desactivada no se edita | RN-16 | Integración → 409 |
| CA-2.2.4 Historial de metas | HU-2.2 | Integración `GET /api/videojuegos/:id/metas` ordenado |
| CA-2.3.1 Solo partidas de la semana | RN-03, RN-04 | Dominio `semanaDe`, `horasEnSemana` |
| CA-2.3.2 3,5 h de 5 h = 70 % | RN-05 | Dominio `porcentajeDeHoras` |
| CA-2.3.3 7 h de 5 h = 140 % | RN-05 | Dominio `porcentajeDeHoras` |
| CA-2.3.4 Dos partidas, un día | RN-06 | Dominio `diasJugadosEnSemana` |
| CA-2.3.5 Partida de medianoche | RN-07 | Dominio `diaLocal`, `horasEnSemana` (domingo 23:30) |
| CA-2.3.6 Sin meta activa | RN-18 | Dominio `calcularProgresoSemanal` + integración |
| CA-2.3.7 Sin partidas | RN-19 | Dominio + integración + curl |
| CA-2.3.8 Meta cumplida | RN-14 | Dominio `calcularProgresoSemanal` |
| CA-2.3.9 Partidas futuras no cuentan | RN-15 | Dominio |
| CA-2.4.1 Racha hasta hoy | HU-2.4 | Dominio `calcularRachas` |
| CA-2.4.2 Racha viva con partida ayer | RN-09 | Dominio `calcularRachas` |
| CA-2.4.3 Racha rota | RN-09 | Dominio `calcularRachas` |
| CA-2.4.4 Mejor racha con racha rota | HU-2.4 | Dominio + curl con 5+ partidas |
| CA-2.4.5 Varias partidas el mismo día | RN-06 | Dominio `calcularRachas` |
| CA-2.5.1 Hitos según avance | RN-11 | Dominio `evaluarHitos` |
| CA-2.5.2 Hito vuelve a pendiente | RN-11 | Dominio `evaluarHitos` + integración con partida más reciente |
| CA-2.5.3 Sin partidas, ningún hito | RN-19 | Dominio `evaluarHitos(…, 0)` |
| CA-2.5.4 Hitos ordenados | RN-02 | Dominio `evaluarHitos` |
| CA-2.6.1 Completado desactiva la meta | RN-12 | Integración `PATCH /api/videojuegos/:id` |
| CA-2.6.2 Pausado conserva la meta | RN-12 | Integración |
| CA-2.6.3 Eliminar juego elimina metas | RN-13 | Integración `DELETE /api/videojuegos/:id` |
| Errores 400/404/409/500 | T-02 | Integración del `errorHandler` + curl |

## 7. Ticket → archivos

| Ticket | Archivos |
| --- | --- |
| T-01 | `backend/src/models/Meta.ts`, `backend/tests/dominio/meta.modelo.test.ts` |
| T-02 | `backend/src/errors.ts`, `backend/src/middleware/errorHandler.ts`, `backend/tests/metas.test.ts` |
| T-03 | `backend/tests/dominio/progreso.test.ts` (primero), `backend/src/dominio/progreso.ts` |
| T-04 | `backend/src/services/metas.service.ts`, `backend/src/controllers/metas.controller.ts`, `backend/src/routes/metas.routes.ts`, `backend/src/routes/videojuegos.routes.ts`, `backend/src/app.ts`, `backend/tests/metas.test.ts` |
| T-05 | `backend/src/services/progreso.service.ts`, `backend/src/controllers/videojuegos.controller.ts`, `backend/src/routes/videojuegos.routes.ts`, `backend/tests/metas.test.ts`, `docs/pruebas-api.md`, `backend/src/scripts/demoE2.ts` |
| T-06 | `backend/src/services/videojuegos.service.ts`, `backend/tests/metas.test.ts` |

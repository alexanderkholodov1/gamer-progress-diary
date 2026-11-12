# Pruebas de la API de E2 con curl

Evidencia del ticket T-05 (fase 6). Fecha: miércoles 11 de noviembre de 2026, 19:45 (hora de Ecuador). Semana en curso: lunes 9 a domingo 15 de noviembre.

**Entorno:** `npm --prefix backend run demo:e2`, que levanta la API real (mismas rutas, servicios y `errorHandler`) contra un MongoDB en memoria con datos relativos a hoy. No usa `.env` ni Atlas. La verificación contra Render está en [AUDITORIA.md](AUDITORIA.md).

**Datos de prueba de Hades:** 5 días seguidos (31 oct a 4 nov, hora de Ecuador), un hueco de 4 días y luego domingo 8 a las 23:30 (60 min, cruza la medianoche), lunes 9 (90 min) y dos partidas el martes 10 (60 + 60 min). Hoy, miércoles 11, todavía no hay partida.

## Resumen

| # | Caso | Esperado (regla) | Resultado | ✔ |
| --- | --- | --- | --- | --- |
| 1 | Juego sin partidas ni meta (Celeste) | 200, ceros, `meta: null`, `porcentajeHoras: null` (RN-18, RN-19) | 200, todo en 0, `meta: null`, semana 2026-11-09 a 2026-11-15 | ✔ |
| 2 | Juego con 9 partidas en 8 días distintos y racha rota (Hades) | 3,5 h (lun 90 + mar 120 min), 70 %, 2 días (dos partidas el martes = 1 día), racha 3 viva por ayer, mejor racha 5, hitos 25 y 50 alcanzados con avance 50 % | `horasSemana 3.5`, `porcentajeHoras 70`, `diasJugadosSemana 2`, `rachaActual 3`, `mejorRacha 5`, hitos `[true, true, false]` | ✔ |
| 2b | Partida del domingo 23:30 (`2026-11-09T04:30Z`, ya lunes en UTC) | Cuenta en el domingo 8 (semana anterior), no suma horas a esta semana (RN-07) | No suma: 3,5 h y 2 días | ✔ |
| 4 | Meta superada (Stardew: 4 h con meta de 2 h, 1 día de 2) | 200 % sin tope (RN-05); no cumplida porque falta un día (RN-14) | `porcentajeHoras 200`, `metaCumplida false` | ✔ |
| 5 | Crear meta para Celeste | 201, `activa: true`, hitos con `_id` | 201 | ✔ |
| 6 | Segunda meta activa para Celeste | 409 `CONFLICTO` con mensaje claro (RN-17) | 409 «Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.» | ✔ |
| 7 | Meta para un juego completado (Portal 2) | 409 `CONFLICTO` (RN-12) | 409 «Un videojuego completado no puede tener una meta activa…» | ✔ |
| 8 | Horas 0 y días 9 | 400 `VALIDACION` con detalles por campo | 400 con «horas por semana» y «días por semana» | ✔ |
| 9 | Id malformado en progreso | 400 `ID_MALFORMADO` | 400 | ✔ |
| 10 | Videojuego inexistente en progreso | 404 `NO_ENCONTRADO` | 404 | ✔ |
| 11 | Meta para un videojuego inexistente | 404 `NO_ENCONTRADO` | 404 | ✔ |
| 12 | Historial de metas de Hades | 200, de la más reciente a la más antigua | 200 | ✔ |

## Salida completa

```text
### 1. Juego sin partidas ni meta (Celeste)
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/6af50c2e846bf9e04a3ca99b/progreso-semanal
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":null,"horasSemana":0,"porcentajeHoras":null,"diasJugadosSemana":0,"metaCumplida":null,"rachaActual":0,"mejorRacha":0,"hitos":[]}
HTTP 200

### 2. Juego con 9 partidas en 8 días distintos y racha rota (Hades)
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/6af50c2e846bf9e04a3ca98a/progreso-semanal
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":{"horasSemanales":5,"diasPorSemana":4},"horasSemana":3.5,"porcentajeHoras":70,"diasJugadosSemana":2,"metaCumplida":false,"rachaActual":3,"mejorRacha":5,"hitos":[{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"alcanzado":true},{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"alcanzado":true},{"descripcion":"Terminar el juego","porcentajeObjetivo":100,"alcanzado":false}]}
HTTP 200

### 3. Historial de Hades (fechas UTC)
$ curl -s http://localhost:3000/api/videojuegos/6af50c2e846bf9e04a3ca98a/partidas | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>JSON.parse(s).forEach(p=>console.log(p.fecha, p.duracionMinutos+" min", p.porcentajeAvance+" %", p.notas??"")))'
2026-11-11T02:00:00.000Z 60 min 50 % Segunda partida del día
2026-11-10T15:00:00.000Z 60 min 45 % 
2026-11-10T00:00:00.000Z 90 min 40 % 
2026-11-09T04:30:00.000Z 60 min 35 % Cruza la medianoche
2026-11-04T00:00:00.000Z 45 min 25 % 
2026-11-03T00:00:00.000Z 45 min 20 % 
2026-11-02T00:00:00.000Z 45 min 15 % 
2026-11-01T00:00:00.000Z 45 min 10 % 
2026-10-31T00:00:00.000Z 45 min 5 % 


### 4. Meta superada (Stardew)
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/6af50c2e846bf9e04a3ca99f/progreso-semanal
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":{"horasSemanales":2,"diasPorSemana":2},"horasSemana":4,"porcentajeHoras":200,"diasJugadosSemana":1,"metaCumplida":false,"rachaActual":1,"mejorRacha":1,"hitos":[]}
HTTP 200

### 5. Crear meta para Celeste
$ curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:3000/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af50c2e846bf9e04a3ca99b","horasSemanales":3,"diasPorSemana":3,"hitos":[{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50}]}'
{"videojuego":"6af50c2e846bf9e04a3ca99b","horasSemanales":3,"diasPorSemana":3,"activa":true,"hitos":[{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"_id":"6af50c3c846bf9e04a3ca9b8"}],"_id":"6af50c3c846bf9e04a3ca9b7","createdAt":"2026-11-12T00:45:48.708Z","updatedAt":"2026-11-12T00:45:48.708Z","__v":0}
HTTP 201

### 6. 409: segunda meta activa para Celeste
$ curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:3000/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af50c2e846bf9e04a3ca99b","horasSemanales":4,"diasPorSemana":2}'
{"error":{"tipo":"CONFLICTO","mensaje":"Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.","requestId":"a12b6319-008e-4b88-861f-cb1dac7388f7"}}
HTTP 409

### 7. 409: meta para un juego completado (Portal 2)
$ curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:3000/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af50c2e846bf9e04a3ca99d","horasSemanales":4,"diasPorSemana":2}'
{"error":{"tipo":"CONFLICTO","mensaje":"Un videojuego completado no puede tener una meta activa. Cámbialo a «jugando» o «pausado» primero.","requestId":"47233196-cdaa-437c-83d1-cf05dd7c8dca"}}
HTTP 409

### 8. 400: horas fuera de rango
$ curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:3000/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af50c2e846bf9e04a3ca99d","horasSemanales":0,"diasPorSemana":9}'
{"error":{"tipo":"VALIDACION","mensaje":"Revisa los datos del formulario.","detalles":["El campo «horas por semana» es obligatorio o tiene un valor inválido.","El campo «días por semana» es obligatorio o tiene un valor inválido."],"requestId":"91570257-88b4-492c-992d-8868ab9c5291"}}
HTTP 400

### 9. 400: id malformado en progreso
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/no-es-un-id/progreso-semanal
{"error":{"tipo":"ID_MALFORMADO","mensaje":"El identificador o valor enviado tiene un formato inválido.","requestId":"ad7ac800-4e12-4d0d-bf2f-18dd41f45ff3"}}
HTTP 400

### 10. 404: videojuego inexistente en progreso
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/000000000000000000000000/progreso-semanal
{"error":{"tipo":"NO_ENCONTRADO","mensaje":"No se encontró el videojuego.","requestId":"2c929b57-24e9-4787-b76d-8a45e6e8aac2"}}
HTTP 404

### 11. 404: meta para un videojuego inexistente
$ curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:3000/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"000000000000000000000000","horasSemanales":4,"diasPorSemana":2}'
{"error":{"tipo":"NO_ENCONTRADO","mensaje":"No se encontró el videojuego.","requestId":"1955c4cc-e728-4095-ba6d-21e7b011e794"}}
HTTP 404

### 12. Metas de Hades (historial)
$ curl -s -w "\nHTTP %{http_code}" http://localhost:3000/api/videojuegos/6af50c2e846bf9e04a3ca98a/metas
[{"_id":"6af50c2e846bf9e04a3ca996","videojuego":"6af50c2e846bf9e04a3ca98a","horasSemanales":5,"diasPorSemana":4,"activa":true,"hitos":[{"descripcion":"Terminar el juego","porcentajeObjetivo":100,"_id":"6af50c2e846bf9e04a3ca997"},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"_id":"6af50c2e846bf9e04a3ca998"},{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"_id":"6af50c2e846bf9e04a3ca999"}],"createdAt":"2026-11-12T00:45:34.750Z","updatedAt":"2026-11-12T00:45:34.750Z","__v":0}]
HTTP 200

```

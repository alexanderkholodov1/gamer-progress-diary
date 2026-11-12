# Pruebas de la API de E2 con curl

Evidencia del ticket T-05 (fase 6). Fecha: miércoles 11 de noviembre de 2026, 19:45 (hora de Ecuador). Semana en curso: lunes 9 a domingo 15 de noviembre.

**Entorno:** `npm --prefix backend run demo:e2`, que levanta la API real (mismas rutas, servicios y `errorHandler`) contra un MongoDB en memoria con datos relativos a hoy. No usa `.env` ni Atlas. La verificación contra Render está en [AUDITORIA.md](AUDITORIA.md).

**Datos de prueba de Hades:** 5 días seguidos (30 oct a 3 nov a las 19:00, hora de Ecuador; en la salida aparecen en UTC como 31 oct a 4 nov a las 00:00), un hueco de 4 días y luego domingo 8 a las 23:30 (60 min, cruza la medianoche), lunes 9 (90 min) y dos partidas el martes 10 (60 + 60 min). Hoy, miércoles 11, todavía no hay partida.

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


## Producción (Render + Atlas)

Miércoles 11 de noviembre de 2026, 20:49 (hora de Ecuador), después del merge del PR #2 y del deploy manual en Render. Los juegos temporales se crearon solo para la prueba y se eliminaron al final (P12).

```text
### P1. Progreso de un juego existente sin meta
$ curl -s -w "\nHTTP %{http_code}" https://gamer-progress-diary-api.onrender.com/api/videojuegos/6adc22910c4fd6ae2350dd22/progreso-semanal
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":null,"horasSemana":0,"porcentajeHoras":null,"diasJugadosSemana":0,"metaCumplida":null,"rachaActual":0,"mejorRacha":1,"hitos":[]}
HTTP 200

Juegos temporales: 6af51b0f321de400267b0d3a (jugando), 6af51b0f321de400267b0d3c (completado)

### P2. Crear meta con hitos
$ curl -s -w "\nHTTP %{http_code}" -X POST https://gamer-progress-diary-api.onrender.com/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af51b0f321de400267b0d3a","horasSemanales":2,"diasPorSemana":3,"hitos":[{"descripcion":"Terminar","porcentajeObjetivo":100},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25}]}'
{"videojuego":"6af51b0f321de400267b0d3a","horasSemanales":2,"diasPorSemana":3,"activa":true,"hitos":[{"descripcion":"Terminar","porcentajeObjetivo":100,"_id":"6af51b10321de400267b0d3f"},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"_id":"6af51b10321de400267b0d40"}],"_id":"6af51b10321de400267b0d3e","createdAt":"2026-11-12T01:49:04.761Z","updatedAt":"2026-11-12T01:49:04.761Z","__v":0}
HTTP 201

### P3. 409: segunda meta activa
$ curl -s -w "\nHTTP %{http_code}" -X POST https://gamer-progress-diary-api.onrender.com/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af51b0f321de400267b0d3a","horasSemanales":4,"diasPorSemana":2}'
{"error":{"tipo":"CONFLICTO","mensaje":"Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.","requestId":"00d501d1-ede0-4fa0-b340-2d591ffc38e3"}}
HTTP 409

### P4. 409: juego completado
$ curl -s -w "\nHTTP %{http_code}" -X POST https://gamer-progress-diary-api.onrender.com/api/metas -H 'Content-Type: application/json' -d '{"videojuego":"6af51b0f321de400267b0d3c","horasSemanales":4,"diasPorSemana":2}'
{"error":{"tipo":"CONFLICTO","mensaje":"Un videojuego completado no puede tener una meta activa. Cámbialo a «jugando» o «pausado» primero.","requestId":"d4b33c4a-64f5-4fa8-9848-ff3e61c4a45a"}}
HTTP 409

### P5. Registrar partida de 150 min y 30 %
$ curl -s -o /dev/null -w 'HTTP %{http_code}' -X POST https://gamer-progress-diary-api.onrender.com/api/partidas -H 'Content-Type: application/json' -d '{"videojuego":"6af51b0f321de400267b0d3a","fecha":"2026-11-12T01:39:07.465Z","duracionMinutos":150,"porcentajeAvance":30}'
HTTP 201

### P6. 400 (D-2): partida con fecha futura
$ curl -s -w "\nHTTP %{http_code}" -X POST https://gamer-progress-diary-api.onrender.com/api/partidas -H 'Content-Type: application/json' -d '{"videojuego":"6af51b0f321de400267b0d3a","fecha":"2026-11-13T01:49:07.550Z","duracionMinutos":60,"porcentajeAvance":40}'
{"error":{"tipo":"VALIDACION","mensaje":"Revisa los datos del formulario.","detalles":["El campo «fecha» es obligatorio o tiene un valor inválido."],"requestId":"7e4d7fc4-3785-4647-9455-919e73b4d588"}}
HTTP 400

### P7. Progreso con meta: 2,5 h de 2 h (125 %, meta superada), 1 de 3 días, hito 25 % alcanzado
$ curl -s -w "\nHTTP %{http_code}" https://gamer-progress-diary-api.onrender.com/api/videojuegos/6af51b0f321de400267b0d3a/progreso-semanal
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":{"horasSemanales":2,"diasPorSemana":3},"horasSemana":2.5,"porcentajeHoras":125,"diasJugadosSemana":1,"metaCumplida":false,"rachaActual":1,"mejorRacha":1,"hitos":[{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"alcanzado":true},{"descripcion":"Terminar","porcentajeObjetivo":100,"alcanzado":false}]}
HTTP 200

### P8. 400: id malformado
$ curl -s -w "\nHTTP %{http_code}" https://gamer-progress-diary-api.onrender.com/api/videojuegos/no-id/progreso-semanal
{"error":{"tipo":"ID_MALFORMADO","mensaje":"El identificador o valor enviado tiene un formato inválido.","requestId":"d7609670-f197-4205-8038-1159dc0eebd8"}}
HTTP 400

### P9. 404: juego inexistente
$ curl -s -w "\nHTTP %{http_code}" https://gamer-progress-diary-api.onrender.com/api/videojuegos/000000000000000000000000/progreso-semanal
{"error":{"tipo":"NO_ENCONTRADO","mensaje":"No se encontró el videojuego.","requestId":"609c0d53-0dda-4295-b134-68aa90ecaf62"}}
HTTP 404

### P10. CORS: preflight PATCH /metas desde el sitio
$ curl -s -o /dev/null -D - -X OPTIONS https://gamer-progress-diary-api.onrender.com/api/metas/6af51b10321de400267b0d3e/desactivar -H 'Origin: https://gamer-progress-diary-web.onrender.com' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type' | grep -iE '^(HTTP|access-control-allow-(origin|methods))'
HTTP/1.1 204 No Content
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
access-control-allow-origin: https://gamer-progress-diary-web.onrender.com


### P11. Desactivar la meta
$ curl -s -w '\nHTTP %{http_code}' -X PATCH https://gamer-progress-diary-api.onrender.com/api/metas/6af51b10321de400267b0d3e/desactivar | tail -c 60
1Z","updatedAt":"2026-11-12T01:49:10.312Z","__v":0}
HTTP 200

### P12. Limpieza: eliminar los juegos temporales (y sus metas)
$ curl -s -o /dev/null -w 'HTTP %{http_code} ' -X DELETE https://gamer-progress-diary-api.onrender.com/api/videojuegos/6af51b0f321de400267b0d3a; curl -s -o /dev/null -w 'HTTP %{http_code}' -X DELETE https://gamer-progress-diary-api.onrender.com/api/videojuegos/6af51b0f321de400267b0d3c
HTTP 204 HTTP 204

### P13. La meta ya no existe (sin huérfanas, RN-13)
$ curl -s -w "\nHTTP %{http_code}" https://gamer-progress-diary-api.onrender.com/api/metas/6af51b10321de400267b0d3e
{"error":{"tipo":"NO_ENCONTRADO","mensaje":"No se encontró la meta.","requestId":"d87df3bd-c4b1-42a5-af3b-a2fceddbe8c0"}}
HTTP 404
```

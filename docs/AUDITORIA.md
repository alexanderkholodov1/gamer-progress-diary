# Auditoría de la épica E2 · Metas y rachas

Auditoría de las specs [01 (backend)](specs/01-backend-metas-progreso.md), [02 (frontend)](specs/02-frontend-metas-progreso.md) y [03 (deuda técnica)](specs/03-deuda-tecnica.md) contra el código de la rama `feature/e2-metas-rachas`. Fecha: 11 de noviembre de 2026.

**Cómo se ejecutó**

- `npm --prefix backend test` → **5 archivos, 137 tests, todos pasan** (dominio sin base de datos + integración con MongoDB en memoria).
- `npm --prefix frontend test` → **9 tests, todos pasan** (tokens de diseño y arquitectura). `npm --prefix frontend run build` sin errores de tipos.
- Pruebas manuales de la API con curl: [pruebas-api.md](pruebas-api.md). Recorrido de la interfaz: [pruebas-frontend.md](pruebas-frontend.md). Revisión de diseño: [revision-diseno.md](revision-diseno.md).

Abreviaturas de evidencia: **dom** = `backend/tests/dominio/progreso.test.ts`, **mod** = `backend/tests/dominio/meta.modelo.test.ts`, **int** = `backend/tests/metas.test.ts`, **api** = `backend/tests/api.test.ts`, **res** = `backend/tests/dominio/resumen.test.ts`, **tok** = `frontend/tests/tokens.test.mjs`, **arq** = `frontend/tests/arquitectura.test.mjs`, **curl #n** = fila de pruebas-api.md, **UI** = pruebas-frontend.md.

## Spec 01 · Backend

| Criterio | Cómo se verificó | Resultado | Evidencia |
| --- | --- | --- | --- |
| CA-2.1.1 Meta válida queda activa | Test de modelo + integración + curl | Cumple | mod «acepta una meta válida…»; int «crea una meta activa…»; curl #5 |
| CA-2.1.2 Horas o días fuera de rango | Test de modelo (sin BD) + integración + curl | Cumple | mod `rechaza horasSemanales/diasPorSemana`; int → 400; curl #8 |
| CA-2.1.3 Hitos inválidos o más de 5 | Test de modelo + integración | Cumple | mod «acepta de 0 a 5 hitos y rechaza 6», «rechaza el hito…»; int → 400 |
| CA-2.1.4 Segunda meta activa → 409 | Integración (secuencial y 4 solicitudes simultáneas) + curl | Cumple | int «una segunda meta activa…», «dos solicitudes simultáneas…»; curl #6 |
| CA-2.1.5 Juego completado/abandonado → 409 | Integración + curl | Cumple | int `un juego %s no admite meta`; curl #7 |
| CA-2.1.6 Juego inexistente → 404 | Integración + curl | Cumple | int «juego inexistente → 404…»; curl #11 |
| CA-2.2.1 El progreso usa la meta editada | Dominio + integración | Cumple | dom «CA-2.2.1 / RN-10…»; int «al editar la meta…» |
| CA-2.2.2 Desactivar | Integración + curl | Cumple | int «desactivar deja al juego sin meta activa…» |
| CA-2.2.3 Meta desactivada no se edita ni reactiva → 409 | Integración | Cumple | int «una meta desactivada no se edita…» |
| CA-2.2.4 Historial ordenado con filtro | Integración + curl | Cumple | int «lista las metas del juego…»; curl #12 |
| CA-2.3.1 Solo partidas de la semana (lun–dom, Ecuador) | Dominio | Cumple | dom «la semana va de lunes a domingo…», «suma solo las partidas…» |
| CA-2.3.2 3,5 h de 5 h = 70 % | Dominio + curl | Cumple | dom «3,5 h de una meta de 5 h es 70 %», «reproduce el ejemplo de la ficha»; curl #2 |
| CA-2.3.3 7 h de 5 h = 140 % | Dominio + curl | Cumple | dom «7 h … es 140 %»; curl #4 (200 %) |
| CA-2.3.4 Dos partidas, un día | Dominio + curl | Cumple | dom «varias partidas el mismo día…»; curl #2 (martes con 2 partidas = 1 día) |
| CA-2.3.5 Partida de medianoche en su día de inicio | Dominio + curl | Cumple | dom «una partida a las 23:30 del domingo…»; curl #2b |
| CA-2.3.6 Sin meta activa | Dominio + integración + curl | Cumple | dom «sin meta activa: …»; int «sin meta activa calcula igualmente…»; curl #1 |
| CA-2.3.7 Sin partidas | Dominio + integración + curl | Cumple | dom «sin partidas: ceros…»; int «sin partidas ni meta…»; curl #1 |
| CA-2.3.8 Meta cumplida = horas Y días | Dominio + integración | Cumple | dom «la meta se cumple solo con las horas Y los días»; int «al editar la meta…» |
| CA-2.3.9 Partidas futuras no cuentan | Dominio | Cumple | dom «las partidas con fecha futura no cuentan…», «una partida con fecha futura no alarga la racha» |
| CA-2.4.1 Racha hasta hoy | Dominio | Cumple | dom «días consecutivos hasta hoy» |
| CA-2.4.2 Racha viva con partida ayer | Dominio + curl | Cumple | dom «si hoy aún no hay partida pero ayer sí…»; curl #2 (racha 3 sin partida hoy) |
| CA-2.4.3 Sin hoy ni ayer → 0 | Dominio + integración | Cumple | dom «sin partida hoy ni ayer…»; int «eliminar una partida recalcula…» |
| CA-2.4.4 Mejor racha con racha rota | Dominio + curl (9 partidas, 8 días) | Cumple | dom «con una racha rota…»; curl #2 (mejor 5, actual 3) |
| CA-2.4.5 Varias partidas el mismo día en la racha | Dominio | Cumple | dom «varias partidas el mismo día cuentan una vez en la racha» |
| CA-2.5.1 Hitos según avance | Dominio + integración + curl | Cumple | dom «con avance 50 %…»; curl #2 |
| CA-2.5.2 Hito vuelve a pendiente | Dominio + integración | Cumple | dom «si el avance actual baja…»; int «una partida más reciente con menos avance…» |
| CA-2.5.3 Sin partidas, ningún hito | Dominio | Cumple | dom «sin avance ningún hito está alcanzado» |
| CA-2.5.4 Hitos ordenados | Dominio + curl | Cumple | dom «devuelve los hitos de menor a mayor…»; curl #2 |
| CA-2.6.1 Completado/abandonado desactiva la meta | Integración | Cumple | int `pasar el juego a %s desactiva su meta…` |
| CA-2.6.2 Pausado/jugando la conserva | Integración | Cumple | int `pasar el juego a %s conserva la meta activa` |
| CA-2.6.3 Eliminar el juego elimina sus metas | Integración | Cumple | int «eliminar el juego elimina todas sus metas…» |
| Errores 400/404/409/500 (T-02) | Integración del `errorHandler` + curl | Cumple | int «T-02 · errorHandler con 400, 404, 409 y 500»; curl #6–#11 |
| Regla: el dominio no importa Mongoose | Revisión de código | Cumple | `src/dominio/progreso.ts` y `resumen.ts` sin `import` de Mongoose |

## Spec 02 · Frontend

| Criterio | Cómo se verificó | Resultado | Evidencia |
| --- | --- | --- | --- |
| CA-2.1.1 Crear meta y verla | Recorrido UI | Cumple | UI fila CA-2.1.1 |
| CA-2.1.2 Horas o días fuera de rango | Recorrido UI | Cumple | UI fila CA-2.1.2 |
| CA-2.1.3 Máximo 5 hitos | Recorrido UI | Cumple | UI fila CA-2.1.3 |
| CA-2.1.4 Meta duplicada con mensaje claro | Recorrido UI con dos pestañas | Cumple | UI fila CA-2.1.4 |
| CA-2.1.5 Juego completado/abandonado | Recorrido UI + captura | Cumple | UI; `capturas/e2/antes-detalle-portal-completado-390.png` |
| CA-2.2.1 Editar la meta | Captura del formulario en modo edición | Cumple | `capturas/e2/despues-meta-editar-hades-390.png` |
| CA-2.2.2 Desactivar con confirmación | Recorrido UI | Cumple | UI filas CA-2.2.2; `capturas/e2/antes-confirmacion-desactivar-390.png` |
| CA-2.3.3 Meta superada | Recorrido UI + captura | Cumple | UI fila CA-2.7.2; `capturas/e2/antes-detalle-stardew-superada-390.png` |
| CA-2.3.6 Sin meta activa | Recorrido UI + captura | Cumple | UI; `capturas/e2/antes-detalle-celeste-sin-meta-1280.png` |
| CA-2.3.7 Sin partidas | Recorrido UI | Cumple | UI fila CA-2.7.3 (0 % y racha 0) |
| CA-2.3.8 Meta cumplida | Revisión de código + test de dominio | Cumple parcialmente | El mensaje «¡Meta de la semana cumplida!» depende de `metaCumplida` (dom). No se capturó en pantalla porque la demo no tiene una semana cumplida |
| CA-2.4.1–2.4.5 Racha y mejor racha | Captura comparada con curl #2 | Cumple | `capturas/e2/despues-detalle-hades-1280.png` (3 y 5) |
| CA-2.5.1–2.5.4 Hitos | Captura | Cumple | «Alcanzado»/«Pendiente» en orden 25, 50 y 100 |
| CA-2.7.1 Registrar refresca | Recorrido UI | Cumple | UI fila CA-2.7.1 |
| CA-2.7.2 Editar refresca | Recorrido UI | Cumple | UI fila CA-2.7.2 |
| CA-2.7.3 Eliminar refresca | Recorrido UI | Cumple | UI fila CA-2.7.3 |
| CA-2.7.4 Carga, error y vacío | Recorrido UI con fallo simulado | Cumple | UI filas CA-2.7.4 |
| CA-F.1 Estilos solo con tokens | Test | Cumple | tok «CA-F.1 …» (2 tests) |
| CA-F.2 Sin `fetch` fuera de `src/api` | Test | Cumple | arq «CA-F.2 …» |
| CA-F.3 Compila sin errores de tipos | `npm run build` | Cumple | Build de Vite sin errores |
| CA-F.4 Fidelidad a DESIGN.md | Revisión de diseño | Cumple tras corregir | revision-diseno.md: 4 desviaciones (DR-1 a DR-4) corregidas y medidas de nuevo |

## Spec 03 · Deuda técnica

| Criterio | Cómo se verificó | Resultado | Evidencia |
| --- | --- | --- | --- |
| CA-D1.1 Resumen puro con partidas desordenadas | Test puro (rojo antes del código: «Cannot find module») | Cumple | res «suma, redondea…» |
| CA-D1.2 Desempate por creación e id | Test puro | Cumple | res «con fechas iguales desempata…» |
| CA-D1.3 Sin partidas | Test puro | Cumple | res «sin partidas devuelve ceros y null» |
| CA-D1.4 La respuesta HTTP del resumen no cambia | Tests de E1 sin modificar | Cumple | api «Resumen calculado en el servicio» (4 tests) |
| CA-D1.5 El progreso usa la misma función, sin segunda consulta | Revisión de código | Cumple | `services/progreso.service.ts`: una consulta de partidas → `calcularResumen` |
| CA-D2.1 Crear con fecha futura → 400 | Integración (rojo antes del código: 2 fallos) | Cumple | api «CA-D2.1 …» |
| CA-D2.2 Editar a fecha futura → 400 | Integración | Cumple | api «CA-D2.2 …» |
| CA-D2.3 Ahora, +4 min y pasado se aceptan | Integración | Cumple | api «CA-D2.3 …» |
| CA-D2.4 El formulario limita la fecha | Recorrido UI | Cumple | UI fila CA-D2.4 |
| CA-D3.1 Sin colores literales fuera de `tokens.css` | Test (rojo antes del cambio: 3 fallos) | Cumple | tok «CA-D3.1 …»; 0 hexadecimales en `styles.css` |
| CA-D3.2 Sin variables antiguas | Test | Cumple | tok «CA-D3.2 …» |
| CA-D3.3 Cada `var()` existe | Test | Cumple | tok «CA-D3.3 …» |
| CA-D3.4 E1 conserva su identidad | Capturas | Cumple | `capturas/e2/d3-biblioteca-1280.png`, `d3-formulario-foco-1280.png` |

## Despliegue

| Verificación | Cómo | Resultado | Evidencia |
| --- | --- | --- | --- |
| API y sitio de Render actualizados con E2 | curl a las URLs públicas después del merge | Pendiente hasta integrar el PR | Se completa en la sección «Producción» al desplegar |

## Desviaciones detectadas durante la auditoría

- **CA-2.3.8 en pantalla.** Cumple por lógica y test de dominio, pero no tiene captura porque los datos de demostración no incluyen una semana cumplida. Se marca «cumple parcialmente» en lugar de «cumple».
- **Spec 01, sección 7 (ticket → archivos).** T-02 dice que sus tests están en `backend/tests/metas.test.ts`, y así quedó; pero el bloque de T-02 se probó con una app Express mínima, no con las rutas de metas, porque el 409 por clave duplicada no tiene una ruta propia que lo dispare de forma determinista. El comportamiento real se comprueba además con la prueba de concurrencia de CA-2.1.4.

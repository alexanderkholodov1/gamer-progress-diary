# Pruebas del frontend de E2

Fecha: 11 de noviembre de 2026. Entorno: `npm --prefix backend run demo:e2` (API real con MongoDB en memoria) y `VITE_API_URL=http://localhost:3000/api npm --prefix frontend run dev`. Recorrido automatizado con Playwright (Chromium headless, 1280 × 900) que hace clic como lo haría la persona. El script vive fuera del repositorio porque es una herramienta de verificación, no parte del producto.

| Criterio | Paso en la interfaz | Resultado |
| --- | --- | --- |
| CA-2.1.1 | Celeste → «Crear meta semanal» → 2 h, 2 días, hito «Llegar al 10 %» → «Crear meta» | ✔ El detalle muestra «Meta: 2 h y 2 días por semana» y el hito |
| CA-2.1.4 | Formulario de crear meta abierto en dos pestañas; se envían las dos | ✔ La segunda muestra «Este videojuego ya tiene una meta activa…», sin «409» |
| CA-2.1.2 | Horas = 0 y enviar | ✔ No se envía; mensaje «más de 0 y hasta 100» |
| CA-2.1.3 | Añadir hitos hasta 5 | ✔ «+ Añadir hito» queda deshabilitado |
| CA-2.7.1 | «+ Registrar partida» de 90 min y 15 % → vuelve al detalle | ✔ 1,5 h de 2 h · 75 %, hito «Alcanzado» |
| CA-2.7.2 / CA-2.3.3 | «Editar» la partida → 150 min | ✔ 2,5 h · 125 % · «Meta superada», `<progress value="100">` |
| CA-2.7.3 | «Eliminar» la partida desde el detalle | ✔ 0 %, racha 0 («Juega hoy para empezar una racha.»), hito «Pendiente» sin recargar |
| CA-2.2.2 | «Desactivar meta» → «Cancelar» | ✔ La meta sigue |
| CA-2.2.2 / CA-2.3.6 | «Desactivar meta» → «Sí, desactivar» | ✔ «Sin meta activa» y botón «Crear meta semanal» |
| CA-2.7.4 | Se hace fallar la llamada al progreso | ✔ Error con «Volver a intentar»; al reintentar, la sección se recupera |
| CA-2.1.5 | Detalle de Portal 2 (completado) | ✔ «Este juego está completado, así que no admite metas…» |
| CA-D2.4 | Formulario de partida | ✔ El campo de fecha tiene `max` igual a la hora actual |

**Nota sobre un falso negativo.** En la primera ejecución CA-2.7.1 salió ✘. El script esperaba el texto «1,5», que también aparece en el resumen de E1, y leyó la sección de progreso mientras todavía mostraba «Calculando tu semana…». Al esperar el texto «75 %» dentro de `.progreso-panel`, el criterio se cumplió. No hubo cambio en la aplicación.

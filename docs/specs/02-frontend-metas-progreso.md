# Spec 02 · Frontend: progreso semanal y formulario de meta

## 1. Alcance

Cubre la parte visible de HU-2.1, HU-2.2, HU-2.3, HU-2.4, HU-2.5 y HU-2.7, con los tickets T-07 a T-11. Consume la API de la [spec 01](01-backend-metas-progreso.md) y sigue [DESIGN.md](../../DESIGN.md). No incluye historial gráfico de semanas (no-alcance).

## 2. Contratos

### Servicio `frontend/src/api/metasApi.ts`

| Función | Llama a |
| --- | --- |
| `crear(datos: MetaEntrada)` | `POST /metas` |
| `obtener(id)` | `GET /metas/:id` |
| `listarDeVideojuego(videojuegoId, activa?)` | `GET /videojuegos/:id/metas?activa=` |
| `actualizar(id, datos)` | `PATCH /metas/:id` |
| `desactivar(id)` | `PATCH /metas/:id/desactivar` |
| `progresoSemanal(videojuegoId)` | `GET /videojuegos/:id/progreso-semanal` |

Tipos nuevos en `api/tipos.ts`: `HitoEntrada`, `Hito`, `MetaEntrada`, `Meta`, `HitoEvaluado` y `ProgresoSemanal`, con los mismos nombres de campo de la API.

### Componentes y pantallas

| Pieza | Ruta o ubicación | Responsabilidad |
| --- | --- | --- |
| `components/ProgresoSemanal.tsx` | Detalle del juego, antes del resumen de E1 | Consulta el progreso y la meta activa; muestra horas, días, racha, mejor racha e hitos; acciones «Editar meta» y «Desactivar meta» |
| `components/ConfirmacionEnLinea.tsx` | Dentro de `ProgresoSemanal` | Pregunta y explica la consecuencia antes de desactivar |
| `pages/MetaFormulario.tsx` | `/videojuegos/:id/meta` | Crea la meta si no hay activa o edita la activa, con hasta 5 hitos |
| `pages/PartidaFormulario.tsx` | `/partidas/nueva` y **`/partidas/:id/editar`** | Registra o edita una partida y vuelve al detalle del juego |
| `components/PartidasTabla.tsx` | Detalle y «Mis partidas» | Agrega el enlace «Editar» a cada fila |
| `styles/metas.css` | Importado en `main.tsx` | Estilos de E2, solo con variables de `tokens.css` |

## 3. Reglas

### Progreso semanal (HU-2.3, HU-2.4, HU-2.5)

- **DEBE** mostrar la semana como «Semana del 9 al 15 de nov.» a partir de `semana.inicio` y `semana.fin`.
- **DEBE** mostrar una barra `<progress>` de horas con `value = min(porcentajeHoras, 100)` y el texto «3,5 h de 5 h · 70 %».
- **DEBE** mostrar «Meta superada» cuando `porcentajeHoras > 100`, con el porcentaje real (RN-05).
- **DEBE** mostrar los días como «3 de 4 días», con un segmento por día objetivo.
- **DEBE** indicar «¡Meta de la semana cumplida!» cuando `metaCumplida` es `true` (RN-14).
- **DEBE** mostrar la racha actual y la mejor racha con la palabra «días»; con racha 0, un texto que invita a jugar hoy.
- **DEBE** listar los hitos de menor a mayor objetivo, con el texto «Alcanzado» o «Pendiente» además del color (RN-11).
- **DEBE**, sin meta activa, mostrar igualmente horas, días y rachas y un estado vacío con el botón «Crear meta semanal» (RN-18). Si el juego está completado o abandonado, explicar que no admite metas en lugar del botón (RN-12).
- **DEBE** mostrar los estados de carga («Calculando tu semana…»), error con «Volver a intentar» y vacío.
- **NO DEBE** calcular horas, rachas ni hitos en el cliente: solo presenta lo que devuelve la API.

### Formulario de meta (HU-2.1, HU-2.2)

- **DEBE** tener campos con etiqueta visible: horas por semana (`min 0.5`, `max 100`, `step 0.5`), días por semana (1 a 7) e hitos (descripción de hasta 80 caracteres y objetivo de 1 a 100).
- **DEBE** permitir agregar hasta 5 hitos y quitar cualquiera; el botón «Añadir hito» se deshabilita en 5.
- **DEBE** validar en el cliente antes de enviar y mostrar el mensaje de la API si la rechaza (por ejemplo, la meta duplicada con 409), sin códigos HTTP.
- **DEBE** precargar la meta activa cuando existe y guardar con `actualizar`; si no existe, crear con `crear`.
- **DEBE** volver al detalle del juego al guardar, donde el progreso se vuelve a consultar.

### Desactivar (HU-2.2)

- **DEBE** pedir confirmación en línea con el texto «¿Desactivar tu meta? Seguirás viendo tus horas y rachas, pero sin objetivo. No se puede reactivar.» y los botones «Sí, desactivar» y «Cancelar».
- **DEBE** volver a consultar el progreso después de desactivar.
- **NO DEBE** usar `window.confirm`.

### Refresco con las partidas (HU-2.7)

- **DEBE** volver a consultar el progreso al eliminar una partida desde el detalle.
- **DEBE** volver al detalle (y por lo tanto reconsultar) después de registrar o editar una partida.
- **DEBE** permitir editar fecha, duración, avance y notas de una partida existente.

### Diseño y arquitectura

- **DEBE** usar en los estilos de E2 solo variables de `tokens.css`.
- **NO DEBE** llamar a `fetch` desde páginas o componentes, ni agregar librerías de UI, de CSS o de gráficos.

## 4. Criterio → verificación

Verificación manual: frontend local contra la API en `npm run demo:e2` (MongoDB en memoria con datos de prueba) y, al final, contra Render. Tests: `npm --prefix frontend test`.

| Criterio | Verificación |
| --- | --- |
| CA-2.1.1 Crear meta y verla en el detalle | Manual: crear meta con 3 hitos → el detalle muestra la meta |
| CA-2.1.2 Horas o días fuera de rango | Manual: el formulario no envía y explica el límite |
| CA-2.1.3 Hitos inválidos o más de 5 | Manual: el botón se deshabilita en 5 y un hito vacío no se envía |
| CA-2.1.4 Meta duplicada | Manual: con dos pestañas, crear dos metas → la segunda muestra el mensaje de la API |
| CA-2.1.5 Juego completado/abandonado | Manual: el progreso explica que no admite metas |
| CA-2.2.1 Editar la meta | Manual: cambiar horas → el porcentaje cambia en el detalle |
| CA-2.2.2 Desactivar con confirmación | Manual: Cancelar no cambia nada; confirmar deja «Sin meta activa» |
| CA-2.3.3 Meta superada | Manual con datos de prueba (140 %): barra llena y «Meta superada» |
| CA-2.3.6 Sin meta activa | Manual: horas, días y rachas visibles y botón «Crear meta semanal» |
| CA-2.3.7 Sin partidas | Manual: ceros y estado vacío de hitos |
| CA-2.3.8 Meta cumplida | Manual con datos de prueba |
| CA-2.4.1–2.4.5 Racha y mejor racha | Manual: las cifras coinciden con la respuesta de la API |
| CA-2.5.1–2.5.4 Hitos | Manual: «Alcanzado»/«Pendiente» y orden ascendente |
| CA-2.7.1 Registrar partida refresca | Manual: registrar → volver → horas aumentan |
| CA-2.7.2 Editar partida refresca | Manual: editar duración → horas cambian |
| CA-2.7.3 Eliminar partida refresca | Manual: eliminar → horas bajan sin recargar la página |
| CA-2.7.4 Carga, error y vacío | Manual: API detenida → error con reintento; sin meta → vacío |
| CA-F.1 Estilos solo con tokens | Test `frontend/tests/tokens.test.mjs` sobre `styles/metas.css` |
| CA-F.2 Sin `fetch` fuera de `src/api` | Test `frontend/tests/arquitectura.test.mjs` |
| CA-F.3 Compila sin errores de tipos | `npm --prefix frontend run build` |
| CA-F.4 Fidelidad a DESIGN.md | Revisión de diseño en `docs/revision-diseno.md` |

## 5. Ticket → archivos

| Ticket | Archivos |
| --- | --- |
| T-07 | `frontend/src/api/metasApi.ts`, `frontend/src/api/tipos.ts`, `frontend/tests/arquitectura.test.mjs` |
| T-08 | `frontend/src/components/ProgresoSemanal.tsx`, `frontend/src/components/ConfirmacionEnLinea.tsx`, `frontend/src/styles/metas.css`, `frontend/src/main.tsx`, `frontend/src/pages/VideojuegoDetalle.tsx`, `frontend/tests/tokens.test.mjs` |
| T-09 | `frontend/src/pages/PartidaFormulario.tsx`, `frontend/src/components/PartidasTabla.tsx`, `frontend/src/pages/VideojuegoDetalle.tsx`, `frontend/src/App.tsx` |
| T-10 | `frontend/src/pages/MetaFormulario.tsx`, `frontend/src/components/ProgresoSemanal.tsx`, `frontend/src/App.tsx` |
| T-11 | `docs/revision-diseno.md` y los archivos que corrija la revisión |

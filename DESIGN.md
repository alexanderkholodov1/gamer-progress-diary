# DESIGN.md — Diario de Progreso Gamer

Sistema de diseño del frontend (`frontend/`). Recoge la identidad visual que ya tenía el Proyecto 3 y la extiende para la épica E2 · Metas y rachas. Léelo antes de crear o modificar cualquier pantalla o componente. Si una spec lo contradice, manda la spec y este archivo se actualiza en el mismo commit.

## Concepto

Un diario de juego luminoso: claro, ordenado y alentador. El índigo es el color del progreso y el ámbar, el de la constancia (la racha).

**Palabras clave:** claro · alentador · ordenado.

**Persona usuaria y contexto:** una sola persona que registra sus partidas al terminar de jugar, desde el computador o el móvil. Quiere saber en un vistazo cómo va esta semana, sin leer tablas largas.

## Principios

1. **Lo importante primero:** en el detalle de un juego, el progreso de la semana va antes que el historial.
2. **Una sola acción primaria por pantalla o sección.** Las demás son secundarias o enlaces.
3. **Cada consulta tiene sus tres estados:** cargando, error con reintento y vacío con el siguiente paso.
4. **Los números se explican:** cada cifra lleva su etiqueta y su unidad («3,5 h de 5 h»).
5. **Nada depende solo del color:** los estados llevan texto o icono además del color.

## Color

Usa solo estas variables de `frontend/src/styles/tokens.css`. No escribas colores literales en los componentes ni en `styles.css`.

| Variable | Valor | Uso |
| --- | --- | --- |
| `--color-primario` | `#4b52db` | Botón primario, enlaces y marca |
| `--color-primario-oscuro` | `#373db0` | Hover del botón primario y de los enlaces |
| `--color-primario-suave` | `#eeefff` | Fondo de paneles destacados (resumen, progreso), navegación activa |
| `--color-primario-borde` | `#dfe2fb` | Borde y divisores dentro de los paneles destacados |
| `--color-primario-texto` | `#353c8d` | Cifras grandes y texto sobre `--color-primario-suave` |
| `--color-barra` | `#6269da` | Relleno de las barras de progreso |
| `--color-pista` | `#d9ddf7` | Pista vacía de las barras de progreso |
| `--color-foco` | `#6269da` | Contorno de foco del teclado |
| `--color-texto` | `#252b3b` | Texto principal y títulos |
| `--color-texto-medio` | `#4e566c` | Etiquetas de formulario y texto de botones secundarios |
| `--color-sobre-primario` | `#ffffff` | Texto sobre `--color-primario` (botones primarios) |
| `--color-texto-secundario` | `#687084` | Ayudas, fechas, placeholders y metadatos (4,9:1 sobre blanco) |
| `--color-fondo` | `#f7f8fc` | Fondo de la página y de los avisos neutros |
| `--color-superficie` | `#ffffff` | Tarjetas, paneles y formularios |
| `--color-superficie-hundida` | `#eceff6` | Contadores, cabecera de tablas |
| `--color-borde` | `#e5e8f0` | Bordes decorativos de tarjetas y separadores |
| `--color-borde-fuerte` | `#bdc2d6` | Borde de botones secundarios al pasar el cursor |
| `--color-borde-campo` | `#858ca0` | Borde de campos de formulario (3,4:1, visible) |
| `--color-exito` | `#287152` | Hito alcanzado, meta cumplida, estado «Jugando» |
| `--color-exito-fondo` | `#e9f7f0` | Fondo de los estados de éxito |
| `--color-exito-borde` | `#deeee4` | Borde de los elementos alcanzados |
| `--color-aviso` | `#8c5d17` | Racha, estado «Pausado» |
| `--color-aviso-fondo` | `#fff4df` | Fondo de la tarjeta de racha y del estado «Pausado» |
| `--color-error` | `#ae3546` | Acciones destructivas (eliminar, desactivar) |
| `--color-error-texto` | `#8e2f42` | Texto de los mensajes de error |
| `--color-error-fondo` | `#fff2f4` | Fondo de los mensajes de error y de la confirmación destructiva |
| `--color-error-borde` | `#f0ccd4` | Borde de los mensajes de error |
| `--tono-1…4-fondo` / `--tono-1…4-texto` | índigo, verde, arena y azul | Solo para el monograma decorativo de las tarjetas de la biblioteca |

Todo texto cumple 4,5:1 sobre su fondo; los bordes de campos y el foco, 3:1.

## Tipografía

Google Fonts, cargadas una sola vez desde `styles.css`:

- `--fuente-titulos`: **Manrope** 700–800, con interletraje negativo en títulos.
- `--fuente-texto`: **DM Sans** 400–700.

| Uso | Variable | Tamaño |
| --- | --- | --- |
| Título de pantalla (`h1`) | — | `clamp(1.8rem, 3vw, 2.5rem)`, Manrope 800 |
| Cifras del resumen y del progreso | `--texto-cifra` | 2.1rem, Manrope 800 |
| Título de sección (`h2`) | `--texto-titulo-seccion` | 1.1rem, Manrope 800 |
| Texto general y campos | `--texto-base` | 0.9rem |
| Etiquetas, botones y ayudas | `--texto-chico` | 0.82rem |
| Cejas, chips y notas mínimas | `--texto-mini` | 0.75rem (mínimo para componentes nuevos) |

Interlineado 1.55. Las cejas (etiquetas sobre los títulos) van en mayúsculas con `letter-spacing: 0.14em`.

## Espacio y forma

| Variable | Valor | Uso típico |
| --- | --- | --- |
| `--espacio-1` | 4 px | Entre icono y texto |
| `--espacio-2` | 8 px | Entre etiqueta y campo, entre chips |
| `--espacio-3` | 12 px | Relleno de botones, separación en listas |
| `--espacio-4` | 16 px | Entre campos de un formulario |
| `--espacio-5` | 24 px | Relleno de paneles y tarjetas |
| `--espacio-6` | 32 px | Entre secciones |
| `--espacio-7` | 48 px | Márgenes amplios en escritorio |

- **Radios:** `--radio-chip` 6 px, `--radio-control` 9 px (botones y campos), `--radio-aviso` 12 px, `--radio-tarjeta` 16 px, `--radio-pildora` para barras.
- **Altura táctil:** `--alto-tactil` 44 px en botones, campos y enlaces de acción.
- **Sombra:** solo `--sombra-tarjeta` en el hover de las tarjetas de la biblioteca. Los paneles se separan con bordes de 1 px.

## Componentes

| Componente | Cómo se ve | Reglas |
| --- | --- | --- |
| **Botón primario** (`.boton`) | Fondo `--color-primario`, texto blanco 700 | Uno por sección. Hover `--color-primario-oscuro` |
| **Botón secundario** (`.boton.secundario`) | Fondo superficie, borde `--color-borde-campo`, texto `--color-texto-medio` | Cancelar, acciones de apoyo |
| **Enlace de acción** (`.enlace`) | Texto subrayado `--color-primario`; `.peligro` usa `--color-error` | Acciones destructivas siempre como enlace de peligro + confirmación |
| **Campo** | Etiqueta visible arriba, borde `--color-borde-campo`, ayuda debajo en `--color-texto-secundario` | `required` y límites (`min`, `max`, `step`) iguales a los de la API |
| **Panel de progreso semanal** | Fondo `--color-primario-suave`, borde `--color-primario-borde`, ceja con las fechas de la semana | Cuatro cifras: horas, días, racha actual y mejor racha. En móvil, dos columnas |
| **Barra de horas** | `<progress>` de 8 px, pista `--color-pista`, relleno `--color-barra` | Se llena hasta 100 %; si la meta se supera muestra el porcentaje real y el texto «Meta superada» |
| **Días de la semana** | Segmentos, uno por día objetivo; los jugados en `--color-barra` | Texto siempre visible: «3 de 4 días» |
| **Tarjeta de racha** | Fondo `--color-aviso-fondo`, cifra en `--color-aviso` | «días seguidos». Con 0 invita a jugar hoy |
| **Lista de hitos** | Fila con icono SVG en línea, descripción y objetivo («50 %») | Alcanzado: fondo `--color-exito-fondo`, texto «Alcanzado». Pendiente: borde discontinuo, texto «Pendiente» |
| **Confirmación en línea** | Caja `--color-error-fondo` debajo de la acción, con pregunta y dos botones | Reemplaza a `window.confirm` en pantallas nuevas. Explica la consecuencia |
| **Cargando** (`Cargando`) | Spinner pequeño y texto | El texto dice qué se carga: «Calculando tu semana…» |
| **Error** (`Fallo`) | Fondo `--color-error-fondo`, título y mensaje | Siempre con «Volver a intentar» si es una consulta |
| **Vacío** (`Vacio`) | Borde discontinuo, icono tipográfico y una acción | Siempre ofrece el siguiente paso: «Crear meta semanal» |
| **Chip** | Fondo suave y texto 700 de 0.75rem | Estado del juego, porcentajes del historial |

## Datos y textos de la API

- **Horas:** un decimal con coma, «3,5 h». **Porcentajes:** entero con espacio, «70 %».
- **Semana:** «Semana del 2 al 8 de nov.», siempre de lunes a domingo en hora de Ecuador.
- **Meta:** «5 h y 4 días por semana». Sin meta: «Sin meta activa».
- **Hitos vs. logros:** los **logros** los marca la persona a mano (E1); los **hitos** se cumplen solos según el avance (E2). Nunca se mezclan en la misma lista.
- **Errores de la API:** se muestra `error.mensaje` en español; nunca el código HTTP ni el `requestId` como texto principal.

## Tono de voz

Español de Ecuador, tuteo, frases cortas, cálido y sin tecnicismos. Anima sin regañar.

| Así sí | Así no |
| --- | --- |
| «Llevas 4 días seguidos. ¡Sigue así!» | «rachaActual: 4» |
| «Este juego ya tiene una meta activa. Edítala o desactívala primero.» | «Error 409: Conflict» |
| «Aún no tienes meta para este juego. Fija una y mide tu semana.» | «No hay datos.» |
| «¿Desactivar tu meta? Seguirás viendo tus horas y rachas, pero sin objetivo.» | «¿Está seguro?» |

## Accesibilidad

- Contraste de texto de 4,5:1 o más; bordes de campos y foco de 3:1 o más.
- Un `<label>` real en cada campo y `aria-describedby` hacia su ayuda o error.
- Las barras usan `<progress>` con `aria-label` y el valor también como texto.
- Los estados (alcanzado, pendiente, meta superada) se dicen con texto, no solo con color.
- Zonas táctiles de 44 px como mínimo. Foco visible con contorno de 3 px en `--color-foco`.
- Botones con `<button>` y navegación con `<Link>`; nunca un `div` con `onClick`.
- Se respeta `prefers-reduced-motion`.

## No hacemos

- Librerías de UI, de CSS ni de gráficos (Tailwind, Bootstrap, MUI, Chart.js…).
- Gráficos históricos, rankings ni notificaciones (están fuera del alcance de E2).
- Colores, fuentes o radios literales fuera de `tokens.css`.
- Emojis, ilustraciones ni iconos de librerías: solo caracteres tipográficos o SVG en línea mínimos.
- Modo oscuro, degradados y animaciones decorativas (solo el spinner y transiciones de 150 ms).
- `window.confirm` o `alert` en pantallas nuevas.
- Textos con jerga técnica: «400», «ObjectId», «payload», «null».

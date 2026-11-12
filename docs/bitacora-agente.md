# Bitácora del trabajo con el agente

Ocho momentos clave del trabajo con Claude Code en la épica E2: qué se le pidió, qué hizo bien o mal y cómo se corrigió. Todo ocurrió el 11 de noviembre de 2026 y queda rastreable en el historial de la rama `feature/e2-metas-rachas`.

## 1. Encontrar el punto de partida

- **Pedido:** entender la tarea usando como contexto la carpeta del Entregable 3.
- **Qué pasó:** esa carpeta solo tenía las instrucciones, no el código. El agente buscó el proyecto en el disco y no lo encontró. Entonces listó mis repositorios con `gh repo list`, identificó `gamer-progress-diary` por su descripción y lo clonó en la carpeta del Entregable 4. Antes de proponer nada, corrió los 41 tests y compiló ambos lados.
- **Reflexión:** bien. No supuso que el código estaba donde decía la instrucción y verificó el estado real antes de diagnosticar. El diagnóstico parte de evidencia (tests en verde, 89 colores literales contados) y no de impresiones.

## 2. Descubrimiento de huecos

- **Pedido:** resolver los ocho huecos de la ficha.
- **Qué pasó:** el agente propuso una regla para cada hueco con su motivo y me preguntó antes de escribir el PRD. Además encontró cuatro huecos que la ficha no menciona: qué significa «cumplir» la meta semanal, las partidas con fecha futura, si una meta desactivada se puede reactivar y qué pasa con dos solicitudes de meta al mismo tiempo. Acepté sus propuestas.
- **Reflexión:** bien, y es lo que más valor aportó. La ficha define la métrica «3 de 4 semanas» pero nunca dice qué es cumplir una semana; sin RN-14 la métrica no se podía medir.

## 3. Probar los hooks

- **Pedido:** crear un hook de formato (PostToolUse) y otro que bloquee `.env` (PreToolUse), y comprobar que funcionan.
- **Qué hizo mal:** en la primera prueba, el bloqueo de `backend\.env` con ruta de Windows salió con código 0 (permitido) y el formateo no cambió el archivo. El problema no estaba en los hooks sino en la prueba: el `echo` de Git Bash alteraba las barras invertidas del JSON y las rutas `/c/Users/…` no existen para Node en Windows.
- **Corrección:** el agente generó el JSON con Node y usó rutas de Windows reales. Así, los 11 casos (bloquear `.env`, `.env.local` y `cat backend/.env`; permitir `.env.example`) y el formateo dieron lo esperado. Pendiente para mí: los hooks del repositorio solo se activan si Claude Code se abre dentro del repositorio, porque esta sesión se abrió en la carpeta padre. La captura de `/hooks` la tomo abriendo el agente en `gamer-progress-diary/`.

## 4. Backlog marcado como terminado antes de tiempo

- **Pedido:** escribir el backlog con tickets, Definition of Done y dependencias.
- **Qué hizo mal:** el agente escribió las 15 fichas de ticket con todas las casillas marcadas y «Estado: hecho» cuando todavía no existía código.
- **Corrección:** él mismo lo vio al releer antes del commit y lo pasó todo a pendiente. Los tickets se marcaron como hechos recién en la fase de auditoría, como pide la guía.

## 5. Commits en rojo: el agente se saltó una regla de AGENTS.md

- **Pedido:** implementar T-06 (ciclo de vida de las metas) y T-07 (`metasApi.ts`).
- **Qué hizo mal:** encadenó `tests ; git commit` con `;` en vez de `&&`, así que el commit se hizo aunque los tests fallaban. En T-06 se commiteó «feat» con 3 tests en rojo y sin la implementación: el reemplazo de texto por script no encontró el código porque Git en Windows deja los archivos con saltos de línea CRLF. En T-07, una expresión regular del test quedó con `\b` convertido en carácter de retroceso.
- **Cómo se detectó:** leyendo la salida de los tests en ese mismo paso («3 failed», «fail 1»).
- **Corrección:** el agente aplicó los cambios con su herramienta de edición, que respeta CRLF, corrigió el test, comprobó el verde y rehízo los dos commits locales con `git commit --amend` antes de publicar nada. Desde entonces cada commit va encadenado con `&&` a los tests. Lección: la regla «ejecutar los tests antes de dar una tarea por terminada» no basta si el comando permite commitear igual.

## 6. Desvío de la spec detectado en la revisión de diseño

- **Pedido:** revisar la interfaz de E2 contra DESIGN.md y la spec 02.
- **Qué pasó:** el agente tomó capturas con Playwright a 1280 y 390 px y midió en la página el texto menor de 12 px, los campos sin etiqueta y el scroll horizontal. Encontró cuatro desviaciones. Una es un **desvío de la spec**: la spec 02 y RN-02 piden los hitos de menor a mayor objetivo, y así salían en el progreso, pero el formulario de edición los mostraba en el orden en que se guardaron (100 %, 25 %, 50 %). Las otras: la ceja de la sección medía 9,3 px en móvil, las ayudas del formulario 11,8 px, y las horas aparecían con punto en E1 («8.3 h») y con coma en E2 («3,5 h»).
- **Cómo se detectó:** comparando la captura del formulario con la del detalle y con la regla RN-02. Ningún test lo habría encontrado, porque el test de dominio ordena bien: el desvío estaba en otra pantalla.
- **Corrección:** commit `fix(E2): T-11 …` y una nueva medición con el mismo script, en [revision-diseno.md](revision-diseno.md).

## 7. Un documento de evidencia con fechas equivocadas

- **Pedido:** documentar las pruebas con curl.
- **Qué hizo mal:** al describir los datos de prueba, el agente escribió que la racha de 5 días iba «del 31 oct al 4 nov», tomando las fechas en UTC de la salida como si fueran hora de Ecuador. En hora local eran del 30 oct al 3 nov.
- **Corrección:** lo detectó al releer la salida del historial y lo corrigió en un commit propio. Es justo el error que la regla RN-03 quiere evitar (confundir UTC con hora local), cometido en la documentación en lugar del código.

## 8. Verificar al verificador

- **Pedido:** recorrer la interfaz para comprobar el refresco del progreso (HU-2.7).
- **Qué pasó:** el recorrido automatizado marcó CA-2.7.1 como fallido. Antes de tocar la aplicación, el agente revisó su propio script. Esperaba el texto «1,5», que también aparece en el resumen de E1, y leía la sección de progreso mientras aún decía «Calculando tu semana…». Al esperar «75 %» dentro de la sección, el criterio se cumplió.
- **Reflexión:** bien. Un test en rojo no siempre significa código roto. Cambiar la app para «arreglar» un falso negativo habría introducido un desvío real.

## Nota: el desvío de la spec y cómo lo detecté

El desvío más claro fue el del momento 6: el formulario de meta mostraba los hitos en un orden distinto al que exigen la spec 02 y RN-02. Lo detecté en la revisión de diseño al comparar dos capturas de la misma meta (detalle y formulario), no con los tests, que solo cubrían la función de dominio. Desde entonces, cuando una regla afecta a más de una pantalla, reviso todas las pantallas donde aparece el dato y no solo la que nombra la historia.

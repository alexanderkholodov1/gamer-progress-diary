# E2 · Metas y rachas

Backlog de la épica E2 del [PRD](../prd/diario-gamer-prd.md). Cada historia tiene criterios **DADO / CUANDO / ENTONCES** sin detalle técnico. Los tickets llevan id, tipo, Definition of Done (DoD) y dependencias. Los criterios se identifican como `CA-<historia>.<n>` y son los mismos que verifican las specs y la auditoría.

## Historias

### HU-2.1 · Fijar una meta semanal

Como jugador que se propone metas, quiero fijar una meta semanal de horas y días para un videojuego, con algunos hitos de avance, para tener un objetivo concreto contra el cual medirme.

- **CA-2.1.1** **DADO** un juego «jugando» o «pausado» sin meta activa, **CUANDO** fijo una meta con horas (más de 0 y hasta 100), días (entero de 1 a 7) y hasta 5 hitos válidos, **ENTONCES** la meta queda activa y la veo en el detalle del juego.
- **CA-2.1.2** **DADO** que las horas no son mayores que 0 y hasta 100, o los días no son un entero de 1 a 7, **CUANDO** intento guardar la meta, **ENTONCES** no se guarda y se me dice qué corregir.
- **CA-2.1.3** **DADO** que la meta tiene más de 5 hitos, o un hito sin descripción o con objetivo fuera de 1 a 100, **CUANDO** intento guardarla, **ENTONCES** no se guarda.
- **CA-2.1.4** **DADO** un juego que ya tiene una meta activa, **CUANDO** intento fijarle otra, **ENTONCES** se rechaza con un mensaje que sugiere editar o desactivar la actual. (RN-01, RN-17)
- **CA-2.1.5** **DADO** un juego «completado» o «abandonado», **CUANDO** intento fijarle una meta, **ENTONCES** se rechaza y se me explica por qué. (RN-12)
- **CA-2.1.6** **DADO** un juego que no existe, **CUANDO** intento fijarle una meta, **ENTONCES** se me informa que el juego no se encontró.

### HU-2.2 · Ajustar o desactivar mi meta

Como jugador, quiero editar mi meta activa o desactivarla, para adaptarla a mi tiempo real sin perder el historial.

- **CA-2.2.1** **DADO** una meta activa, **CUANDO** cambio sus horas, días o hitos con valores válidos, **ENTONCES** el progreso de la semana se calcula con la meta nueva. (RN-10)
- **CA-2.2.2** **DADO** una meta activa, **CUANDO** pido desactivarla, **ENTONCES** se me pide confirmar explicando la consecuencia; si confirmo, el juego queda sin meta activa, y si cancelo, nada cambia.
- **CA-2.2.3** **DADO** una meta desactivada, **CUANDO** intento editarla o reactivarla, **ENTONCES** se rechaza; para volver a tener objetivo creo una meta nueva. (RN-16)
- **CA-2.2.4** **DADO** un juego con metas anteriores, **CUANDO** consulto sus metas, **ENTONCES** veo la activa y las desactivadas, de la más reciente a la más antigua.

### HU-2.3 · Ver cómo voy esta semana

Como jugador, quiero ver en el detalle del juego cuántas horas y días llevo esta semana frente a mi meta, para saber si estoy cumpliendo lo que me propuse.

- **CA-2.3.1** **DADO** partidas dentro y fuera de la semana en curso (lunes a domingo, hora de Ecuador), **CUANDO** veo el progreso, **ENTONCES** las horas son la suma de las duraciones de esta semana, con un decimal. (RN-03, RN-04)
- **CA-2.3.2** **DADO** 3,5 h jugadas esta semana y una meta de 5 h, **CUANDO** veo el progreso, **ENTONCES** el porcentaje es 70 %.
- **CA-2.3.3** **DADO** 7 h jugadas y una meta de 5 h, **CUANDO** veo el progreso, **ENTONCES** el porcentaje es 140 %, la barra se ve llena y dice «Meta superada». (RN-05)
- **CA-2.3.4** **DADO** dos partidas el mismo día, **CUANDO** veo los días jugados, **ENTONCES** cuentan como un solo día y sus horas se suman. (RN-06)
- **CA-2.3.5** **DADO** una partida que empieza el domingo a las 23:30 y dura 60 minutos, **CUANDO** veo el progreso, **ENTONCES** cuenta completa en ese domingo y en esa semana, no en el lunes. (RN-07)
- **CA-2.3.6** **DADO** un juego sin meta activa, **CUANDO** veo el progreso, **ENTONCES** veo horas, días y rachas sin porcentaje, y una invitación a crear una meta. (RN-18)
- **CA-2.3.7** **DADO** un juego sin partidas, **CUANDO** veo el progreso, **ENTONCES** horas, días y rachas están en 0. (RN-19)
- **CA-2.3.8** **DADO** que en la semana alcanzo las horas y los días de la meta, **CUANDO** veo el progreso, **ENTONCES** se indica que la meta de la semana está cumplida; si falta cualquiera de los dos, no. (RN-14)
- **CA-2.3.9** **DADO** una partida con fecha futura, **CUANDO** veo el progreso, **ENTONCES** no cuenta para las horas, los días ni la racha. (RN-15)

### HU-2.4 · Ver mi racha

Como jugador, quiero ver cuántos días seguidos llevo jugando y mi mejor racha, para mantenerme constante.

- **CA-2.4.1** **DADO** partidas en días consecutivos hasta hoy, **CUANDO** veo la racha, **ENTONCES** la racha actual es el número de esos días.
- **CA-2.4.2** **DADO** que jugué ayer pero todavía no hoy, **CUANDO** veo la racha, **ENTONCES** sigue viva y cuenta hasta ayer. (RN-09)
- **CA-2.4.3** **DADO** que no jugué ni hoy ni ayer, **CUANDO** veo la racha, **ENTONCES** la racha actual es 0 y la mejor racha se conserva.
- **CA-2.4.4** **DADO** un historial con una racha rota (5 días seguidos, un día sin jugar y luego 2 días), **CUANDO** veo la racha, **ENTONCES** la mejor racha es 5 y la actual solo cuenta el tramo más reciente.
- **CA-2.4.5** **DADO** varias partidas el mismo día dentro de una racha, **CUANDO** veo la racha, **ENTONCES** ese día cuenta una sola vez. (RN-06)

### HU-2.5 · Ver mis hitos

Como jugador, quiero ver qué hitos de mi meta he alcanzado, para reconocer mi avance.

- **CA-2.5.1** **DADO** un avance actual de 50 % e hitos de 25 %, 50 % y 100 %, **CUANDO** veo los hitos, **ENTONCES** los de 25 % y 50 % están alcanzados y el de 100 % pendiente.
- **CA-2.5.2** **DADO** un hito alcanzado, **CUANDO** registro una partida más reciente con menos avance, **ENTONCES** el hito vuelve a pendiente. (RN-11)
- **CA-2.5.3** **DADO** un juego sin partidas, **CUANDO** veo los hitos, **ENTONCES** ninguno está alcanzado. (RN-19)
- **CA-2.5.4** **DADO** hitos ingresados en cualquier orden, **CUANDO** los veo, **ENTONCES** aparecen de menor a mayor objetivo. (RN-02)

### HU-2.6 · Metas coherentes con el juego

Como jugador, quiero que mis metas sigan el ciclo de vida del juego, para no tener metas de juegos terminados o eliminados.

- **CA-2.6.1** **DADO** un juego con meta activa, **CUANDO** lo marco como «completado» o «abandonado», **ENTONCES** su meta se desactiva sola y queda en el historial. (RN-12)
- **CA-2.6.2** **DADO** un juego con meta activa, **CUANDO** lo marco como «pausado», **ENTONCES** su meta sigue activa.
- **CA-2.6.3** **DADO** un juego con metas, **CUANDO** lo elimino, **ENTONCES** sus metas se eliminan con él. (RN-13)

### HU-2.7 · Progreso al día con mis partidas

Como jugador, quiero que el progreso se actualice cuando registro, edito o elimino una partida, para ver siempre mi situación real.

- **CA-2.7.1** **DADO** el detalle de un juego, **CUANDO** registro una partida y vuelvo al detalle, **ENTONCES** el progreso ya la incluye.
- **CA-2.7.2** **DADO** una partida registrada, **CUANDO** edito su fecha, duración o avance, **ENTONCES** el progreso del juego se recalcula.
- **CA-2.7.3** **DADO** una partida en el detalle, **CUANDO** la elimino, **ENTONCES** el progreso se recalcula sin ella.
- **CA-2.7.4** **DADO** que el progreso se está consultando, falla o el juego no tiene meta, **CUANDO** abro el detalle, **ENTONCES** veo un mensaje de carga, un error con opción de reintentar o la invitación a crear una meta, según el caso.

### Revisión INVEST

| Historia | I | N | V | E | S | T | Nota |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HU-2.1 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Solo depende de que exista el juego (E1) |
| HU-2.2 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Requiere una meta creada, pero se prueba por separado |
| HU-2.3 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Se puede entregar sin meta (RN-18) |
| HU-2.4 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Solo necesita partidas |
| HU-2.5 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Usa el avance del resumen de E1 |
| HU-2.6 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Reglas de estado y eliminación, pequeñas y comprobables |
| HU-2.7 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Incluye editar partidas en la interfaz (P-07 del diagnóstico) |

## Tickets

Tipos: **Modelo**, **Dominio**, **API**, **Frontend**, **Diseño**, **Deuda**, **Cierre**. Cada ticket se implementa después de commitear su spec (`docs/specs/`). Los tests de dominio se escriben antes que el código.

#### T-01 · Modelo · Meta con validaciones · HU-2.1

Definition of Done:

- [ ] `Meta` referencia un `Videojuego`; horas > 0 y ≤ 100; días entero 1–7; `activa` por defecto `true`; timestamps.
- [ ] Hitos embebidos: hasta 5, descripción obligatoria y objetivo 1–100.
- [ ] Índice que impide dos metas activas para el mismo juego.
- [ ] Tests de validación del modelo sin base de datos.

Dependencias: ninguna. Estado: pendiente.

#### T-02 · API · Conflicto 409 en el manejo de errores · HU-2.1

Definition of Done:

- [ ] `HttpError` admite 409 y el tipo `CONFLICTO`.
- [ ] Una clave duplicada de MongoDB también responde 409 con un mensaje claro.
- [ ] El `errorHandler` distingue 400, 404, 409 y 500, con test por cada uno.

Dependencias: ninguna. Estado: pendiente.

#### T-03 · Dominio · Funciones puras de semana, días, racha e hitos · HU-2.3, HU-2.4, HU-2.5

Definition of Done:

- [ ] Tests escritos y commiteados **antes** que las funciones.
- [ ] `src/dominio/progreso.ts` no importa Mongoose ni accede a la base de datos.
- [ ] Día y semana en `America/Guayaquil`; racha viva con partida ayer; un día por fecha; partida de medianoche en su día de inicio; porcentaje sin tope; hitos con el avance actual; partidas futuras ignoradas.
- [ ] Al menos un test por cada criterio de la spec verificable sin base de datos.

Dependencias: ninguna. Estado: pendiente.

#### T-04 · API · CRUD de metas · HU-2.1, HU-2.2

Definition of Done:

- [ ] Crear, consultar por id, listar las metas de un juego, actualizar y desactivar.
- [ ] Al crear: 404 si el juego no existe, 409 si ya tiene meta activa o si está completado/abandonado.
- [ ] Una meta desactivada no se edita ni se reactiva (409).
- [ ] Tests de integración por cada operación y error.

Dependencias: T-01, T-02. Estado: pendiente.

#### T-05 · API · Progreso semanal · HU-2.3, HU-2.4, HU-2.5

Definition of Done:

- [ ] `GET /api/videojuegos/:id/progreso-semanal` con la forma de la ficha.
- [ ] El servicio solo consulta y llama al dominio.
- [ ] Sin meta (`meta: null`, `porcentajeHoras: null`), sin partidas (ceros), 400 y 404.
- [ ] Tabla de pruebas con curl: juego sin partidas, juego con 5+ partidas y racha rota, errores 400, 404 y 409.

Dependencias: T-03, T-04. Estado: pendiente.

#### T-06 · API · Ciclo de vida de las metas · HU-2.6

Definition of Done:

- [ ] Eliminar un juego elimina sus metas.
- [ ] Pasar un juego a completado/abandonado desactiva su meta; pausado la conserva.
- [ ] Tests de integración.

Dependencias: T-04. Estado: pendiente.

#### T-07 · Frontend · Servicio `metasApi.ts` y tipos · HU-2.1 a HU-2.5

Definition of Done:

- [ ] `src/api/metasApi.ts` con crear, obtener, listar por juego, actualizar, desactivar y progreso semanal.
- [ ] Tipos `Meta`, `Hito` y `ProgresoSemanal` en `tipos.ts`.
- [ ] Ningún componente llama a `fetch`.

Dependencias: T-04, T-05. Estado: pendiente.

#### T-08 · Frontend · Sección de progreso semanal · HU-2.3, HU-2.4, HU-2.5, HU-2.7

Definition of Done:

- [ ] Barra de horas frente a la meta, días jugados frente a días objetivo, racha actual, mejor racha e hitos con su estado.
- [ ] Estados de carga, error con reintento y vacío (sin meta invita a crear una).
- [ ] Estilos solo con tokens de `tokens.css`.

Dependencias: T-07. Estado: pendiente.

#### T-09 · Frontend · Editar partidas y refrescar el progreso · HU-2.7

Definition of Done:

- [ ] Pantalla para editar una partida (fecha, duración, avance y notas).
- [ ] El progreso se vuelve a consultar al registrar, editar o eliminar una partida.

Dependencias: T-08. Estado: pendiente.

#### T-10 · Frontend · Formulario de meta y desactivación · HU-2.1, HU-2.2

Definition of Done:

- [ ] Formulario para crear y editar la meta con sus hitos (máximo 5), con límites iguales a los de la API.
- [ ] Los rechazos de la API (por ejemplo, meta duplicada) se muestran en lenguaje claro.
- [ ] Desactivar con confirmación en línea que explica la consecuencia.

Dependencias: T-07, T-08. Estado: pendiente.

#### T-11 · Diseño · Revisión contra DESIGN.md · HU-2.3 a HU-2.7

Definition of Done:

- [ ] Tabla de revisión en `docs/revision-diseno.md` con cada desviación encontrada.
- [ ] Desviaciones corregidas en commits propios.

Dependencias: T-08, T-09, T-10. Estado: pendiente.

#### T-12 · Deuda · D-1 Resumen en la capa de dominio

Definition of Done:

- [ ] Test puro de `calcularResumen` antes del cambio.
- [ ] El servicio de resumen y el de progreso usan la misma función pura.
- [ ] Los tests de E1 siguen pasando.

Dependencias: T-03, T-05. Estado: pendiente.

#### T-13 · Deuda · D-2 Rechazar partidas con fecha futura

Definition of Done:

- [ ] Test de integración que falla antes del cambio.
- [ ] La API rechaza partidas a más de 5 minutos en el futuro, al crear y al editar.
- [ ] El formulario del frontend limita la fecha máxima.

Dependencias: ninguna. Estado: pendiente.

#### T-14 · Deuda · D-3 Colores de `styles.css` desde tokens

Definition of Done:

- [ ] Test que falla mientras haya colores literales fuera de `tokens.css`.
- [ ] `styles.css` usa solo variables de `tokens.css`; se eliminan las variables antiguas.
- [ ] Revisión visual de las pantallas de E1.

Dependencias: ninguna. Estado: pendiente.

#### T-15 · Cierre · Auditoría, despliegue y pull request

Definition of Done:

- [ ] `docs/AUDITORIA.md` con una fila por criterio de cada spec.
- [ ] Render actualizado con E2 y verificado con curl.
- [ ] Pull request con los tickets listados y enlace a la auditoría.

Dependencias: T-01 a T-14. Estado: pendiente.

## Orden de ejecución

T-01 → T-02 → T-03 (tests, luego código) → T-04 → T-05 → T-06 → T-07 → T-08 → T-09 → T-10 → T-11 → T-12 → T-13 → T-14 → T-15.

## Deuda técnica

Problemas de [docs/diagnostico.md](../diagnostico.md).

### A pagar en esta épica (ciclo completo: criterio, test, código y verificación)

| Id | Problema | Ticket | Criterio |
| --- | --- | --- | --- |
| D-1 | P-04 · El resumen se calcula mezclado con la consulta y no tiene tests puros | T-12 | CA-D1 en la spec 03 |
| D-2 | P-05 · Las partidas aceptan fechas futuras | T-13 | CA-D2 en la spec 03 |
| D-3 | P-06 · 89 colores literales en `styles.css` | T-14 | CA-D3 en la spec 03 |

### Diferida

| Id | Problema | Motivo para diferirlo |
| --- | --- | --- |
| P-08 | Eliminar un juego borra partidas y metas sin transacción | Una sola persona usa la app y no hay escrituras concurrentes. Las transacciones exigen un replica set también en los tests |
| P-09 | El frontend no tiene tests de componentes | La rúbrica de E2 exige tests de dominio en el backend, y agregar Testing Library y jsdom no cabe en el plazo. Hoy solo se prueban los tokens |
| P-10 | Las pantallas de E1 usan `window.confirm` | Funciona y es accesible por teclado. La E2 ya usa confirmación en línea; migrar E1 sería un rediseño sin pedido del cliente |
| P-11 | Las fechas se capturan y muestran en la zona horaria del dispositivo | Supuesto del PRD: la persona está en Ecuador. Convertir la entrada exige otra regla de producto |
| P-12 | Espaciados, radios y tamaños literales en el CSS de E1 | D-3 migró los colores, que eran el riesgo de inconsistencia. Los espacios de E1 son coherentes entre sí y migrarlos no cambia la experiencia |
| P-13 | Arranque en frío de unos 30 s en Render | Es una limitación del plan gratuito, no del código |

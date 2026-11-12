# PRD · Diario de Progreso Gamer 2.0

Versión 2.0 (11 de noviembre de 2026). Actualiza el producto del Proyecto 3 (épica E1) con la épica **E2 · Metas y rachas**. La fuente del producto es la ficha de hechos del cliente. Lo que no está en la ficha aparece como regla decidida, supuesto o punto abierto. Este documento no contiene detalle técnico.

## 1. Problema

La persona ya registra en el Diario sus videojuegos y sus partidas, y ve cuánto ha jugado y qué tan avanzada va (E1). Pero **no sabe si está jugando lo que se propuso ni si es constante**: juega mucho un fin de semana y luego abandona el juego dos semanas. Hoy no hay nada que le diga «esta semana vas al 70 % de lo que querías» ni «llevas cuatro días seguidos».

## 2. Usuarios

Una sola persona, la misma que registra sus videojuegos y partidas. Juega en Ecuador, desde el computador o el móvil, y revisa su progreso al terminar una sesión. No hay otros usuarios, roles ni metas compartidas.

## 3. Objetivo y métrica de éxito

| Épica | Objetivo | Métrica |
| --- | --- | --- |
| E1 · Biblioteca y partidas (existente) | Responder «¿qué estoy jugando, cuánto le he dedicado y qué tan avanzado voy?» | Cada partida registrada se refleja de inmediato en el resumen del juego |
| E2 · Metas y rachas (nueva) | Responder «¿estoy cumpliendo lo que me propuse esta semana y cuántos días seguidos llevo jugando?» | **En un mes, la persona cumple su meta semanal al menos 3 de 4 semanas** (definición de «cumplir» en RN-14) |

## 4. Alcance

### E1 · Biblioteca y partidas (ya entregado en el Proyecto 3)

- Registrar, consultar, filtrar, editar y eliminar videojuegos con sus logros.
- Marcar logros como obtenidos.
- Registrar y eliminar partidas, y consultar el historial global y por juego.
- Ver el resumen de cada juego: partidas, horas totales, última partida y avance actual.

### E2 · Metas y rachas (nuevo)

- Fijar una meta semanal por videojuego: horas por semana y días por semana.
- Definir una lista corta de hitos de avance dentro de la meta.
- Editar la meta activa y desactivarla con confirmación. Consultar las metas anteriores de un juego.
- Ver en el detalle del juego cómo va la semana actual: horas frente a la meta, días jugados frente a los días objetivo, racha actual, mejor racha e hitos alcanzados.
- Ver el progreso actualizado cada vez que se registra, edita o elimina una partida (incluye poder editar una partida desde la interfaz, que hoy no existe).

## 5. No-alcance

Notificaciones, recordatorios, metas compartidas entre usuarios, rankings, gráficos históricos, cuentas de usuario y metas que abarquen varios videojuegos a la vez.

## 6. Reglas de negocio

### E1 (se mantienen)

- **RN-E1-a.** El avance actual de un juego es el de su partida más reciente, aunque sea menor que uno anterior.
- **RN-E1-b.** Las horas se expresan con un decimal. Un juego sin partidas tiene resumen en cero.
- **RN-E1-c.** Al eliminar un videojuego se eliminan sus partidas.

### E2 · Metas y rachas

Las reglas marcadas con **Hueco N** resuelven los ocho huecos de la ficha. Las marcadas con **Hueco A-N** son huecos adicionales que encontró el agente durante el descubrimiento.

| Id | Regla | Resuelve |
| --- | --- | --- |
| RN-01 | Cada videojuego tiene como máximo **una meta activa**. La meta indica las horas por semana (más de 0 y hasta 100) y los días por semana (número entero de 1 a 7). | Ficha |
| RN-02 | Una meta tiene de 0 a 5 hitos. Cada hito tiene una descripción y un porcentaje objetivo entre 1 y 100. Se muestran de menor a mayor objetivo. | Ficha |
| RN-03 | La semana va de **lunes a domingo, en hora de Ecuador**. El progreso siempre se refiere a la semana en curso. | Ficha |
| RN-04 | Las horas de la semana son la suma de la duración de las partidas de la semana en curso, expresada en horas con un decimal. | Ficha |
| RN-05 | **Meta superada:** el porcentaje de horas se informa con su valor real aunque pase de 100 % (7 h con meta de 5 h = 140 %). La barra se llena hasta el 100 % y se indica «Meta superada». Motivo: esconder el exceso quita información, y para la métrica basta saber que se llegó al 100 %. | **Hueco 5** |
| RN-06 | **Varias partidas el mismo día** cuentan como **un solo día jugado**. Sus duraciones sí se suman a las horas. | **Hueco 2** |
| RN-07 | **Una partida que cruza la medianoche** pertenece al día (y a la semana) en que **empezó**, y toda su duración cuenta en ese día. No se divide entre dos días. Motivo: la partida se registra con su hora de inicio y dividirla complicaría la regla sin beneficio para la persona. | **Hueco 3** |
| RN-08 | La **racha** son los días consecutivos con al menos una partida de ese videojuego, calculados sobre todo su historial. La **mejor racha** es la más larga de ese historial. | Ficha |
| RN-09 | **Racha y día de hoy:** si hoy todavía no hay partida pero ayer sí, la racha **sigue viva** y cuenta hasta ayer: el día aún no termina. Si no hubo partida ni hoy ni ayer, la racha actual es 0. | **Hueco 1** |
| RN-10 | **Cambio de meta a mitad de semana:** el progreso de la semana se calcula con la meta activa **en el momento de consultar**. No se prorratea con la meta anterior. Motivo: la persona quiere saber cómo va frente a lo que se propone ahora, y comparar semanas pasadas está fuera de alcance. | **Hueco 4** |
| RN-11 | **Hito alcanzado:** un hito está alcanzado cuando el avance actual del juego (RN-E1-a) es mayor o igual que su objetivo. El estado no se guarda: si después se registra una partida con menos avance, el hito **vuelve a pendiente**. Motivo: el avance actual es la verdad del juego (por ejemplo, si se reinició la partida) y guardar el estado duplicaría un dato que ya existe en las partidas. | **Hueco 6** |
| RN-12 | **Juego completado o abandonado:** no puede tener meta activa, y crear una se rechaza con un mensaje que explica por qué. Si un juego con meta activa pasa a «completado» o «abandonado», su meta se **desactiva automáticamente** y queda en el historial. Los juegos «jugando» y «pausado» sí pueden tener meta. | **Hueco 7** |
| RN-13 | **Eliminar un videojuego con meta** elimina también todas sus metas (la activa y las anteriores) con sus hitos, igual que se eliminan sus partidas. No quedan metas sin juego. | **Hueco 8** |
| RN-14 | **Cumplir la meta semanal** significa alcanzar en la misma semana las horas **y** los días de la meta. Esta es la definición que usa la métrica de éxito. | Hueco A-1 |
| RN-15 | **Partidas con fecha futura:** no se pueden registrar (con 5 minutos de tolerancia por relojes desfasados) y nunca cuentan para la semana ni para la racha. | Hueco A-2 |
| RN-16 | **Desactivar una meta es definitivo:** una meta desactivada no se reactiva ni se edita, y queda como historial. Para volver a tener objetivo se crea una meta nueva. | Hueco A-3 |
| RN-17 | **Segunda meta activa:** intentar crear otra meta para un juego que ya tiene una activa se rechaza con un mensaje que sugiere editar o desactivar la actual. | Hueco A-4 |
| RN-18 | **Sin meta activa:** el detalle muestra igualmente las horas, los días y las rachas de la semana, sin porcentaje, e invita a crear una meta. | Ficha |
| RN-19 | **Sin partidas:** horas, días y rachas en 0 y ningún hito alcanzado. | Ficha |

## 7. Supuestos

- [SUPUESTO] La persona juega en Ecuador. La fecha de cada partida es su hora de inicio y la ingresa en la hora de su dispositivo.
- [SUPUESTO] «Hoy» se determina con el reloj del servidor convertido a la hora de Ecuador.
- [SUPUESTO] Las horas por semana admiten decimales (por ejemplo, 2,5 h).
- [SUPUESTO] Las metas de un juego eliminado no necesitan recuperarse: no hay papelera.
- [SUPUESTO] Los hitos son de avance porcentual; no reemplazan a los logros de E1, que se siguen marcando a mano.

## 8. Puntos abiertos

- **Medir la métrica de éxito.** Saber si se cumplió la meta «3 de 4 semanas» requiere comparar semanas pasadas, y los gráficos históricos están fuera de alcance. Por ahora el producto muestra si la semana en curso se cumple (RN-14), y la métrica se revisa a mano con el historial de partidas. Una épica futura de historial podría automatizarla.
- **Racha global.** La ficha define la racha por videojuego. Una racha de «días jugando cualquier juego» queda para una iteración futura si la persona la pide.
- **Aviso para juegos pausados con meta.** Un juego pausado puede conservar su meta (RN-12). Queda abierto si conviene avisar que la meta sigue corriendo mientras el juego está en pausa.

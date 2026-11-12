# Revisión de diseño de E2 contra DESIGN.md

Ticket T-11. El agente revisó las pantallas nuevas de E2 contra [DESIGN.md](../DESIGN.md): frontend local contra `npm run demo:e2`, capturas con Playwright a 1280 px y 390 px, y comprobaciones automáticas en la página (scroll horizontal, campos sin etiqueta, texto menor de 12 px y foco inicial de la confirmación). Las capturas «antes» están en [`docs/capturas/e2/`](capturas/e2/).

## Comprobaciones que cumplen

| Regla de DESIGN.md | Evidencia | Resultado |
| --- | --- | --- |
| Colores, espacios y radios solo desde `tokens.css` | Test CA-F.1 en `frontend/tests/tokens.test.mjs` sobre `styles/metas.css` | Cumple |
| Una sola acción primaria por sección | Con meta: «Editar meta» es secundario y «Desactivar meta» es enlace de peligro. Sin meta: el único primario es «Crear meta semanal» | Cumple |
| Los estados no dependen solo del color | Los hitos dicen «Alcanzado» o «Pendiente» y tienen icono; la meta superada dice «Meta superada» | Cumple |
| Barra con `<progress>` y valor en texto | `aria-label="Horas frente a la meta: 70 %"` y el texto «70 %» | Cumple |
| Confirmación en línea en vez de `window.confirm` | `ConfirmacionEnLinea` con `role="alertdialog"`; el foco inicial queda en «Cancelar» (medido: `document.activeElement` = Cancelar) | Cumple |
| Etiqueta visible en cada campo | 0 campos sin `<label>` en las 5 pantallas, a 1280 y 390 px | Cumple |
| Sin scroll horizontal en móvil | `scrollWidth ≤ innerWidth` a 390 px en las 5 pantallas | Cumple |
| Tono: tuteo y sin tecnicismos | «Aún no tienes meta para este juego. Fija una y mide tu semana.», «¿Desactivar tu meta? …» | Cumple |
| Carga, error y vacío | «Calculando tu semana…», `Fallo` con «Volver a intentar», vacío con «Crear meta semanal» | Cumple |

## Desviaciones encontradas

| # | Desviación | Regla incumplida | Dónde | Corrección |
| --- | --- | --- | --- | --- |
| DR-1 | La ceja de la sección de progreso («SEMANA DEL 9 AL 15 DE NOV») mide 9,3 px en móvil y 10,2 px en escritorio, porque hereda `.ceja` de E1 | «Cejas, chips y notas mínimas: `--texto-mini` (0.75rem), mínimo para componentes nuevos» | `ProgresoSemanal.tsx` + `styles.css` | `.progreso-panel .ceja` usa `--texto-mini` |
| DR-2 | Las ayudas del formulario de meta (`.ayuda`) miden 11,8 px | Mismo mínimo de 12 px | `MetaFormulario.tsx` | `.meta-form .ayuda` usa `--texto-mini` |
| DR-3 | El resumen de E1 muestra «8.3 h» con punto mientras el progreso de E2 muestra «3,5 h» con coma, en la misma pantalla | «Horas: un decimal con coma, «3,5 h»» | `VideojuegoDetalle.tsx` | Formato `es-EC` con un decimal en el resumen |
| DR-4 | El formulario de meta lista los hitos en el orden en que se guardaron (100 %, 25 %, 50 %), pero el progreso los muestra de menor a mayor | RN-02 y principio «los números se explican»: el mismo dato no puede aparecer en dos órdenes | `MetaFormulario.tsx` | Los hitos se ordenan por objetivo al cargar el formulario |

Las cuatro desviaciones se corrigen en el commit `fix(E2): T-11 …` y se vuelven a medir abajo.

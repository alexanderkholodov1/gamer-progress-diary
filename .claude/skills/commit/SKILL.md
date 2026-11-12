---
name: commit
description: Crea un commit Conventional Commits en español con lo que está en staging, nombrando el ticket del backlog cuando es implementación. Úsala cuando la persona quiera guardar su trabajo en git.
disable-model-invocation: true
---

# Commit

Sigue estos pasos en orden:

1. Lee los cambios con `git diff --staged --stat` y `git diff --staged`.
2. Si no hay nada en staging, avisa y detente. Nunca hagas `git add` por tu cuenta.
3. Si los cambios incluyen un `.env` (que no sea `.env.example`) o algo que parezca una credencial
   (contraseñas, tokens, cadenas `mongodb+srv://usuario:clave@…`), detente y avisa sin hacer el commit.
4. Si el staging toca código de `backend/src/` o `frontend/src/`, identifica el ticket (T-NN) en
   `docs/backlog/E2-metas-y-rachas.md` y comprueba con `git log --oneline -- docs/specs/` que su spec
   ya está commiteada. Si no lo está, detente y avisa: la spec va antes que el código.
5. Escribe el mensaje como `tipo(ámbito): resumen`, en español y con un máximo de 72 caracteres.
   - Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`.
   - Implementación de la épica: `feat(E2): T-05 endpoint de progreso semanal`.
   - Tests escritos antes del código: `test(E2): T-03 casos de racha y semana`.
   - Deuda técnica: `fix(deuda): D-2 rechazar partidas con fecha futura`.
6. Muestra el mensaje y haz el commit con `git commit -m "<mensaje>"`. Nunca hagas `git push`.

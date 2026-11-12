import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const leer = (ruta) => readFile(new URL(ruta, import.meta.url), "utf8");

function variablesDeTokens(css) {
  return new Map(
    [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, nombre, valor]) => [
      nombre,
      valor.trim().toLowerCase(),
    ]),
  );
}

test("tokens.css define cada color de la tabla de DESIGN.md con el mismo valor", async () => {
  const diseno = await leer("../../DESIGN.md");
  const tokens = variablesDeTokens(await leer("../src/styles/tokens.css"));
  const filas = [
    ...diseno.matchAll(/^\| `(--color-[\w-]+)` \| `(#[0-9a-f]{3,8})` \|/gim),
  ];
  assert.ok(
    filas.length >= 20,
    "DESIGN.md debe documentar la paleta en su tabla de color",
  );
  const diferencias = filas
    .filter(([, nombre, valor]) => tokens.get(nombre) !== valor.toLowerCase())
    .map(
      ([, nombre, valor]) =>
        `${nombre}: DESIGN.md ${valor}, tokens.css ${tokens.get(nombre) ?? "ausente"}`,
    );
  assert.deepEqual(diferencias, []);
});

test("toda variable --color-* que menciona DESIGN.md existe en tokens.css", async () => {
  const diseno = await leer("../../DESIGN.md");
  const tokens = variablesDeTokens(await leer("../src/styles/tokens.css"));
  const mencionadas = new Set(
    [...diseno.matchAll(/`(--color-[a-z-]+)`/g)].map(([, nombre]) => nombre),
  );
  assert.deepEqual(
    [...mencionadas].filter((nombre) => !tokens.has(nombre)),
    [],
  );
});

// Colores literales: hexadecimales, funciones de color y nombres comunes usados como valor.
export function coloresLiterales(css) {
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const patron =
    /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|:\s*[^;{}]*\b(?:white|black)\b/gi;
  return [...sinComentarios.matchAll(patron)].map(([coincidencia]) =>
    coincidencia.trim(),
  );
}

async function variablesInexistentes(css) {
  const tokens = variablesDeTokens(await leer("../src/styles/tokens.css"));
  const usadas = new Set(
    [...css.matchAll(/var\((--[\w-]+)/g)].map(([, nombre]) => nombre),
  );
  return [...usadas].filter((nombre) => !tokens.has(nombre));
}

test("CA-F.1 los estilos de E2 (metas.css) no tienen colores literales", async () => {
  assert.deepEqual(coloresLiterales(await leer("../src/styles/metas.css")), []);
});

test("CA-F.1 cada variable que usa metas.css existe en tokens.css", async () => {
  assert.deepEqual(
    await variablesInexistentes(await leer("../src/styles/metas.css")),
    [],
  );
});

// D-3 · Colores de styles.css desde tokens (spec 03, sección 4).
test("CA-D3.1 styles.css no tiene colores literales", async () => {
  assert.deepEqual(coloresLiterales(await leer("../src/styles.css")), []);
});

test("CA-D3.2 styles.css ya no define ni usa las variables antiguas de E1", async () => {
  const css = await leer("../src/styles.css");
  const antiguas =
    /var\(--(?:primario|primario-oscuro|suave|borde|blanco|radio)\)|^\s*--(?:primario|primario-oscuro|suave|borde|blanco|radio):/gm;
  assert.deepEqual(css.match(antiguas) ?? [], []);
});

test("CA-D3.3 cada variable que usa styles.css existe en tokens.css", async () => {
  assert.deepEqual(
    await variablesInexistentes(await leer("../src/styles.css")),
    [],
  );
});

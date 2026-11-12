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

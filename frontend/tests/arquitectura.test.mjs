import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const src = new URL("../src/", import.meta.url);

async function archivos(carpeta) {
  const entradas = await readdir(new URL(carpeta, src), {
    withFileTypes: true,
    recursive: true,
  });
  return entradas
    .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
    .map((e) => `${e.parentPath ?? e.path}/${e.name}`);
}

test("CA-F.2 ninguna página ni componente llama a fetch: solo los servicios de src/api", async () => {
  const rutas = [
    ...(await archivos("pages/")),
    ...(await archivos("components/")),
  ];
  const conFetch = [];
  for (const ruta of rutas) {
    if (/\bfetch\s*\(/.test(await readFile(ruta, "utf8"))) conFetch.push(ruta);
  }
  assert.deepEqual(conFetch, []);
});

test("T-07 metasApi expone las operaciones de la spec 02", async () => {
  const servicio = await readFile(new URL("api/metasApi.ts", src), "utf8");
  for (const operacion of [
    "crear",
    "obtener",
    "listarDeVideojuego",
    "actualizar",
    "desactivar",
    "progresoSemanal",
  ]) {
    assert.ok(servicio.includes(`  ${operacion}: `), `falta ${operacion}`);
  }
});

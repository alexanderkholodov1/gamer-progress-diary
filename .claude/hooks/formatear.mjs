// Hook PostToolUse: formatea con Prettier cada archivo de código que el agente crea o edita.
// Respeta .prettierrc y .prettierignore. Nunca bloquea: ante cualquier fallo termina con código 0.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const EXTENSIONES = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
]);

async function formatear(archivo) {
  const prettier = await import("prettier");
  const raiz = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const info = await prettier.getFileInfo(archivo, {
    ignorePath: path.join(raiz, ".prettierignore"),
  });
  if (info.ignored || !info.inferredParser) return;
  const original = await readFile(archivo, "utf8");
  const opciones = (await prettier.resolveConfig(archivo)) ?? {};
  const formateado = await prettier.format(original, {
    ...opciones,
    filepath: archivo,
  });
  if (formateado !== original) await writeFile(archivo, formateado);
}

let entrada = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (trozo) => {
  entrada += trozo;
});
process.stdin.on("end", async () => {
  try {
    const archivo = JSON.parse(entrada)?.tool_input?.file_path;
    if (archivo && EXTENSIONES.has(path.extname(archivo).toLowerCase())) {
      await formatear(archivo);
    }
  } catch {
    // Un fallo de formato no debe interrumpir al agente.
  }
  process.exit(0);
});

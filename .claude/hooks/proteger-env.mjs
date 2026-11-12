// Hook PreToolUse: impide que el agente lea, edite o cree archivos .env.
// Los .env.example sí se permiten porque no contienen secretos.
// Código de salida 2 = bloquear la herramienta; el mensaje de stderr le llega a Claude.

const ARCHIVO_ENV = /(^|[\\/])\.env(\.(?!example\b)[\w.-]+)?$/i;
const MENCION_ENV =
  /(^|[\s"'=\\/<>|;&(])\.env(?!\.example\b)(\.[\w-]+)?(?=$|[\s"'\\/<>|;&)])/i;

function rutaProhibida(ruta) {
  return typeof ruta === "string" && ARCHIVO_ENV.test(ruta.trim());
}

let entrada = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (trozo) => {
  entrada += trozo;
});
process.stdin.on("end", () => {
  let evento;
  try {
    evento = JSON.parse(entrada);
  } catch {
    process.exit(0);
  }
  const herramienta = evento?.tool_name ?? "";
  const datos = evento?.tool_input ?? {};
  const bloqueado =
    rutaProhibida(datos.file_path) ||
    rutaProhibida(datos.path) ||
    (herramienta === "Bash" && MENCION_ENV.test(datos.command ?? ""));
  if (bloqueado) {
    process.stderr.write(
      "Bloqueado por el harness: AGENTS.md prohíbe leer o modificar .env. " +
        "Usa .env.example para documentar variables y pide a la persona que configure sus valores.\n",
    );
    process.exit(2);
  }
  process.exit(0);
});

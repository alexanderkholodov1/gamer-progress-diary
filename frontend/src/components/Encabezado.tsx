import type { ReactNode } from "react";

export function Encabezado({
  etiqueta,
  titulo,
  texto,
  accion,
}: {
  etiqueta: string;
  titulo: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <header className="encabezado">
      <div>
        <p className="ceja">{etiqueta}</p>
        <h1>{titulo}</h1>
        <p className="subtitulo">{texto}</p>
      </div>
      {accion && <div className="acciones">{accion}</div>}
    </header>
  );
}

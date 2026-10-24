import type { ReactNode } from "react";

export function Cargando({
  texto = "Cargando tu diario…",
}: {
  texto?: string;
}) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}
export function Fallo({
  mensaje,
  reintentar,
}: {
  mensaje: string;
  reintentar?: () => void;
}) {
  return (
    <div className="aviso aviso-error" role="alert">
      <strong>No pudimos completar la solicitud</strong>
      <p>{mensaje}</p>
      {reintentar && (
        <button className="boton secundario" type="button" onClick={reintentar}>
          Volver a intentar
        </button>
      )}
    </div>
  );
}
export function Vacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <div className="vacio">
      <span className="vacio-icono" aria-hidden="true">
        ◇
      </span>
      <h2>{titulo}</h2>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

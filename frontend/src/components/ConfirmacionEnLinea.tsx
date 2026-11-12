import { useEffect, useId, useRef } from "react";

// Confirmación destructiva dentro de la página (DESIGN.md: reemplaza a window.confirm en pantallas nuevas).
export function ConfirmacionEnLinea({
  pregunta,
  detalle,
  textoConfirmar,
  ocupado,
  onConfirmar,
  onCancelar,
}: {
  pregunta: string;
  detalle: string;
  textoConfirmar: string;
  ocupado: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const id = useId();
  const cancelar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // El foco va a la opción segura para que Enter no confirme por accidente.
    cancelar.current?.focus();
  }, []);
  return (
    <div
      className="confirmacion"
      role="alertdialog"
      aria-labelledby={`${id}-pregunta`}
      aria-describedby={`${id}-detalle`}
    >
      <p id={`${id}-pregunta`} className="confirmacion-pregunta">
        {pregunta}
      </p>
      <p id={`${id}-detalle`}>{detalle}</p>
      <div className="confirmacion-acciones">
        <button
          ref={cancelar}
          type="button"
          className="boton secundario"
          disabled={ocupado}
          onClick={onCancelar}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="boton boton-peligro"
          disabled={ocupado}
          onClick={onConfirmar}
        >
          {ocupado ? "Desactivando…" : textoConfirmar}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState, type DependencyList } from "react";
import { ErrorApi } from "../api/cliente";

export function mensajeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error. Inténtalo de nuevo.";
}

export function useCarga<T>(
  cargar: () => Promise<T>,
  dependencias: DependencyList,
) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    setNoEncontrado(false);
    setDatos(null);
    cargar()
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((fallo) => {
        if (vigente) {
          setNoEncontrado(fallo instanceof ErrorApi && fallo.status === 404);
          setError(mensajeError(fallo));
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // Cada pantalla declara los valores de los que depende su consulta.
  }, [...dependencias, revision]);
  return {
    datos,
    setDatos,
    cargando,
    error,
    noEncontrado,
    recargar: () => setRevision((valor) => valor + 1),
  };
}

const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export class ErrorApi extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId?: string,
  ) {
    super(message);
  }
}

export async function solicitar<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  if (!baseUrl)
    throw new Error(
      "No se pudo conectar con el diario. Revisa la configuración del servicio.",
    );
  let respuesta: Response;
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, {
      ...opciones,
      headers: {
        Accept: "application/json",
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el diario. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    const error = cuerpo?.error;
    const detalles = Array.isArray(error?.detalles)
      ? ` ${error.detalles.join(" ")}`
      : "";
    throw new ErrorApi(
      (error?.mensaje ?? "No se pudo completar la solicitud.") + detalles,
      respuesta.status,
      error?.requestId,
    );
  }
  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}

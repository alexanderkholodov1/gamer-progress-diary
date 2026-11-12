// D-1 · Resumen de E1 como función pura (spec 03). Mismas fórmulas que el README del Proyecto 3.

export interface PartidaParaResumen {
  fecha: Date | string;
  duracionMinutos: number;
  porcentajeAvance: number;
  createdAt?: Date | string;
  _id?: { toString(): string } | string;
}

export interface Resumen {
  totalPartidas: number;
  horasTotales: number;
  ultimaPartida: Date | null;
  porcentajeAvanceActual: number;
}

const tiempo = (valor?: Date | string) => (valor ? new Date(valor).getTime() : 0);

/** Orden de E1: fecha descendente, luego createdAt descendente y luego _id descendente. */
export function masRecientePrimero(a: PartidaParaResumen, b: PartidaParaResumen): number {
  return (
    tiempo(b.fecha) - tiempo(a.fecha) ||
    tiempo(b.createdAt) - tiempo(a.createdAt) ||
    String(b._id ?? '').localeCompare(String(a._id ?? ''))
  );
}

export function calcularResumen(partidas: PartidaParaResumen[]): Resumen {
  const minutos = partidas.reduce((total, partida) => total + partida.duracionMinutos, 0);
  const ultima = [...partidas].sort(masRecientePrimero)[0];
  return {
    totalPartidas: partidas.length,
    horasTotales: Math.round((minutos / 60) * 10) / 10,
    ultimaPartida: ultima ? new Date(ultima.fecha) : null,
    // El avance actual es el de la partida más reciente, aunque sea menor que uno anterior (RN-E1-a).
    porcentajeAvanceActual: ultima?.porcentajeAvance ?? 0,
  };
}

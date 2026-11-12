export const plataformas = [
  "PC",
  "PlayStation",
  "Xbox",
  "Switch",
  "Movil",
] as const;
export const generos = [
  "accion",
  "rol",
  "estrategia",
  "puzzle",
  "deportes",
  "otro",
] as const;
export const estados = [
  "jugando",
  "pausado",
  "completado",
  "abandonado",
] as const;
export type Plataforma = (typeof plataformas)[number];
export type Genero = (typeof generos)[number];
export type Estado = (typeof estados)[number];
export const etiquetas: Record<string, string> = {
  PC: "PC",
  PlayStation: "PlayStation",
  Xbox: "Xbox",
  Switch: "Switch",
  Movil: "Móvil",
  accion: "Acción",
  rol: "Rol",
  estrategia: "Estrategia",
  puzzle: "Puzzle",
  deportes: "Deportes",
  otro: "Otro",
  jugando: "Jugando",
  pausado: "Pausado",
  completado: "Completado",
  abandonado: "Abandonado",
};
export interface LogroEntrada {
  _id?: string;
  nombre: string;
  obtenido: boolean;
}
export interface Logro extends LogroEntrada {
  _id: string;
}
export interface VideojuegoEntrada {
  nombre: string;
  plataforma: Plataforma;
  genero: Genero;
  estado: Estado;
  logros: LogroEntrada[];
}
export interface Videojuego extends VideojuegoEntrada {
  _id: string;
  logros: Logro[];
  createdAt: string;
  updatedAt: string;
}
export interface PartidaEntrada {
  videojuego: string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
}
export interface Partida extends Omit<PartidaEntrada, "videojuego"> {
  _id: string;
  videojuego: Videojuego | string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Resumen {
  totalPartidas: number;
  horasTotales: number;
  ultimaPartida: string | null;
  porcentajeAvanceActual: number;
}
export interface Filtros {
  nombre?: string;
  plataforma?: string;
  genero?: string;
  estado?: string;
}

// Épica E2 · Metas y rachas (spec 02). Mismos nombres de campo que la API.
export interface HitoEntrada {
  _id?: string;
  descripcion: string;
  porcentajeObjetivo: number;
}
export interface Hito extends HitoEntrada {
  _id: string;
}
export interface MetaEntrada {
  videojuego: string;
  horasSemanales: number;
  diasPorSemana: number;
  hitos: HitoEntrada[];
}
export type MetaCambios = Partial<Omit<MetaEntrada, "videojuego">>;
export interface Meta extends Omit<MetaEntrada, "hitos"> {
  _id: string;
  activa: boolean;
  hitos: Hito[];
  createdAt: string;
  updatedAt: string;
}
export interface HitoEvaluado {
  descripcion: string;
  porcentajeObjetivo: number;
  alcanzado: boolean;
}
export interface ProgresoSemanal {
  semana: { inicio: string; fin: string };
  meta: { horasSemanales: number; diasPorSemana: number } | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  metaCumplida: boolean | null;
  rachaActual: number;
  mejorRacha: number;
  hitos: HitoEvaluado[];
}

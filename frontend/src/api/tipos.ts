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

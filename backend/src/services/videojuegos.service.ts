import { Videojuego } from '../models/Videojuego';
import { Partida } from '../models/Partida';
import { HttpError } from '../errors';
import { camposPermitidos, validarId } from './helpers';

const campos = ['nombre', 'plataforma', 'genero', 'estado', 'logros'] as const;
export interface Filtros { nombre?: string; plataforma?: string; genero?: string; estado?: string }

export async function listar(filtros: Filtros = {}) {
  const consulta: Record<string, unknown> = {};
  for (const campo of ['plataforma', 'genero', 'estado'] as const) {
    if (filtros[campo]) consulta[campo] = filtros[campo];
  }
  if (filtros.nombre) {
    // El nombre se interpreta como texto literal, no como una expresión regular del cliente.
    const literal = filtros.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    consulta.nombre = { $regex: literal, $options: 'i' };
  }
  return Videojuego.find(consulta).sort({ createdAt: -1, _id: -1 });
}

export async function obtener(id: string) {
  validarId(id);
  const juego = await Videojuego.findById(id);
  if (!juego) throw new HttpError(404, 'No se encontró el videojuego.', 'NO_ENCONTRADO');
  return juego;
}

export async function crear(datos: unknown) {
  return Videojuego.create(camposPermitidos(datos, campos));
}

export async function actualizar(id: string, datos: unknown) {
  const juego = await obtener(id);
  juego.set(camposPermitidos(datos, campos));
  return juego.save();
}

export async function eliminar(id: string) {
  const juego = await obtener(id);
  // Se eliminan sus sesiones para no dejar referencias huérfanas.
  await Partida.deleteMany({ videojuego: juego._id });
  await juego.deleteOne();
}

export async function actualizarLogro(id: string, logroId: string, datos: unknown) {
  validarId(logroId, 'logros._id');
  const juego = await obtener(id);
  const logro = juego.logros.id(logroId);
  if (!logro) throw new HttpError(404, 'No se encontró el logro en este videojuego.', 'NO_ENCONTRADO');
  const { obtenido } = camposPermitidos(datos, ['obtenido']);
  if (typeof obtenido !== 'boolean') {
    throw new HttpError(400, 'El campo obtenido debe ser verdadero o falso.', 'VALIDACION');
  }
  logro.obtenido = obtenido;
  return juego.save();
}

export async function listarPartidas(id: string) {
  await obtener(id);
  return Partida.find({ videojuego: id }).sort({ fecha: -1, createdAt: -1, _id: -1 });
}

export async function resumen(id: string) {
  const partidas = await listarPartidas(id);
  const minutos = partidas.reduce((total, partida) => total + partida.duracionMinutos, 0);
  const ultima = partidas[0];
  return {
    totalPartidas: partidas.length,
    horasTotales: Math.round((minutos / 60) * 10) / 10,
    ultimaPartida: ultima?.fecha ?? null,
    porcentajeAvanceActual: ultima?.porcentajeAvance ?? 0,
  };
}

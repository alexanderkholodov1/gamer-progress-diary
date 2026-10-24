import { Partida } from '../models/Partida';
import { HttpError } from '../errors';
import { obtener as obtenerVideojuego } from './videojuegos.service';
import { camposPermitidos, validarId } from './helpers';

const campos = ['videojuego', 'fecha', 'duracionMinutos', 'porcentajeAvance', 'notas'] as const;

export async function listar() {
  return Partida.find().populate('videojuego').sort({ fecha: -1, createdAt: -1, _id: -1 });
}

export async function obtener(id: string) {
  validarId(id);
  const partida = await Partida.findById(id).populate('videojuego');
  if (!partida) throw new HttpError(404, 'No se encontró la partida.', 'NO_ENCONTRADO');
  return partida;
}

export async function crear(datos: unknown) {
  const partida = new Partida(camposPermitidos(datos, campos));
  await partida.validate();
  await obtenerVideojuego(partida.videojuego.toString());
  return partida.save();
}

export async function actualizar(id: string, datos: unknown) {
  validarId(id);
  const partida = await Partida.findById(id);
  if (!partida) throw new HttpError(404, 'No se encontró la partida.', 'NO_ENCONTRADO');
  partida.set(camposPermitidos(datos, campos));
  await partida.validate();
  await obtenerVideojuego(partida.videojuego.toString());
  return partida.save();
}

export async function eliminar(id: string) {
  validarId(id);
  const partida = await Partida.findByIdAndDelete(id);
  if (!partida) throw new HttpError(404, 'No se encontró la partida.', 'NO_ENCONTRADO');
}

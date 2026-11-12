import { Meta } from '../models/Meta';
import { HttpError } from '../errors';
import { obtener as obtenerVideojuego } from './videojuegos.service';
import { camposPermitidos, validarId } from './helpers';

const camposCrear = ['videojuego', 'horasSemanales', 'diasPorSemana', 'hitos'] as const;
// `videojuego` y `activa` no se editan: una meta no cambia de juego y desactivar es definitivo (RN-16).
const camposEditar = ['horasSemanales', 'diasPorSemana', 'hitos'] as const;
export const ESTADOS_SIN_META = ['completado', 'abandonado'] as const;

export const MENSAJE_META_DUPLICADA =
  'Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.';

export async function crear(datos: unknown) {
  const meta = new Meta({ ...camposPermitidos(datos, camposCrear), activa: true });
  await meta.validate();
  const juego = await obtenerVideojuego(meta.videojuego.toString());
  if ((ESTADOS_SIN_META as readonly string[]).includes(juego.estado)) {
    throw new HttpError(
      409,
      `Un videojuego ${juego.estado} no puede tener una meta activa. Cámbialo a «jugando» o «pausado» primero.`,
      'CONFLICTO',
    );
  }
  if (await Meta.exists({ videojuego: juego._id, activa: true })) {
    throw new HttpError(409, MENSAJE_META_DUPLICADA, 'CONFLICTO');
  }
  // Si dos solicitudes llegan a la vez, el índice único parcial responde 409 desde el errorHandler.
  return meta.save();
}

export async function obtener(id: string) {
  validarId(id);
  const meta = await Meta.findById(id);
  if (!meta) throw new HttpError(404, 'No se encontró la meta.', 'NO_ENCONTRADO');
  return meta;
}

export async function listarDeVideojuego(videojuegoId: string, activa?: unknown) {
  const juego = await obtenerVideojuego(videojuegoId);
  const filtro: Record<string, unknown> = { videojuego: juego._id };
  if (activa !== undefined) {
    if (activa !== 'true' && activa !== 'false') {
      throw new HttpError(400, 'El filtro activa debe ser true o false.', 'VALIDACION');
    }
    filtro.activa = activa === 'true';
  }
  return Meta.find(filtro).sort({ createdAt: -1, _id: -1 });
}

export async function actualizar(id: string, datos: unknown) {
  const meta = await obtener(id);
  if (!meta.activa) {
    throw new HttpError(
      409,
      'Esta meta está desactivada y ya no se puede editar. Crea una meta nueva.',
      'CONFLICTO',
    );
  }
  meta.set(camposPermitidos(datos, camposEditar));
  return meta.save();
}

export async function desactivar(id: string) {
  const meta = await obtener(id);
  if (!meta.activa) throw new HttpError(409, 'Esta meta ya estaba desactivada.', 'CONFLICTO');
  meta.activa = false;
  return meta.save();
}

import { Error as MongooseError, isObjectIdOrHexString } from 'mongoose';
import { HttpError } from '../errors';

export function validarId(id: unknown, campo = '_id'): asserts id is string {
  if (typeof id !== 'string' || !isObjectIdOrHexString(id)) {
    throw new MongooseError.CastError('ObjectId', id, campo);
  }
}

export function camposPermitidos(entrada: unknown, campos: readonly string[]): Record<string, unknown> {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new HttpError(400, 'Envía un objeto JSON con los datos del formulario.', 'VALIDACION');
  }
  return Object.fromEntries(Object.entries(entrada).filter(([clave]) => campos.includes(clave)));
}

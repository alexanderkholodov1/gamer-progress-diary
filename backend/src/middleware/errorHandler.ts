import type { ErrorRequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { HttpError, type TipoError } from '../errors';

const etiquetas: Record<string, string> = {
  nombre: 'nombre', plataforma: 'plataforma', genero: 'género', estado: 'estado',
  videojuego: 'videojuego', fecha: 'fecha', duracionMinutos: 'duración en minutos',
  porcentajeAvance: 'porcentaje de avance', obtenido: 'obtenido',
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  let status = 500;
  let tipo: TipoError = 'INTERNO';
  let mensaje = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  let detalles: string[] | undefined;
  if (err instanceof HttpError) {
    status = err.status; tipo = err.tipo; mensaje = err.message;
  } else if (err instanceof MongooseError.CastError) {
    status = 400; tipo = 'ID_MALFORMADO'; mensaje = 'El identificador o valor enviado tiene un formato inválido.';
  } else if (err instanceof MongooseError.ValidationError) {
    const errores = Object.values(err.errors);
    const cast = errores.some(error => error instanceof MongooseError.CastError);
    status = 400; tipo = cast ? 'ID_MALFORMADO' : 'VALIDACION';
    mensaje = cast ? 'Uno de los valores tiene un formato inválido.' : 'Revisa los datos del formulario.';
    detalles = errores.map(error => {
      const campo = etiquetas[error.path.split('.').at(-1) ?? ''] ?? error.path;
      return `El campo «${campo}» es obligatorio o tiene un valor inválido.`;
    });
  } else if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    status = 400; tipo = 'VALIDACION'; mensaje = 'El cuerpo de la solicitud debe ser JSON válido.';
  } else if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    status = 400; tipo = 'VALIDACION'; mensaje = 'La solicitud supera el tamaño permitido.';
  }
  if (status === 500) console.error(JSON.stringify({ evento: 'error_interno', requestId: res.locals.requestId }));
  res.status(status).json({ error: { tipo, mensaje, ...(detalles ? { detalles } : {}), requestId: res.locals.requestId } });
};

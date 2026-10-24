import type { RequestHandler } from 'express';

export const logger: RequestHandler = (req, res, next) => {
  const inicio = performance.now();
  const ruta = req.originalUrl.split('?')[0];
  res.on('finish', () => console.info(JSON.stringify({
    evento: 'solicitud', requestId: res.locals.requestId,
    metodo: req.method, ruta, estado: res.statusCode,
    duracionMs: Math.round(performance.now() - inicio),
  })));
  next();
};

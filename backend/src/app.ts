import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { videojuegosRouter } from './routes/videojuegos.routes';
import { partidasRouter } from './routes/partidas.routes';
import { HttpError } from './errors';

export const app = express();
app.disable('x-powered-by');
app.use(requestId, logger);
app.use(cors({ origin: env.FRONTEND_URL, exposedHeaders: ['X-Request-Id'] }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => {
  const conectado = mongoose.connection.readyState === 1;
  res.status(conectado ? 200 : 503).json({ estado: conectado ? 'disponible' : 'sin conexión' });
});
app.use('/api/videojuegos', videojuegosRouter);
app.use('/api/partidas', partidasRouter);
app.use((_req, _res, next) => next(new HttpError(404, 'No se encontró la ruta solicitada.', 'NO_ENCONTRADO')));
app.use(errorHandler);

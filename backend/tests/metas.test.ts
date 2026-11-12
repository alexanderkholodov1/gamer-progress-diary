import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Error as MongooseError } from 'mongoose';
import { errorHandler } from '../src/middleware/errorHandler';
import { requestId } from '../src/middleware/requestId';
import { HttpError } from '../src/errors';

// T-02 · El errorHandler distingue 400, 404, 409 y 500 (spec 01, sección «Errores»).
describe('T-02 · errorHandler con 400, 404, 409 y 500', () => {
  const appCon = (error: unknown) => {
    const app = express();
    app.use(requestId);
    app.get('/', () => {
      throw error;
    });
    app.use(errorHandler);
    return app;
  };
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [new HttpError(400, 'Dato inválido.', 'VALIDACION'), 400, 'VALIDACION'],
    [new MongooseError.CastError('ObjectId', 'x', '_id'), 400, 'ID_MALFORMADO'],
    [new HttpError(404, 'No existe.', 'NO_ENCONTRADO'), 404, 'NO_ENCONTRADO'],
    [new HttpError(409, 'Ya hay una meta activa.', 'CONFLICTO'), 409, 'CONFLICTO'],
    [Object.assign(new Error('E11000 duplicate key'), { code: 11000 }), 409, 'CONFLICTO'],
    [new Error('detalle privado'), 500, 'INTERNO'],
  ])('%s → %i %s', async (error, status, tipo) => {
    const respuesta = await request(appCon(error)).get('/');
    expect(respuesta.status).toBe(status);
    expect(respuesta.body.error.tipo).toBe(tipo);
    expect(respuesta.body.error.requestId).toBe(respuesta.headers['x-request-id']);
    expect(JSON.stringify(respuesta.body)).not.toContain('detalle privado');
    expect(JSON.stringify(respuesta.body)).not.toContain('E11000');
  });

  it('la clave duplicada responde con un mensaje claro para la persona', async () => {
    const respuesta = await request(appCon(Object.assign(new Error('E11000'), { code: 11000 }))).get('/');
    expect(respuesta.body.error.mensaje).toMatch(/ya tiene una meta activa/);
  });
});

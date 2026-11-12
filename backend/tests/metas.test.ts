import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import mongoose, { Error as MongooseError } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import { errorHandler } from '../src/middleware/errorHandler';
import { requestId } from '../src/middleware/requestId';
import { HttpError } from '../src/errors';
import { Meta } from '../src/models/Meta';
import { Partida } from '../src/models/Partida';
import { Videojuego } from '../src/models/Videojuego';

let memoria: MongoMemoryServer;
const idAusente = new mongoose.Types.ObjectId().toString();
const ficha = { nombre: 'Hades', plataforma: 'PC', genero: 'accion', estado: 'jugando', logros: [] };
const hitos = [
  { descripcion: 'Terminar el juego', porcentajeObjetivo: 100 },
  { descripcion: 'Llegar al 25 %', porcentajeObjetivo: 25 },
];
const crearJuego = async (extra = {}) =>
  (
    await request(app)
      .post('/api/videojuegos')
      .send({ ...ficha, ...extra })
      .expect(201)
  ).body;
const metaPara = (videojuego: string, extra = {}) => ({
  videojuego,
  horasSemanales: 5,
  diasPorSemana: 4,
  hitos,
  ...extra,
});
const crearMeta = async (videojuego: string, extra = {}) =>
  (await request(app).post('/api/metas').send(metaPara(videojuego, extra)).expect(201)).body;
const errorTipo = (respuesta: request.Response, status: number, tipo: string) => {
  expect(respuesta.status).toBe(status);
  expect(respuesta.body.error.tipo).toBe(tipo);
  expect(respuesta.body.error.mensaje).toBeTypeOf('string');
};

beforeAll(async () => {
  memoria = await MongoMemoryServer.create();
  await mongoose.connect(memoria.getUri());
  await Meta.init(); // garantiza el índice único parcial antes de las pruebas de concurrencia
});
beforeEach(async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await Promise.all([Videojuego.deleteMany({}), Partida.deleteMany({}), Meta.deleteMany({})]);
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await mongoose.disconnect();
  await memoria?.stop();
});

// T-02 · El errorHandler distingue 400, 404, 409 y 500 (spec 01, sección «Errores»).
describe('T-02 · errorHandler con 400, 404, 409 y 500', () => {
  const appCon = (error: unknown) => {
    const mini = express();
    mini.use(requestId);
    mini.get('/', () => {
      throw error;
    });
    mini.use(errorHandler);
    return mini;
  };

  it.each([
    [new HttpError(400, 'Dato inválido.', 'VALIDACION'), 400, 'VALIDACION'],
    [new MongooseError.CastError('ObjectId', 'x', '_id'), 400, 'ID_MALFORMADO'],
    [new HttpError(404, 'No existe.', 'NO_ENCONTRADO'), 404, 'NO_ENCONTRADO'],
    [new HttpError(409, 'Ya hay una meta activa.', 'CONFLICTO'), 409, 'CONFLICTO'],
    [Object.assign(new Error('E11000 duplicate key'), { code: 11000 }), 409, 'CONFLICTO'],
    [new Error('detalle privado'), 500, 'INTERNO'],
  ])('%s → %i %s', async (error, status, tipo) => {
    const respuesta = await request(appCon(error)).get('/');
    errorTipo(respuesta, status, tipo);
    expect(respuesta.body.error.requestId).toBe(respuesta.headers['x-request-id']);
    expect(JSON.stringify(respuesta.body)).not.toContain('detalle privado');
    expect(JSON.stringify(respuesta.body)).not.toContain('E11000');
  });

  it('la clave duplicada responde con un mensaje claro para la persona', async () => {
    const respuesta = await request(appCon(Object.assign(new Error('E11000'), { code: 11000 }))).get('/');
    expect(respuesta.body.error.mensaje).toMatch(/ya tiene una meta activa/);
  });
});

describe('T-04 · CRUD de metas (HU-2.1, HU-2.2)', () => {
  it('CA-2.1.1 crea una meta activa con timestamps e hitos embebidos', async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego._id, { activa: false });
    expect(meta).toMatchObject({ videojuego: juego._id, horasSemanales: 5, diasPorSemana: 4, activa: true });
    expect(meta.hitos).toHaveLength(2);
    expect(meta.createdAt).toBeTruthy();
    expect((await request(app).get(`/api/metas/${meta._id}`).expect(200)).body._id).toBe(meta._id);
  });

  it('CA-2.1.1 un juego pausado también admite meta', async () => {
    const juego = await crearJuego({ estado: 'pausado' });
    await crearMeta(juego._id);
  });

  it.each([
    { horasSemanales: 0 },
    { horasSemanales: 101 },
    { diasPorSemana: 0 },
    { diasPorSemana: 8 },
    { diasPorSemana: 2.5 },
    { horasSemanales: undefined },
  ])('CA-2.1.2 rechaza horas o días fuera de rango: %o → 400', async (extra) => {
    const juego = await crearJuego();
    errorTipo(await request(app).post('/api/metas').send(metaPara(juego._id, extra)), 400, 'VALIDACION');
    expect(await Meta.countDocuments()).toBe(0);
  });

  it.each([
    { hitos: Array.from({ length: 6 }, (_, i) => ({ descripcion: `H${i}`, porcentajeObjetivo: 10 + i })) },
    { hitos: [{ descripcion: '', porcentajeObjetivo: 50 }] },
    { hitos: [{ descripcion: 'Fuera', porcentajeObjetivo: 120 }] },
  ])('CA-2.1.3 rechaza hitos inválidos → 400', async (extra) => {
    const juego = await crearJuego();
    errorTipo(await request(app).post('/api/metas').send(metaPara(juego._id, extra)), 400, 'VALIDACION');
  });

  it('CA-2.1.4 una segunda meta activa para el mismo juego → 409 con mensaje claro', async () => {
    const juego = await crearJuego();
    await crearMeta(juego._id);
    const respuesta = await request(app).post('/api/metas').send(metaPara(juego._id));
    errorTipo(respuesta, 409, 'CONFLICTO');
    expect(respuesta.body.error.mensaje).toMatch(/ya tiene una meta activa/);
    expect(await Meta.countDocuments({ videojuego: juego._id, activa: true })).toBe(1);
  });

  it('CA-2.1.4 dos solicitudes simultáneas dejan una sola meta activa (índice único parcial)', async () => {
    const juego = await crearJuego();
    const respuestas = await Promise.all(
      Array.from({ length: 4 }, () => request(app).post('/api/metas').send(metaPara(juego._id))),
    );
    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(3);
    expect(await Meta.countDocuments({ videojuego: juego._id, activa: true })).toBe(1);
  });

  it.each(['completado', 'abandonado'])('CA-2.1.5 un juego %s no admite meta → 409', async (estado) => {
    const juego = await crearJuego({ estado });
    const respuesta = await request(app).post('/api/metas').send(metaPara(juego._id));
    errorTipo(respuesta, 409, 'CONFLICTO');
    expect(respuesta.body.error.mensaje).toContain(estado);
  });

  it('CA-2.1.6 juego inexistente → 404 y id malformado → 400', async () => {
    errorTipo(await request(app).post('/api/metas').send(metaPara(idAusente)), 404, 'NO_ENCONTRADO');
    errorTipo(await request(app).post('/api/metas').send(metaPara('no-id')), 400, 'ID_MALFORMADO');
    expect(await Meta.countDocuments()).toBe(0);
  });

  it('CA-2.2.1 actualiza horas, días e hitos de la meta activa y revalida', async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego._id);
    const nueva = (
      await request(app)
        .patch(`/api/metas/${meta._id}`)
        .send({
          horasSemanales: 8,
          hitos: [{ descripcion: 'Mitad', porcentajeObjetivo: 50 }],
          videojuego: idAusente,
        })
        .expect(200)
    ).body;
    expect(nueva).toMatchObject({ horasSemanales: 8, diasPorSemana: 4, videojuego: juego._id });
    expect(nueva.hitos).toHaveLength(1);
    expect(
      (await request(app).put(`/api/metas/${meta._id}`).send({ diasPorSemana: 6 }).expect(200)).body
        .diasPorSemana,
    ).toBe(6);
    errorTipo(
      await request(app).patch(`/api/metas/${meta._id}`).send({ diasPorSemana: 9 }),
      400,
      'VALIDACION',
    );
  });

  it('CA-2.2.2 desactivar deja al juego sin meta activa y permite crear una nueva', async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego._id);
    expect((await request(app).patch(`/api/metas/${meta._id}/desactivar`).expect(200)).body.activa).toBe(
      false,
    );
    expect(
      (await request(app).get(`/api/videojuegos/${juego._id}/metas?activa=true`).expect(200)).body,
    ).toEqual([]);
    await crearMeta(juego._id);
  });

  it('CA-2.2.3 una meta desactivada no se edita, no se reactiva ni se vuelve a desactivar → 409', async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego._id);
    await request(app).patch(`/api/metas/${meta._id}/desactivar`).expect(200);
    errorTipo(
      await request(app).patch(`/api/metas/${meta._id}`).send({ horasSemanales: 3 }),
      409,
      'CONFLICTO',
    );
    errorTipo(await request(app).patch(`/api/metas/${meta._id}`).send({ activa: true }), 409, 'CONFLICTO');
    errorTipo(await request(app).patch(`/api/metas/${meta._id}/desactivar`), 409, 'CONFLICTO');
    expect((await request(app).get(`/api/metas/${meta._id}`).expect(200)).body.activa).toBe(false);
  });

  it('CA-2.2.4 lista las metas del juego de la más reciente a la más antigua, con filtro', async () => {
    const juego = await crearJuego();
    const primera = await crearMeta(juego._id, { horasSemanales: 3 });
    await request(app).patch(`/api/metas/${primera._id}/desactivar`).expect(200);
    const segunda = await crearMeta(juego._id, { horasSemanales: 6 });
    const lista = (await request(app).get(`/api/videojuegos/${juego._id}/metas`).expect(200)).body;
    expect(lista.map((m: { _id: string }) => m._id)).toEqual([segunda._id, primera._id]);
    expect(
      (await request(app).get(`/api/videojuegos/${juego._id}/metas?activa=false`).expect(200)).body,
    ).toHaveLength(1);
    errorTipo(await request(app).get(`/api/videojuegos/${juego._id}/metas?activa=quizas`), 400, 'VALIDACION');
  });

  it('404 y 400 en consultas y cambios de metas inexistentes o con id inválido', async () => {
    for (const [metodo, ruta] of [
      ['get', `/api/metas/${idAusente}`],
      ['patch', `/api/metas/${idAusente}`],
      ['patch', `/api/metas/${idAusente}/desactivar`],
      ['get', `/api/videojuegos/${idAusente}/metas`],
    ] as const) {
      errorTipo(await request(app)[metodo](ruta).send({}), 404, 'NO_ENCONTRADO');
    }
    errorTipo(await request(app).get('/api/metas/no-id'), 400, 'ID_MALFORMADO');
    errorTipo(await request(app).get('/api/videojuegos/no-id/metas'), 400, 'ID_MALFORMADO');
  });
});

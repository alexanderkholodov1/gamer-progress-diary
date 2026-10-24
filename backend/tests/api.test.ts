import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import { Videojuego } from '../src/models/Videojuego';
import { Partida } from '../src/models/Partida';
import { sembrarDemo } from '../src/scripts/datosDemo';

let memoria: MongoMemoryServer;
const idAusente = new mongoose.Types.ObjectId().toString();
const ficha = { nombre: 'Celeste', plataforma: 'PC', genero: 'puzzle', estado: 'jugando', logros: [{ nombre: 'Llegar a la cima', obtenido: false }] };
const sesion = (videojuego: string, extra = {}) => ({ videojuego, fecha: '2026-10-20T18:00:00.000Z', duracionMinutos: 65, porcentajeAvance: 25, notas: 'Primer ascenso.', ...extra });
const crearJuego = async () => (await request(app).post('/api/videojuegos').send(ficha).expect(201)).body;
const errorTipo = (respuesta: request.Response, status: number, tipo: string) => {
  expect(respuesta.status).toBe(status);
  expect(respuesta.body.error.tipo).toBe(tipo);
  expect(respuesta.body.error.mensaje).toBeTypeOf('string');
  expect(respuesta.body.error.requestId).toBe(respuesta.headers['x-request-id']);
};

beforeAll(async () => {
  memoria = await MongoMemoryServer.create();
  await mongoose.connect(memoria.getUri());
});
beforeEach(async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await Promise.all([Videojuego.deleteMany({}), Partida.deleteMany({})]);
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => { await mongoose.disconnect(); await memoria?.stop(); });

describe('Videojuegos: CRUD, filtros y subdocumentos', () => {
  it('lista vacía y creación con timestamps y logros embebidos', async () => {
    expect((await request(app).get('/api/videojuegos').expect(200)).body).toEqual([]);
    const juego = await crearJuego();
    expect(juego).toMatchObject(ficha);
    expect(juego.createdAt).toBeTruthy();
    expect(juego.updatedAt).toBeTruthy();
    expect(juego.logros[0]._id).toMatch(/^[a-f0-9]{24}$/);
    expect((await request(app).get(`/api/videojuegos/${juego._id}`).expect(200)).body.nombre).toBe('Celeste');
  });
  it('filtra por nombre, plataforma, género y estado', async () => {
    await crearJuego();
    await request(app).post('/api/videojuegos').send({ ...ficha, nombre: 'Portal', plataforma: 'Switch', estado: 'completado' }).expect(201);
    expect((await request(app).get('/api/videojuegos?nombre=CELE&plataforma=PC&genero=puzzle&estado=jugando').expect(200)).body).toHaveLength(1);
    expect((await request(app).get('/api/videojuegos?genero=rol').expect(200)).body).toEqual([]);
    expect((await request(app).get('/api/videojuegos').query({ nombre: '.*' }).expect(200)).body).toEqual([]);
  });
  it('actualiza por PUT y PATCH y vuelve a validar', async () => {
    const juego = await crearJuego();
    expect((await request(app).put(`/api/videojuegos/${juego._id}`).send({ ...ficha, nombre: 'Celeste 2' }).expect(200)).body.nombre).toBe('Celeste 2');
    expect((await request(app).patch(`/api/videojuegos/${juego._id}`).send({ estado: 'completado' }).expect(200)).body.estado).toBe('completado');
    errorTipo(await request(app).put(`/api/videojuegos/${juego._id}`).send({ estado: 'ilegal' }), 400, 'VALIDACION');
  });
  it('marca y desmarca un logro, persistiendo el subdocumento', async () => {
    const juego = await crearJuego();
    const ruta = `/api/videojuegos/${juego._id}/logros/${juego.logros[0]._id}`;
    expect((await request(app).patch(ruta).send({ obtenido: true }).expect(200)).body.logros[0].obtenido).toBe(true);
    expect((await request(app).get(`/api/videojuegos/${juego._id}`).expect(200)).body.logros[0].obtenido).toBe(true);
    expect((await request(app).patch(ruta).send({ obtenido: false }).expect(200)).body.logros[0].obtenido).toBe(false);
    errorTipo(await request(app).patch(ruta).send({ obtenido: 'true' }), 400, 'VALIDACION');
    errorTipo(await request(app).patch(`/api/videojuegos/${juego._id}/logros/${idAusente}`).send({ obtenido: true }), 404, 'NO_ENCONTRADO');
    errorTipo(await request(app).patch(`/api/videojuegos/${juego._id}/logros/invalido`).send({ obtenido: true }), 400, 'ID_MALFORMADO');
  });
  it('elimina el videojuego y sus partidas para evitar huérfanos', async () => {
    const juego = await crearJuego();
    await request(app).post('/api/partidas').send(sesion(juego._id)).expect(201);
    await request(app).delete(`/api/videojuegos/${juego._id}`).expect(204);
    expect(await Partida.countDocuments()).toBe(0);
    await request(app).get(`/api/videojuegos/${juego._id}`).expect(404);
  });
});

describe('Partidas: CRUD y relación referenciada', () => {
  it('lista vacía, crea, obtiene y lista con populate', async () => {
    expect((await request(app).get('/api/partidas').expect(200)).body).toEqual([]);
    const juego = await crearJuego();
    const partida = (await request(app).post('/api/partidas').send(sesion(juego._id)).expect(201)).body;
    expect(partida.videojuego).toBe(juego._id);
    expect(partida.createdAt).toBeTruthy();
    const lista = (await request(app).get('/api/partidas').expect(200)).body;
    expect(lista[0].videojuego).toMatchObject({ _id: juego._id, nombre: 'Celeste' });
    expect((await request(app).get(`/api/partidas/${partida._id}`).expect(200)).body.videojuego.nombre).toBe('Celeste');
  });
  it('actualiza por PUT y PATCH, valida la nueva referencia y elimina', async () => {
    const juego = await crearJuego();
    const partida = (await request(app).post('/api/partidas').send(sesion(juego._id)).expect(201)).body;
    expect((await request(app).put(`/api/partidas/${partida._id}`).send(sesion(juego._id, { duracionMinutos: 90 })).expect(200)).body.duracionMinutos).toBe(90);
    expect((await request(app).patch(`/api/partidas/${partida._id}`).send({ porcentajeAvance: 40 }).expect(200)).body.porcentajeAvance).toBe(40);
    errorTipo(await request(app).patch(`/api/partidas/${partida._id}`).send({ videojuego: idAusente }), 404, 'NO_ENCONTRADO');
    errorTipo(await request(app).patch(`/api/partidas/${partida._id}`).send({ porcentajeAvance: 101 }), 400, 'VALIDACION');
    await request(app).delete(`/api/partidas/${partida._id}`).expect(204);
    await request(app).get(`/api/partidas/${partida._id}`).expect(404);
  });
  it('devuelve solo las partidas del videojuego solicitado y ordena por fecha', async () => {
    const juego = await crearJuego();
    const otro = await crearJuego();
    await request(app).post('/api/partidas').send(sesion(juego._id)).expect(201);
    await request(app).post('/api/partidas').send(sesion(juego._id, { fecha: '2026-10-22T18:00:00.000Z' })).expect(201);
    await request(app).post('/api/partidas').send(sesion(otro._id)).expect(201);
    const lista = (await request(app).get(`/api/videojuegos/${juego._id}/partidas`).expect(200)).body;
    expect(lista).toHaveLength(2);
    expect(lista.every((p: { videojuego: string }) => p.videojuego === juego._id)).toBe(true);
    expect(lista[0].fecha).toBe('2026-10-22T18:00:00.000Z');
  });
});

describe('Resumen calculado en el servicio', () => {
  it('cero partidas devuelve ceros y null sin romperse', async () => {
    const juego = await crearJuego();
    expect((await request(app).get(`/api/videojuegos/${juego._id}/resumen`).expect(200)).body).toEqual({
      totalPartidas: 0, horasTotales: 0, ultimaPartida: null, porcentajeAvanceActual: 0,
    });
    expect((await request(app).get(`/api/videojuegos/${juego._id}/partidas`).expect(200)).body).toEqual([]);
  });
  it('suma minutos, redondea, usa fecha más reciente y se actualiza al agregar/eliminar', async () => {
    const juego = await crearJuego();
    await request(app).post('/api/partidas').send(sesion(juego._id, { fecha: '2026-10-22T12:00:00.000Z', porcentajeAvance: 40 })).expect(201);
    await request(app).post('/api/partidas').send(sesion(juego._id, { fecha: '2026-10-20T12:00:00.000Z', porcentajeAvance: 90, duracionMinutos: 30 })).expect(201);
    const ruta = `/api/videojuegos/${juego._id}/resumen`;
    expect((await request(app).get(ruta).expect(200)).body).toEqual({ totalPartidas: 2, horasTotales: 1.6, ultimaPartida: '2026-10-22T12:00:00.000Z', porcentajeAvanceActual: 40 });
    const nueva = (await request(app).post('/api/partidas').send(sesion(juego._id, { fecha: '2026-10-23T12:00:00.000Z', duracionMinutos: 60, porcentajeAvance: 55 })).expect(201)).body;
    expect((await request(app).get(ruta).expect(200)).body).toEqual({ totalPartidas: 3, horasTotales: 2.6, ultimaPartida: '2026-10-23T12:00:00.000Z', porcentajeAvanceActual: 55 });
    await request(app).delete(`/api/partidas/${nueva._id}`).expect(204);
    expect((await request(app).get(ruta).expect(200)).body.porcentajeAvanceActual).toBe(40);
  });
  it('desempata fechas iguales por creación e id descendentes', async () => {
    const juego = await crearJuego();
    await Partida.create({ ...sesion(juego._id), _id: '000000000000000000000001', createdAt: new Date('2026-10-20') });
    await Partida.create({ ...sesion(juego._id, { porcentajeAvance: 45 }), _id: '000000000000000000000002', createdAt: new Date('2026-10-20') });
    expect((await request(app).get(`/api/videojuegos/${juego._id}/resumen`).expect(200)).body.porcentajeAvanceActual).toBe(45);
  });
  it('el seed es repetible y genera tres partidas con el resumen esperado', async () => {
    const juego = await sembrarDemo();
    await sembrarDemo();
    expect(await Videojuego.countDocuments()).toBe(1);
    expect((await request(app).get(`/api/videojuegos/${juego._id}/resumen`).expect(200)).body).toEqual({
      totalPartidas: 3, horasTotales: 3.9, ultimaPartida: '2026-10-22T20:00:00.000Z', porcentajeAvanceActual: 38,
    });
  });
});

describe('Cuatro tipos de error y middleware', () => {
  it.each([
    {}, { ...ficha, nombre: ' ' }, { ...ficha, plataforma: 'Atari' },
    { ...ficha, genero: 'inventado' }, { ...ficha, estado: 'nuevo' },
    { ...ficha, logros: [{ obtenido: false }] },
  ])('validación de esquema: videojuego inválido → 400', async datos => {
    errorTipo(await request(app).post('/api/videojuegos').send(datos), 400, 'VALIDACION');
  });
  it.each([
    { fecha: undefined }, { duracionMinutos: undefined }, { duracionMinutos: 0 },
    { porcentajeAvance: -1 }, { porcentajeAvance: 101 }, { videojuego: undefined },
  ])('validación de esquema: partida inválida → 400', async datos => {
    const juego = await crearJuego();
    errorTipo(await request(app).post('/api/partidas').send(sesion(juego._id, datos)), 400, 'VALIDACION');
  });
  it('acepta los límites de avance 0 y 100 y duración mínima 1', async () => {
    const juego = await crearJuego();
    for (const porcentajeAvance of [0, 100]) {
      await request(app).post('/api/partidas').send(sesion(juego._id, { porcentajeAvance, duracionMinutos: 1 })).expect(201);
    }
  });
  it.each(['/api/videojuegos/no-id', '/api/videojuegos/no-id/resumen', '/api/videojuegos/no-id/partidas', '/api/partidas/no-id'])('cast: %s → 400', async ruta => {
    errorTipo(await request(app).get(ruta), 400, 'ID_MALFORMADO');
  });
  it('cast en referencia y fecha inválida → 400', async () => {
    errorTipo(await request(app).post('/api/partidas').send(sesion('no-id')), 400, 'ID_MALFORMADO');
    const juego = await crearJuego();
    errorTipo(await request(app).post('/api/partidas').send(sesion(juego._id, { fecha: 'ayer' })), 400, 'ID_MALFORMADO');
  });
  it('referencia inexistente → 404 y no crea la partida', async () => {
    errorTipo(await request(app).post('/api/partidas').send(sesion(idAusente)), 404, 'NO_ENCONTRADO');
    expect(await Partida.countDocuments()).toBe(0);
  });
  it('recursos inexistentes en cada operación → 404', async () => {
    for (const base of ['/api/videojuegos', '/api/partidas']) {
      errorTipo(await request(app).get(`${base}/${idAusente}`), 404, 'NO_ENCONTRADO');
      errorTipo(await request(app).put(`${base}/${idAusente}`).send({}), 404, 'NO_ENCONTRADO');
      errorTipo(await request(app).delete(`${base}/${idAusente}`), 404, 'NO_ENCONTRADO');
    }
    for (const ruta of ['resumen', 'partidas']) {
      errorTipo(await request(app).get(`/api/videojuegos/${idAusente}/${ruta}`), 404, 'NO_ENCONTRADO');
    }
  });
  it('error inesperado de base de datos → 500 sin filtrar detalles privados', async () => {
    vi.spyOn(Videojuego, 'find').mockImplementationOnce(() => { throw new Error('detalle privado'); });
    const respuesta = await request(app).get('/api/videojuegos');
    errorTipo(respuesta, 500, 'INTERNO');
    expect(JSON.stringify(respuesta.body)).not.toContain('detalle privado');
    expect(console.error).toHaveBeenCalled();
  });
  it('JSON inválido y cuerpo que no es objeto → 400', async () => {
    errorTipo(await request(app).post('/api/videojuegos').set('Content-Type', 'application/json').send('{'), 400, 'VALIDACION');
    errorTipo(await request(app).post('/api/videojuegos').send([]), 400, 'VALIDACION');
  });
  it('health, ruta desconocida, requestId, logger y CORS', async () => {
    const respuesta = await request(app).get('/api/health').set('Origin', 'http://localhost:5173').expect(200);
    expect(respuesta.body.estado).toBe('disponible');
    expect(respuesta.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    expect(respuesta.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining(respuesta.headers['x-request-id']));
    const preflight = await request(app).options('/api/videojuegos').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'PATCH').expect(204);
    expect(preflight.headers['access-control-allow-methods']).toContain('PATCH');
    errorTipo(await request(app).get('/api/desconocida'), 404, 'NO_ENCONTRADO');
  });
});

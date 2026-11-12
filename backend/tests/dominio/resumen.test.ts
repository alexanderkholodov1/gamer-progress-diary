import { describe, expect, it } from 'vitest';
import { calcularResumen } from '../../src/dominio/resumen';

// D-1 · Resumen de E1 como función pura (spec 03, sección 2). Sin base de datos.
const partida = (fecha: string, duracionMinutos: number, porcentajeAvance: number, extra = {}) => ({
  fecha: new Date(fecha),
  duracionMinutos,
  porcentajeAvance,
  ...extra,
});

describe('calcularResumen (D-1)', () => {
  it('CA-D1.1 suma, redondea a un decimal y toma la partida más reciente aunque llegue desordenada', () => {
    const partidas = [
      partida('2026-10-21T20:00:00Z', 95, 26),
      partida('2026-10-22T20:00:00Z', 80, 38),
      partida('2026-10-20T20:00:00Z', 60, 90),
    ];
    expect(calcularResumen(partidas)).toEqual({
      totalPartidas: 3,
      horasTotales: 3.9,
      ultimaPartida: new Date('2026-10-22T20:00:00Z'),
      porcentajeAvanceActual: 38,
    });
  });

  it('CA-D1.2 con fechas iguales desempata por creación y luego por id descendentes', () => {
    const misma = '2026-10-20T18:00:00Z';
    const creado = new Date('2026-10-20T19:00:00Z');
    expect(
      calcularResumen([
        partida(misma, 30, 10, { createdAt: creado, _id: '000000000000000000000002' }),
        partida(misma, 30, 20, {
          createdAt: new Date('2026-10-20T18:30:00Z'),
          _id: '000000000000000000000009',
        }),
        partida(misma, 30, 45, { createdAt: creado, _id: '00000000000000000000000a' }),
      ]).porcentajeAvanceActual,
    ).toBe(45);
  });

  it('CA-D1.3 sin partidas devuelve ceros y null', () => {
    expect(calcularResumen([])).toEqual({
      totalPartidas: 0,
      horasTotales: 0,
      ultimaPartida: null,
      porcentajeAvanceActual: 0,
    });
  });

  it('no modifica el arreglo recibido', () => {
    const partidas = [partida('2026-10-20T20:00:00Z', 60, 10), partida('2026-10-22T20:00:00Z', 60, 20)];
    const copia = [...partidas];
    calcularResumen(partidas);
    expect(partidas).toEqual(copia);
  });
});

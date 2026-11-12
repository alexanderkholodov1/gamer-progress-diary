import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { Meta } from '../../src/models/Meta';

// Validaciones del modelo sin base de datos (validateSync). Spec 01, T-01.
const base = () => ({
  videojuego: new Types.ObjectId(),
  horasSemanales: 5,
  diasPorSemana: 4,
  hitos: [{ descripcion: 'Llegar al 50 %', porcentajeObjetivo: 50 }],
});
const errores = (datos: Record<string, unknown>) => Object.keys(new Meta(datos).validateSync()?.errors ?? {});

describe('Modelo Meta', () => {
  it('CA-2.1.1 acepta una meta válida, activa por defecto y con hitos embebidos', () => {
    const meta = new Meta(base());
    expect(meta.validateSync()).toBeUndefined();
    expect(meta.activa).toBe(true);
    expect(meta.hitos[0]?._id).toBeDefined();
  });

  it('CA-2.1.1 acepta horas decimales, el máximo de 100 h y los extremos de 1 y 7 días', () => {
    for (const [horasSemanales, diasPorSemana] of [
      [0.5, 1],
      [100, 7],
      [2.5, 3],
    ]) {
      expect(errores({ ...base(), horasSemanales, diasPorSemana })).toEqual([]);
    }
  });

  it.each([0, -1, 100.5, Number.POSITIVE_INFINITY, undefined])(
    'CA-2.1.2 rechaza horasSemanales = %s',
    (horasSemanales) => {
      expect(errores({ ...base(), horasSemanales })).toContain('horasSemanales');
    },
  );

  it.each([0, 8, 3.5, undefined])('CA-2.1.2 rechaza diasPorSemana = %s', (diasPorSemana) => {
    expect(errores({ ...base(), diasPorSemana })).toContain('diasPorSemana');
  });

  it('CA-2.1.3 acepta de 0 a 5 hitos y rechaza 6', () => {
    const hitos = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        descripcion: `Hito ${i + 1}`,
        porcentajeObjetivo: (i + 1) * 15,
      }));
    expect(errores({ ...base(), hitos: [] })).toEqual([]);
    expect(errores({ ...base(), hitos: hitos(5) })).toEqual([]);
    expect(errores({ ...base(), hitos: hitos(6) })).toContain('hitos');
  });

  it.each([
    { descripcion: '', porcentajeObjetivo: 50 },
    { descripcion: '   ', porcentajeObjetivo: 50 },
    { descripcion: 'Sin objetivo' },
    { descripcion: 'Cero', porcentajeObjetivo: 0 },
    { descripcion: 'Demasiado', porcentajeObjetivo: 101 },
    { descripcion: 'x'.repeat(81), porcentajeObjetivo: 10 },
  ])('CA-2.1.3 rechaza el hito %o', (hito) => {
    expect(errores({ ...base(), hitos: [hito] }).some((campo) => campo.startsWith('hitos'))).toBe(true);
  });

  it('exige la referencia al videojuego y la valida como ObjectId', () => {
    expect(errores({ ...base(), videojuego: undefined })).toContain('videojuego');
    expect(errores({ ...base(), videojuego: 'no-es-un-id' })).toContain('videojuego');
  });

  it('declara el índice único parcial de una meta activa por videojuego', () => {
    const indice = Meta.schema
      .indexes()
      .find(([campos, opciones]) => campos.videojuego === 1 && opciones?.unique);
    expect(indice?.[1]).toMatchObject({ unique: true, partialFilterExpression: { activa: true } });
  });
});

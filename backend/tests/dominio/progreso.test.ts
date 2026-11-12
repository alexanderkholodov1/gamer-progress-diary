import { describe, expect, it } from 'vitest';
import {
  calcularProgresoSemanal,
  calcularRachas,
  diaLocal,
  diasJugadosEnSemana,
  evaluarHitos,
  horasEnSemana,
  porcentajeDeHoras,
  semanaDe,
} from '../../src/dominio/progreso';

// Tests de dominio sin base de datos. Spec 01, sección 6. Escritos antes que src/dominio/progreso.ts (T-03).
// Hora de Ecuador = UTC-5 (sin horario de verano). `ec('2026-11-05 15:00')` crea ese instante local.
const ec = (local: string) => new Date(`${local.replace(' ', 'T')}:00-05:00`);
const partida = (local: string, duracionMinutos = 60) => ({ fecha: ec(local), duracionMinutos });
const AHORA = ec('2026-11-05 15:00'); // jueves
const SEMANA = { inicio: '2026-11-02', fin: '2026-11-08' };
const hitos = [
  { descripcion: 'Terminar el juego', porcentajeObjetivo: 100 },
  { descripcion: 'Llegar al 25 %', porcentajeObjetivo: 25 },
  { descripcion: 'Llegar al 50 %', porcentajeObjetivo: 50 },
];

describe('diaLocal y semanaDe · RN-03, RN-07', () => {
  it('CA-2.3.5 una partida a las 23:30 del domingo pertenece al domingo, aunque en UTC ya sea lunes', () => {
    expect(diaLocal(ec('2026-11-08 23:30'))).toBe('2026-11-08');
    expect(ec('2026-11-08 23:30').toISOString()).toBe('2026-11-09T04:30:00.000Z');
    expect(diaLocal(ec('2026-11-09 00:00'))).toBe('2026-11-09');
  });

  it('CA-2.3.1 la semana va de lunes a domingo en hora de Ecuador', () => {
    expect(semanaDe(AHORA)).toEqual(SEMANA);
    expect(semanaDe(ec('2026-11-02 00:00'))).toEqual(SEMANA);
    expect(semanaDe(ec('2026-11-08 23:59'))).toEqual(SEMANA);
    expect(semanaDe(ec('2026-11-09 00:00'))).toEqual({ inicio: '2026-11-09', fin: '2026-11-15' });
  });

  it('cruza meses y años correctamente', () => {
    expect(semanaDe(ec('2026-12-31 12:00'))).toEqual({ inicio: '2026-12-28', fin: '2027-01-03' });
  });
});

describe('horasEnSemana · RN-04, RN-07', () => {
  it('CA-2.3.1 suma solo las partidas de la semana en curso y redondea a un decimal', () => {
    const partidas = [
      partida('2026-11-01 22:00', 60), // domingo anterior
      partida('2026-11-02 10:00', 90),
      partida('2026-11-04 20:00', 120),
      partida('2026-11-09 10:00', 60), // lunes siguiente
    ];
    expect(horasEnSemana(partidas, SEMANA)).toBe(3.5);
    expect(horasEnSemana([partida('2026-11-03 10:00', 100)], SEMANA)).toBe(1.7);
  });

  it('CA-2.3.5 una partida que cruza la medianoche cuenta completa en el día y la semana en que empezó', () => {
    const medianoche = [partida('2026-11-08 23:30', 60)];
    expect(horasEnSemana(medianoche, SEMANA)).toBe(1);
    expect(horasEnSemana(medianoche, { inicio: '2026-11-09', fin: '2026-11-15' })).toBe(0);
  });
});

describe('diasJugadosEnSemana · RN-06', () => {
  it('CA-2.3.4 varias partidas el mismo día cuentan como un solo día', () => {
    const partidas = [
      partida('2026-11-03 09:00'),
      partida('2026-11-03 21:00'),
      partida('2026-11-04 18:00'),
      partida('2026-11-05 08:00'),
    ];
    expect(diasJugadosEnSemana(partidas, SEMANA)).toBe(3);
  });

  it('CA-2.3.5 la partida de las 23:30 del domingo no suma un día al lunes siguiente', () => {
    const partidas = [partida('2026-11-08 23:30')];
    expect(diasJugadosEnSemana(partidas, SEMANA)).toBe(1);
    expect(diasJugadosEnSemana(partidas, { inicio: '2026-11-09', fin: '2026-11-15' })).toBe(0);
  });
});

describe('porcentajeDeHoras · RN-05', () => {
  it('CA-2.3.2 3,5 h de una meta de 5 h es 70 %', () => {
    expect(porcentajeDeHoras(3.5, 5)).toBe(70);
  });

  it('CA-2.3.3 7 h de una meta de 5 h es 140 %: no se limita a 100', () => {
    expect(porcentajeDeHoras(7, 5)).toBe(140);
  });

  it('redondea a entero y devuelve 0 sin horas', () => {
    expect(porcentajeDeHoras(1, 3)).toBe(33);
    expect(porcentajeDeHoras(0, 5)).toBe(0);
  });
});

describe('calcularRachas · RN-08, RN-09', () => {
  it('CA-2.4.1 días consecutivos hasta hoy', () => {
    const partidas = ['2026-11-03 10:00', '2026-11-04 10:00', '2026-11-05 10:00'].map((f) => partida(f));
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 3, mejorRacha: 3 });
  });

  it('CA-2.4.2 si hoy aún no hay partida pero ayer sí, la racha sigue viva', () => {
    const partidas = ['2026-11-02 10:00', '2026-11-03 10:00', '2026-11-04 22:00'].map((f) => partida(f));
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 3, mejorRacha: 3 });
  });

  it('CA-2.4.3 sin partida hoy ni ayer la racha actual es 0 y la mejor se conserva', () => {
    const partidas = ['2026-11-01 10:00', '2026-11-02 10:00', '2026-11-03 10:00'].map((f) => partida(f));
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 0, mejorRacha: 3 });
  });

  it('CA-2.4.4 con una racha rota, la mejor es la más larga y la actual el tramo reciente', () => {
    const partidas = [
      ...['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'].map((d) =>
        partida(`${d} 19:00`),
      ),
      ...['2026-11-03', '2026-11-04'].map((d) => partida(`${d} 19:00`)),
    ];
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 2, mejorRacha: 5 });
  });

  it('CA-2.4.5 varias partidas el mismo día cuentan una vez en la racha', () => {
    const partidas = ['2026-11-04 08:00', '2026-11-04 12:00', '2026-11-04 23:00', '2026-11-05 07:00'].map(
      (f) => partida(f),
    );
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 2, mejorRacha: 2 });
  });

  it('usa el día de Ecuador: 23:30 del miércoles y 08:00 del jueves son dos días seguidos', () => {
    const partidas = [partida('2026-11-04 23:30'), partida('2026-11-05 08:00')];
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 2, mejorRacha: 2 });
  });

  it('cuenta días seguidos a través del cambio de año', () => {
    const partidas = [partida('2026-12-31 20:00'), partida('2027-01-01 20:00')];
    expect(calcularRachas(partidas, ec('2027-01-01 21:00'))).toEqual({ rachaActual: 2, mejorRacha: 2 });
  });

  it('CA-2.3.7 sin partidas la racha es 0', () => {
    expect(calcularRachas([], AHORA)).toEqual({ rachaActual: 0, mejorRacha: 0 });
  });

  it('CA-2.3.9 una partida con fecha futura no alarga la racha', () => {
    const partidas = [partida('2026-11-04 10:00'), partida('2026-11-05 10:00'), partida('2026-11-06 10:00')];
    expect(calcularRachas(partidas, AHORA)).toEqual({ rachaActual: 2, mejorRacha: 2 });
  });
});

describe('evaluarHitos · RN-11, RN-02', () => {
  it('CA-2.5.1 con avance 50 %, los hitos de 25 y 50 están alcanzados y el de 100 no', () => {
    expect(evaluarHitos(hitos, 50).map((h) => h.alcanzado)).toEqual([true, true, false]);
  });

  it('CA-2.5.2 si el avance actual baja, el hito vuelve a pendiente', () => {
    expect(evaluarHitos(hitos, 50).find((h) => h.porcentajeObjetivo === 50)?.alcanzado).toBe(true);
    expect(evaluarHitos(hitos, 40).find((h) => h.porcentajeObjetivo === 50)?.alcanzado).toBe(false);
  });

  it('CA-2.5.3 sin avance ningún hito está alcanzado', () => {
    expect(evaluarHitos(hitos, 0).some((h) => h.alcanzado)).toBe(false);
  });

  it('CA-2.5.4 devuelve los hitos de menor a mayor objetivo sin modificar la entrada', () => {
    const copia = structuredClone(hitos);
    expect(evaluarHitos(hitos, 30)).toEqual([
      { descripcion: 'Llegar al 25 %', porcentajeObjetivo: 25, alcanzado: true },
      { descripcion: 'Llegar al 50 %', porcentajeObjetivo: 50, alcanzado: false },
      { descripcion: 'Terminar el juego', porcentajeObjetivo: 100, alcanzado: false },
    ]);
    expect(hitos).toEqual(copia);
  });
});

describe('calcularProgresoSemanal · respuesta completa', () => {
  // Racha: 26–30 oct (5 días), hueco, 2–4 nov (3 días, viva porque ayer hubo partida).
  const historial = [
    ...['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].map((d) =>
      partida(`${d} 19:00`, 30),
    ),
    partida('2026-11-02 19:00', 90),
    partida('2026-11-03 19:00', 60),
    partida('2026-11-04 10:00', 30),
    partida('2026-11-04 21:00', 30),
  ];
  const meta = { horasSemanales: 5, diasPorSemana: 4, hitos };

  it('CA-2.3.2 reproduce el ejemplo de la ficha: 3,5 h de 5 h, 3 días, rachas 3 y 5', () => {
    expect(
      calcularProgresoSemanal({ partidas: historial, meta, porcentajeAvanceActual: 50, ahora: AHORA }),
    ).toEqual({
      semana: SEMANA,
      meta: { horasSemanales: 5, diasPorSemana: 4 },
      horasSemana: 3.5,
      porcentajeHoras: 70,
      diasJugadosSemana: 3,
      metaCumplida: false,
      rachaActual: 3,
      mejorRacha: 5,
      hitos: [
        { descripcion: 'Llegar al 25 %', porcentajeObjetivo: 25, alcanzado: true },
        { descripcion: 'Llegar al 50 %', porcentajeObjetivo: 50, alcanzado: true },
        { descripcion: 'Terminar el juego', porcentajeObjetivo: 100, alcanzado: false },
      ],
    });
  });

  it('CA-2.2.1 / RN-10 el porcentaje usa la meta recibida (la activa al consultar)', () => {
    const nueva = { horasSemanales: 2, diasPorSemana: 2, hitos: [] };
    const progreso = calcularProgresoSemanal({
      partidas: historial,
      meta: nueva,
      porcentajeAvanceActual: 50,
      ahora: AHORA,
    });
    expect(progreso.porcentajeHoras).toBe(175);
    expect(progreso.metaCumplida).toBe(true);
  });

  it('CA-2.3.6 sin meta activa: meta, porcentaje y cumplida en null, pero calcula horas, días y rachas', () => {
    const progreso = calcularProgresoSemanal({
      partidas: historial,
      meta: null,
      porcentajeAvanceActual: 50,
      ahora: AHORA,
    });
    expect(progreso).toMatchObject({
      meta: null,
      porcentajeHoras: null,
      metaCumplida: null,
      hitos: [],
      horasSemana: 3.5,
      diasJugadosSemana: 3,
      rachaActual: 3,
      mejorRacha: 5,
    });
  });

  it('CA-2.3.7 / CA-2.5.3 sin partidas: ceros y ningún hito alcanzado', () => {
    const progreso = calcularProgresoSemanal({ partidas: [], meta, porcentajeAvanceActual: 0, ahora: AHORA });
    expect(progreso).toMatchObject({
      horasSemana: 0,
      porcentajeHoras: 0,
      diasJugadosSemana: 0,
      rachaActual: 0,
      mejorRacha: 0,
      metaCumplida: false,
    });
    expect(progreso.hitos.every((h) => !h.alcanzado)).toBe(true);
  });

  it('CA-2.3.8 la meta se cumple solo con las horas Y los días', () => {
    const cuatroDias = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map((d) =>
      partida(`${d} 08:00`, 75),
    );
    const calcular = (partidas: typeof cuatroDias) =>
      calcularProgresoSemanal({ partidas, meta, porcentajeAvanceActual: 10, ahora: AHORA }).metaCumplida;
    expect(calcular(cuatroDias)).toBe(true); // 5 h y 4 días
    expect(calcular(cuatroDias.slice(0, 3))).toBe(false); // 3,8 h y 3 días
    expect(calcular([partida('2026-11-02 08:00', 400)])).toBe(false); // 6,7 h pero 1 día
  });

  it('CA-2.3.9 las partidas con fecha futura no cuentan para horas ni días', () => {
    const conFutura = [...historial, partida('2026-11-07 10:00', 600)];
    const progreso = calcularProgresoSemanal({
      partidas: conFutura,
      meta,
      porcentajeAvanceActual: 50,
      ahora: AHORA,
    });
    expect(progreso.horasSemana).toBe(3.5);
    expect(progreso.diasJugadosSemana).toBe(3);
  });
});

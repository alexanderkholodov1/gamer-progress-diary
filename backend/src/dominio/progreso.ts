// Capa de dominio de la épica E2: funciones puras, sin Mongoose ni reloj del sistema.
// Reglas de negocio del PRD (RN-03 a RN-19) y contrato de la spec 01, sección 4.

export const ZONA_HORARIA = 'America/Guayaquil';

export interface PartidaParaProgreso {
  fecha: Date | string;
  duracionMinutos: number;
}
export interface HitoMeta {
  descripcion: string;
  porcentajeObjetivo: number;
}
export interface MetaParaProgreso {
  horasSemanales: number;
  diasPorSemana: number;
  hitos?: HitoMeta[];
}
export interface Semana {
  inicio: string;
  fin: string;
}
export interface HitoEvaluado extends HitoMeta {
  alcanzado: boolean;
}
export interface ProgresoSemanal {
  semana: Semana;
  meta: { horasSemanales: number; diasPorSemana: number } | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  metaCumplida: boolean | null;
  rachaActual: number;
  mejorRacha: number;
  hitos: HitoEvaluado[];
}

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Día local de Ecuador ("YYYY-MM-DD") en que ocurre un instante. Una partida pertenece al día en que empezó (RN-07). */
export function diaLocal(fecha: Date | string): string {
  const partes = Object.fromEntries(formatoDia.formatToParts(new Date(fecha)).map((p) => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

/** Suma días a una fecha "YYYY-MM-DD" usando aritmética de calendario (sin horas ni zonas). */
export function sumarDias(dia: string, cantidad: number): string {
  const [anio, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, d + cantidad)).toISOString().slice(0, 10);
}

/** Semana de lunes a domingo, en hora de Ecuador, que contiene a `ahora` (RN-03). */
export function semanaDe(ahora: Date): Semana {
  const hoy = diaLocal(ahora);
  const [anio, mes, d] = hoy.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, d)).getUTCDay(); // 0 = domingo
  const desdeLunes = (diaSemana + 6) % 7;
  const inicio = sumarDias(hoy, -desdeLunes);
  return { inicio, fin: sumarDias(inicio, 6) };
}

const enSemana = (partida: PartidaParaProgreso, semana: Semana) => {
  const dia = diaLocal(partida.fecha);
  return dia >= semana.inicio && dia <= semana.fin;
};

const redondearUnDecimal = (valor: number) => Math.round(valor * 10) / 10;

/** Horas jugadas en la semana, con un decimal (RN-04). La duración completa cuenta en el día de inicio (RN-07). */
export function horasEnSemana(partidas: PartidaParaProgreso[], semana: Semana): number {
  const minutos = partidas
    .filter((p) => enSemana(p, semana))
    .reduce((total, p) => total + p.duracionMinutos, 0);
  return redondearUnDecimal(minutos / 60);
}

/** Días distintos con al menos una partida dentro de la semana (RN-06). */
export function diasJugadosEnSemana(partidas: PartidaParaProgreso[], semana: Semana): number {
  return new Set(partidas.filter((p) => enSemana(p, semana)).map((p) => diaLocal(p.fecha))).size;
}

/** Porcentaje entero de las horas frente a la meta, sin tope superior (RN-05). */
export function porcentajeDeHoras(horas: number, horasSemanales: number): number {
  return Math.round((horas / horasSemanales) * 100);
}

/** Racha actual y mejor racha sobre todo el historial (RN-08, RN-09). Ignora partidas futuras (RN-15). */
export function calcularRachas(
  partidas: PartidaParaProgreso[],
  ahora: Date,
): { rachaActual: number; mejorRacha: number } {
  const dias = new Set(partidas.filter((p) => new Date(p.fecha) <= ahora).map((p) => diaLocal(p.fecha)));
  const ordenados = [...dias].sort();
  let mejorRacha = 0;
  let tramo = 0;
  ordenados.forEach((dia, i) => {
    tramo = i > 0 && sumarDias(ordenados[i - 1], 1) === dia ? tramo + 1 : 1;
    mejorRacha = Math.max(mejorRacha, tramo);
  });
  const hoy = diaLocal(ahora);
  // Si hoy aún no hay partida pero ayer sí, la racha sigue viva y cuenta hasta ayer (RN-09).
  let cursor = dias.has(hoy) ? hoy : sumarDias(hoy, -1);
  let rachaActual = 0;
  while (dias.has(cursor)) {
    rachaActual += 1;
    cursor = sumarDias(cursor, -1);
  }
  return { rachaActual, mejorRacha };
}

/** Hitos ordenados por objetivo; alcanzado si el avance actual llega al objetivo (RN-11, RN-02). No se guarda. */
export function evaluarHitos(hitos: HitoMeta[], porcentajeAvanceActual: number): HitoEvaluado[] {
  return [...hitos]
    .sort((a, b) => a.porcentajeObjetivo - b.porcentajeObjetivo)
    .map(({ descripcion, porcentajeObjetivo }) => ({
      descripcion,
      porcentajeObjetivo,
      alcanzado: porcentajeAvanceActual >= porcentajeObjetivo,
    }));
}

/** Respuesta completa de GET /api/videojuegos/:id/progreso-semanal. */
export function calcularProgresoSemanal({
  partidas,
  meta,
  porcentajeAvanceActual,
  ahora,
}: {
  partidas: PartidaParaProgreso[];
  meta: MetaParaProgreso | null;
  porcentajeAvanceActual: number;
  ahora: Date;
}): ProgresoSemanal {
  const semana = semanaDe(ahora);
  const jugadas = partidas.filter((p) => new Date(p.fecha) <= ahora); // RN-15
  const horasSemana = horasEnSemana(jugadas, semana);
  const diasJugadosSemana = diasJugadosEnSemana(jugadas, semana);
  const { rachaActual, mejorRacha } = calcularRachas(jugadas, ahora);
  if (!meta) {
    // RN-18: sin meta activa se informan horas, días y rachas, sin porcentaje.
    return {
      semana,
      meta: null,
      horasSemana,
      porcentajeHoras: null,
      diasJugadosSemana,
      metaCumplida: null,
      rachaActual,
      mejorRacha,
      hitos: [],
    };
  }
  return {
    semana,
    meta: { horasSemanales: meta.horasSemanales, diasPorSemana: meta.diasPorSemana },
    horasSemana,
    porcentajeHoras: porcentajeDeHoras(horasSemana, meta.horasSemanales),
    diasJugadosSemana,
    // RN-14: la meta semanal se cumple con las horas Y los días.
    metaCumplida: horasSemana >= meta.horasSemanales && diasJugadosSemana >= meta.diasPorSemana,
    rachaActual,
    mejorRacha,
    hitos: evaluarHitos(meta.hitos ?? [], porcentajeAvanceActual),
  };
}

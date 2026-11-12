import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { diaLocal, sumarDias } from '../dominio/progreso';

// Demo de la épica E2: API real con MongoDB en memoria y datos relativos a hoy (hora de Ecuador).
// No usa .env ni toca Atlas. Uso: `npm run demo:e2` y luego curl o el frontend contra http://localhost:3000/api.
async function ejecutar() {
  process.env.MONGOMS_DOWNLOAD_DIR ??= '/tmp/diario-mongodb-binaries';
  const memoria = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoria.getUri();
  process.env.FRONTEND_URL ??= 'http://localhost:5173';
  const { conectarDB } = await import('../conexionDB');
  const { app } = await import('../app');
  const { Videojuego } = await import('../models/Videojuego');
  const { Partida } = await import('../models/Partida');
  const { Meta } = await import('../models/Meta');
  await conectarDB();
  await Meta.init();

  const hoy = diaLocal(new Date());
  const enDia = (desplazamiento: number, hora: string) =>
    new Date(`${sumarDias(hoy, desplazamiento)}T${hora}:00-05:00`);
  const haceHoras = (horas: number) => new Date(Date.now() - horas * 3_600_000);
  const base = { plataforma: 'PC', genero: 'accion', logros: [] };

  const hades = await Videojuego.create({ ...base, nombre: 'Hades (demo E2)', estado: 'jugando' });
  const sesiones = [
    ...[-12, -11, -10, -9, -8].map((d, i) => ({
      fecha: enDia(d, '19:00'),
      duracionMinutos: 45,
      porcentajeAvance: 5 * (i + 1),
    })),
    { fecha: enDia(-3, '23:30'), duracionMinutos: 60, porcentajeAvance: 35, notas: 'Cruza la medianoche' },
    { fecha: enDia(-2, '19:00'), duracionMinutos: 90, porcentajeAvance: 40 },
    { fecha: enDia(-1, '10:00'), duracionMinutos: 60, porcentajeAvance: 45 },
    {
      fecha: enDia(-1, '21:00'),
      duracionMinutos: 60,
      porcentajeAvance: 50,
      notas: 'Segunda partida del día',
    },
  ];
  await Partida.insertMany(sesiones.map((s) => ({ ...s, videojuego: hades._id })));
  await Meta.create({
    videojuego: hades._id,
    horasSemanales: 5,
    diasPorSemana: 4,
    hitos: [
      { descripcion: 'Terminar el juego', porcentajeObjetivo: 100 },
      { descripcion: 'Llegar al 25 %', porcentajeObjetivo: 25 },
      { descripcion: 'Llegar al 50 %', porcentajeObjetivo: 50 },
    ],
  });

  const celeste = await Videojuego.create({
    ...base,
    nombre: 'Celeste (sin partidas)',
    genero: 'puzzle',
    estado: 'jugando',
  });
  const portal = await Videojuego.create({
    ...base,
    nombre: 'Portal 2 (completado)',
    genero: 'puzzle',
    estado: 'completado',
  });
  const stardew = await Videojuego.create({
    ...base,
    nombre: 'Stardew Valley (meta superada)',
    genero: 'rol',
    estado: 'jugando',
  });
  await Partida.insertMany([
    { videojuego: stardew._id, fecha: haceHoras(3), duracionMinutos: 150, porcentajeAvance: 60 },
    { videojuego: stardew._id, fecha: haceHoras(1), duracionMinutos: 90, porcentajeAvance: 62 },
  ]);
  await Meta.create({ videojuego: stardew._id, horasSemanales: 2, diasPorSemana: 2, hitos: [] });

  const puerto = Number(process.env.PORT ?? 3000);
  const servidor = app.listen(puerto, '127.0.0.1', () => {
    console.info(`Demo E2 en http://localhost:${puerto}/api (MongoDB en memoria). Ctrl+C para salir.`);
    console.info(
      JSON.stringify({ hades: hades.id, celeste: celeste.id, portal: portal.id, stardew: stardew.id }),
    );
  });
  const salir = () =>
    servidor.close(
      () =>
        void mongoose
          .disconnect()
          .then(() => memoria.stop())
          .then(() => process.exit(0)),
    );
  process.once('SIGINT', salir);
  process.once('SIGTERM', salir);
}

ejecutar().catch((error) => {
  console.error('No se pudo iniciar la demo E2:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

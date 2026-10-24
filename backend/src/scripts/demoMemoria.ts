import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Server } from 'node:http';

async function ejecutar() {
  process.env.MONGOMS_DOWNLOAD_DIR ??= '/tmp/diario-mongodb-binaries';
  const memoria = await MongoMemoryServer.create();
  let servidor: Server | undefined;
  try {
    // URI efímera de prueba, sin credenciales; la conexión de la aplicación sigue leyendo el entorno.
    process.env.MONGODB_URI = memoria.getUri();
    process.env.FRONTEND_URL = 'http://localhost:5173';
    const { conectarDB } = await import('../conexionDB');
    const { sembrarDemo } = await import('./datosDemo');
    const { app } = await import('../app');
    await conectarDB();
    const juego = await sembrarDemo();
    servidor = await new Promise<Server>(resolve => {
      const instancia = app.listen(0, '127.0.0.1', () => resolve(instancia));
    });
    const direccion = servidor.address();
    if (!direccion || typeof direccion === 'string') throw new Error('No se pudo determinar el puerto.');
    const ruta = `/api/videojuegos/${juego._id}/resumen`;
    const respuesta = await fetch(`http://127.0.0.1:${direccion.port}${ruta}`);
    const resumen = await respuesta.json() as Record<string, unknown>;
    console.info(`GET ${ruta} → HTTP ${respuesta.status}`);
    console.info(JSON.stringify(resumen, null, 2));
    if (respuesta.status !== 200 || resumen.totalPartidas !== 3 || resumen.horasTotales !== 3.9
      || resumen.ultimaPartida !== '2026-10-22T20:00:00.000Z' || resumen.porcentajeAvanceActual !== 38) {
      throw new Error('El resumen no coincide con las tres partidas de demostración.');
    }
  } finally {
    if (servidor) await new Promise<void>((resolve, reject) => servidor!.close(error => error ? reject(error) : resolve()));
    await mongoose.disconnect();
    await memoria.stop();
  }
}

ejecutar().catch(error => {
  console.error('Falló la verificación de demostración:', error instanceof Error ? error.message : 'error desconocido');
  process.exitCode = 1;
});

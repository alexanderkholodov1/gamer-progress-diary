import mongoose from 'mongoose';
import { conectarDB } from '../conexionDB';
import { sembrarDemo } from './datosDemo';

async function ejecutar() {
  try {
    await conectarDB();
    const juego = await sembrarDemo();
    console.info(`Datos de demostración disponibles. Videojuego: ${juego._id}`);
  } finally {
    await mongoose.disconnect();
  }
}

ejecutar().catch(() => {
  console.error('No se pudo cargar la demostración. Revisa MONGODB_URI y el acceso a MongoDB.');
  process.exitCode = 1;
});

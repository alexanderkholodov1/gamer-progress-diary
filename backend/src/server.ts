import mongoose from 'mongoose';
import { app } from './app';
import { env, validarEntorno } from './config/env';
import { conectarDB } from './conexionDB';

async function iniciar() {
  validarEntorno();
  await conectarDB();
  const servidor = app.listen(env.PORT, '0.0.0.0', () => console.info(`API disponible en el puerto ${env.PORT}.`));
  const detener = () => {
    servidor.close(() => { void mongoose.disconnect().then(() => process.exit(0)); });
  };
  process.once('SIGTERM', detener);
  process.once('SIGINT', detener);
}

iniciar().catch(() => {
  console.error('No se pudo iniciar la API. Revisa las variables de entorno y la conexión a MongoDB.');
  process.exitCode = 1;
});

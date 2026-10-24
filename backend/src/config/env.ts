import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};

export function validarEntorno() {
  if (!env.MONGODB_URI) throw new Error('Configura MONGODB_URI en las variables de entorno.');
  if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
    throw new Error('PORT debe ser un puerto válido.');
  }
  const url = new URL(env.FRONTEND_URL);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL debe ser un origen HTTP o HTTPS sin ruta ni barra final.');
  }
  if (env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('Configura FRONTEND_URL en producción.');
  }
}

import { solicitar } from './cliente';
import type { Filtros, Partida, Resumen, Videojuego, VideojuegoEntrada } from './tipos';

export const videojuegosApi = {
  listar(filtros: Filtros = {}) {
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) if (valor) query.set(clave, valor);
    return solicitar<Videojuego[]>(`/videojuegos?${query.toString()}`);
  },
  obtener: (id: string) => solicitar<Videojuego>(`/videojuegos/${id}`),
  crear: (datos: VideojuegoEntrada) => solicitar<Videojuego>('/videojuegos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id: string, datos: VideojuegoEntrada) => solicitar<Videojuego>(`/videojuegos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminar: (id: string) => solicitar<void>(`/videojuegos/${id}`, { method: 'DELETE' }),
  marcarLogro: (id: string, logroId: string, obtenido: boolean) => solicitar<Videojuego>(`/videojuegos/${id}/logros/${logroId}`, { method: 'PATCH', body: JSON.stringify({ obtenido }) }),
  resumen: (id: string) => solicitar<Resumen>(`/videojuegos/${id}/resumen`),
  partidas: (id: string) => solicitar<Partida[]>(`/videojuegos/${id}/partidas`),
};

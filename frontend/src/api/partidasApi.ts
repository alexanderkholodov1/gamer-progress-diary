import { solicitar } from './cliente';
import type { Partida, PartidaEntrada } from './tipos';

export const partidasApi = {
  listar: () => solicitar<Partida[]>('/partidas'),
  obtener: (id: string) => solicitar<Partida>(`/partidas/${id}`),
  crear: (datos: PartidaEntrada) => solicitar<Partida>('/partidas', { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id: string, datos: Partial<PartidaEntrada>) => solicitar<Partida>(`/partidas/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminar: (id: string) => solicitar<void>(`/partidas/${id}`, { method: 'DELETE' }),
};

import { Link } from 'react-router-dom';
import type { Partida, Videojuego } from '../api/tipos';

export const fechaLegible = (fecha: string | null) => fecha
  ? new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha))
  : 'Sin partidas';

export function PartidasTabla({ partidas, juego, eliminar, ocupado }: {
  partidas: Partida[]; juego?: Videojuego; eliminar?: (id: string) => void; ocupado?: string;
}) {
  return <div className="tabla-scroll"><table><caption className="solo-lector">Historial de partidas ordenado por fecha más reciente</caption><thead><tr>
    <th scope="col">{juego ? 'Sesión' : 'Videojuego'}</th><th scope="col">Duración</th><th scope="col">Avance</th><th scope="col">Notas</th>{eliminar && <th scope="col">Acciones</th>}
  </tr></thead><tbody>{partidas.map(partida => {
    const ficha = typeof partida.videojuego === 'object' ? partida.videojuego : juego;
    return <tr key={partida._id}><td>{!juego && (ficha ? <Link className="enlace-fuerte" to={`/videojuegos/${ficha._id}`}>{ficha.nombre}</Link> : <span>Juego no disponible</span>)}
      <span className={juego ? 'fecha-principal' : 'fecha-secundaria'}>{fechaLegible(partida.fecha)}</span></td>
      <td className="sin-salto">{partida.duracionMinutos} min</td><td><span className="chip neutro">{partida.porcentajeAvance} %</span></td>
      <td className="notas">{partida.notas || 'Sin notas'}</td>{eliminar && <td><button type="button" className="enlace peligro" disabled={!!ocupado}
        aria-label={`Eliminar partida del ${fechaLegible(partida.fecha)}`} onClick={() => eliminar(partida._id)}>{ocupado === partida._id ? 'Eliminando…' : 'Eliminar'}</button></td>}</tr>;
  })}</tbody></table></div>;
}

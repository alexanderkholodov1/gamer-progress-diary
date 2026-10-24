import { Videojuego } from '../models/Videojuego';
import { Partida } from '../models/Partida';

export async function sembrarDemo() {
  let juego = await Videojuego.findOne({ nombre: 'Hollow Knight (demo)' });
  if (!juego) juego = await Videojuego.create({
    nombre: 'Hollow Knight (demo)', plataforma: 'PC', genero: 'accion', estado: 'jugando',
    logros: [{ nombre: 'Encontrar el primer mapa', obtenido: true },
      { nombre: 'Derrotar al Falso Caballero', obtenido: false },
      { nombre: 'Explorar Sendero Verde', obtenido: false }],
  });
  const sesiones = [
    { fecha: '2026-10-20T20:00:00.000Z', duracionMinutos: 60, porcentajeAvance: 12, notas: 'Demo: primer recorrido por Bocasucia.' },
    { fecha: '2026-10-21T20:00:00.000Z', duracionMinutos: 95, porcentajeAvance: 26, notas: 'Demo: exploración de los Cruces Olvidados.' },
    { fecha: '2026-10-22T20:00:00.000Z', duracionMinutos: 80, porcentajeAvance: 38, notas: 'Demo: camino hacia Sendero Verde.' },
  ];
  for (const sesion of sesiones) {
    await Partida.updateOne({ videojuego: juego._id, notas: sesion.notas },
      { $setOnInsert: { ...sesion, videojuego: juego._id } }, { upsert: true, runValidators: true });
  }
  return juego;
}

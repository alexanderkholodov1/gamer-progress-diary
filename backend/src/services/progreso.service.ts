import { Meta } from '../models/Meta';
import { Partida } from '../models/Partida';
import { calcularProgresoSemanal } from '../dominio/progreso';
import { calcularResumen } from '../dominio/resumen';
import { obtener as obtenerVideojuego } from './videojuegos.service';

// El servicio solo consulta datos y delega todo el cálculo a la capa de dominio (spec 01, sección 4).
// D-1: una sola consulta de partidas alimenta el resumen (avance actual) y el progreso.
export async function progresoSemanal(id: string, ahora = new Date()) {
  const juego = await obtenerVideojuego(id);
  const [partidas, meta] = await Promise.all([
    Partida.find(
      { videojuego: juego._id },
      { fecha: 1, duracionMinutos: 1, porcentajeAvance: 1, createdAt: 1 },
    ).lean(),
    Meta.findOne({ videojuego: juego._id, activa: true }).lean(),
  ]);
  const { porcentajeAvanceActual } = calcularResumen(partidas); // avance actual de E1 (RN-11)
  return calcularProgresoSemanal({ partidas, meta, porcentajeAvanceActual, ahora });
}

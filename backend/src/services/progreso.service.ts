import { Meta } from '../models/Meta';
import { Partida } from '../models/Partida';
import { calcularProgresoSemanal } from '../dominio/progreso';
import { obtener as obtenerVideojuego, resumen } from './videojuegos.service';

// El servicio solo consulta datos y delega todo el cálculo a la capa de dominio (spec 01, sección 4).
export async function progresoSemanal(id: string, ahora = new Date()) {
  const juego = await obtenerVideojuego(id);
  const [partidas, meta, { porcentajeAvanceActual }] = await Promise.all([
    Partida.find({ videojuego: juego._id }, { fecha: 1, duracionMinutos: 1 }).lean(),
    Meta.findOne({ videojuego: juego._id, activa: true }).lean(),
    resumen(id), // avance actual del resumen de E1 (RN-11)
  ]);
  return calcularProgresoSemanal({ partidas, meta, porcentajeAvanceActual, ahora });
}

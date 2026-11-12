import { solicitar } from "./cliente";
import type { Meta, MetaCambios, MetaEntrada, ProgresoSemanal } from "./tipos";

// Servicio de la épica E2 (spec 02). Ningún componente llama a fetch directamente.
export const metasApi = {
  crear: (datos: MetaEntrada) =>
    solicitar<Meta>("/metas", { method: "POST", body: JSON.stringify(datos) }),
  obtener: (id: string) => solicitar<Meta>(`/metas/${id}`),
  listarDeVideojuego: (videojuegoId: string, activa?: boolean) =>
    solicitar<Meta[]>(
      `/videojuegos/${videojuegoId}/metas${activa === undefined ? "" : `?activa=${activa}`}`,
    ),
  actualizar: (id: string, datos: MetaCambios) =>
    solicitar<Meta>(`/metas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  desactivar: (id: string) =>
    solicitar<Meta>(`/metas/${id}/desactivar`, { method: "PATCH" }),
  progresoSemanal: (videojuegoId: string) =>
    solicitar<ProgresoSemanal>(`/videojuegos/${videojuegoId}/progreso-semanal`),
};

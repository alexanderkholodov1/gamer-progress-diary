import type { RequestHandler } from 'express';
import * as servicio from '../services/videojuegos.service';

export const listar: RequestHandler = async (req, res) => {
  const filtros: servicio.Filtros = {};
  for (const campo of ['nombre', 'plataforma', 'genero', 'estado'] as const) {
    if (typeof req.query[campo] === 'string') filtros[campo] = req.query[campo];
  }
  res.json(await servicio.listar(filtros));
};
export const obtener: RequestHandler = async (req, res) => {
  res.json(await servicio.obtener(String(req.params.id)));
};
export const crear: RequestHandler = async (req, res) => {
  res.status(201).json(await servicio.crear(req.body));
};
export const actualizar: RequestHandler = async (req, res) => {
  res.json(await servicio.actualizar(String(req.params.id), req.body));
};
export const eliminar: RequestHandler = async (req, res) => {
  await servicio.eliminar(String(req.params.id));
  res.status(204).send();
};
export const actualizarLogro: RequestHandler = async (req, res) => {
  res.json(await servicio.actualizarLogro(String(req.params.id), String(req.params.logroId), req.body));
};
export const partidas: RequestHandler = async (req, res) => {
  res.json(await servicio.listarPartidas(String(req.params.id)));
};
export const resumen: RequestHandler = async (req, res) => {
  res.json(await servicio.resumen(String(req.params.id)));
};

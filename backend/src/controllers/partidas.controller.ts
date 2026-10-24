import type { RequestHandler } from 'express';
import * as servicio from '../services/partidas.service';

export const listar: RequestHandler = async (_req, res) => {
  res.json(await servicio.listar());
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

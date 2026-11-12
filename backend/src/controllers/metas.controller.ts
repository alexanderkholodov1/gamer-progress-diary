import type { RequestHandler } from 'express';
import * as servicio from '../services/metas.service';

export const crear: RequestHandler = async (req, res) => {
  res.status(201).json(await servicio.crear(req.body));
};
export const obtener: RequestHandler = async (req, res) => {
  res.json(await servicio.obtener(String(req.params.id)));
};
export const actualizar: RequestHandler = async (req, res) => {
  res.json(await servicio.actualizar(String(req.params.id), req.body));
};
export const desactivar: RequestHandler = async (req, res) => {
  res.json(await servicio.desactivar(String(req.params.id)));
};
export const listarDeVideojuego: RequestHandler = async (req, res) => {
  res.json(await servicio.listarDeVideojuego(String(req.params.id), req.query.activa));
};

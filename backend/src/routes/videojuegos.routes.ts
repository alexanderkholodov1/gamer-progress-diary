import { Router } from 'express';
import * as controlador from '../controllers/videojuegos.controller';

export const videojuegosRouter = Router();
videojuegosRouter.get('/', controlador.listar);
videojuegosRouter.post('/', controlador.crear);
videojuegosRouter.get('/:id/resumen', controlador.resumen);
videojuegosRouter.get('/:id/partidas', controlador.partidas);
videojuegosRouter.patch('/:id/logros/:logroId', controlador.actualizarLogro);
videojuegosRouter.get('/:id', controlador.obtener);
videojuegosRouter.put('/:id', controlador.actualizar);
videojuegosRouter.patch('/:id', controlador.actualizar);
videojuegosRouter.delete('/:id', controlador.eliminar);

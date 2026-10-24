import { Router } from 'express';
import * as controlador from '../controllers/partidas.controller';

export const partidasRouter = Router();
partidasRouter.get('/', controlador.listar);
partidasRouter.post('/', controlador.crear);
partidasRouter.get('/:id', controlador.obtener);
partidasRouter.put('/:id', controlador.actualizar);
partidasRouter.patch('/:id', controlador.actualizar);
partidasRouter.delete('/:id', controlador.eliminar);

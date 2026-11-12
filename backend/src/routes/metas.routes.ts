import { Router } from 'express';
import * as controlador from '../controllers/metas.controller';

export const metasRouter = Router();
metasRouter.post('/', controlador.crear);
metasRouter.patch('/:id/desactivar', controlador.desactivar);
metasRouter.get('/:id', controlador.obtener);
metasRouter.put('/:id', controlador.actualizar);
metasRouter.patch('/:id', controlador.actualizar);

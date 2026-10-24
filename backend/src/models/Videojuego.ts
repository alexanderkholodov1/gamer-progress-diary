import { Schema, model } from 'mongoose';

export const plataformas = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Movil'] as const;
export const generos = ['accion', 'rol', 'estrategia', 'puzzle', 'deportes', 'otro'] as const;
export const estados = ['jugando', 'pausado', 'completado', 'abandonado'] as const;

const logroSchema = new Schema({
  nombre: { type: String, required: [true, 'El nombre del logro es obligatorio.'], trim: true },
  obtenido: { type: Boolean, required: true, default: false },
});

const videojuegoSchema = new Schema({
  nombre: { type: String, required: [true, 'El nombre del videojuego es obligatorio.'], trim: true },
  plataforma: { type: String, enum: plataformas, required: true },
  genero: { type: String, enum: generos, required: true },
  estado: { type: String, enum: estados, required: true, default: 'jugando' },
  logros: { type: [logroSchema], default: [] },
}, { timestamps: true });

export const Videojuego = model('Videojuego', videojuegoSchema);

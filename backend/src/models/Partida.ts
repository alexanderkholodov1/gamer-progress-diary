import { Schema, model } from 'mongoose';

const partidaSchema = new Schema({
  videojuego: { type: Schema.Types.ObjectId, ref: 'Videojuego', required: true, index: true },
  fecha: { type: Date, required: [true, 'La fecha es obligatoria.'] },
  duracionMinutos: { type: Number, required: true, min: [1, 'La duración mínima es un minuto.'] },
  porcentajeAvance: { type: Number, required: true, min: 0, max: 100 },
  notas: { type: String, trim: true },
}, { timestamps: true });

// Las consultas del historial y del resumen recorren cada juego por fecha descendente.
partidaSchema.index({ videojuego: 1, fecha: -1, createdAt: -1, _id: -1 });

export const Partida = model('Partida', partidaSchema);

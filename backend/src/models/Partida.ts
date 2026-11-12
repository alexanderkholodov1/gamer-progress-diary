import { Schema, model } from 'mongoose';

// D-2 (RN-15): una partida no puede empezar en el futuro. 5 minutos de tolerancia por relojes desfasados.
export const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

const partidaSchema = new Schema(
  {
    videojuego: { type: Schema.Types.ObjectId, ref: 'Videojuego', required: true, index: true },
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria.'],
      validate: {
        validator: (fecha: Date) => fecha.getTime() <= Date.now() + TOLERANCIA_FUTURO_MS,
        message: 'La fecha de la partida no puede estar en el futuro.',
      },
    },
    duracionMinutos: {
      type: Number,
      required: true,
      min: [1, 'La duración mínima es un minuto.'],
      validate: { validator: Number.isFinite, message: 'La duración debe ser un número finito.' },
    },
    porcentajeAvance: { type: Number, required: true, min: 0, max: 100 },
    notas: { type: String, trim: true },
  },
  { timestamps: true },
);

// Las consultas del historial y del resumen recorren cada juego por fecha descendente.
partidaSchema.index({ videojuego: 1, fecha: -1, createdAt: -1, _id: -1 });

export const Partida = model('Partida', partidaSchema);

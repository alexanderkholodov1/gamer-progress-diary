import { Schema, model } from 'mongoose';

export const MAX_HITOS = 5;
export const MAX_HORAS_SEMANALES = 100;

// Los hitos se embeben: lista corta (máx. 5) que solo tiene sentido dentro de su meta.
// Su estado «alcanzado» no se guarda; se calcula con el avance actual (spec 01, RN-11).
const hitoSchema = new Schema({
  descripcion: {
    type: String,
    required: [true, 'La descripción del hito es obligatoria.'],
    trim: true,
    maxlength: [80, 'La descripción del hito admite hasta 80 caracteres.'],
  },
  porcentajeObjetivo: {
    type: Number,
    required: [true, 'El porcentaje objetivo del hito es obligatorio.'],
    min: [1, 'El porcentaje objetivo mínimo es 1.'],
    max: [100, 'El porcentaje objetivo máximo es 100.'],
  },
});

// Meta se referencia: tiene ciclo de vida propio (se crea, edita y desactiva) y un historial por juego.
const metaSchema = new Schema(
  {
    videojuego: { type: Schema.Types.ObjectId, ref: 'Videojuego', required: true },
    horasSemanales: {
      type: Number,
      required: [true, 'Las horas por semana son obligatorias.'],
      validate: {
        validator: (horas: number) => Number.isFinite(horas) && horas > 0 && horas <= MAX_HORAS_SEMANALES,
        message: 'Las horas por semana deben ser mayores que 0 y como máximo 100.',
      },
    },
    diasPorSemana: {
      type: Number,
      required: [true, 'Los días por semana son obligatorios.'],
      min: [1, 'Elige al menos un día por semana.'],
      max: [7, 'Una semana tiene como máximo 7 días.'],
      validate: { validator: Number.isInteger, message: 'Los días por semana deben ser un número entero.' },
    },
    activa: { type: Boolean, default: true },
    hitos: {
      type: [hitoSchema],
      default: [],
      validate: {
        validator: (hitos: unknown) =>
          Array.isArray(hitos) && hitos.length <= MAX_HITOS && hitos.every((hito) => hito !== null),
        message: 'Una meta tiene como máximo 5 hitos.',
      },
    },
  },
  { timestamps: true },
);

// Como máximo una meta activa por videojuego, garantizado también por la base de datos.
metaSchema.index(
  { videojuego: 1 },
  { unique: true, partialFilterExpression: { activa: true }, name: 'una_meta_activa_por_videojuego' },
);
// Historial de metas de un juego, de la más reciente a la más antigua.
metaSchema.index({ videojuego: 1, createdAt: -1 });

export const Meta = model('Meta', metaSchema);

import { useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import { partidasApi } from "../api/partidasApi";
import type { Partida, Videojuego } from "../api/tipos";
import { mensajeError, useCarga } from "../hooks/useCarga";
import { Cargando, Fallo, Vacio } from "../components/Estados";
import { Encabezado } from "../components/Encabezado";

/** Valor de un campo datetime-local en la hora del dispositivo. */
const aCampoLocal = (fecha: Date) =>
  new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const idDeJuego = (partida: Partida) =>
  typeof partida.videojuego === "object" && partida.videojuego
    ? partida.videojuego._id
    : (partida.videojuego ?? "");

// Registra (/partidas/nueva) o edita (/partidas/:id/editar) una partida. Al guardar vuelve al
// detalle del juego, que vuelve a consultar el resumen y el progreso semanal (HU-2.7, T-09).
export function PartidaFormulario() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const seleccionado = parametros.get("videojuego") ?? "";
  const consulta = useCarga(async () => {
    const [juegos, partida] = await Promise.all([
      videojuegosApi.listar(),
      id ? partidasApi.obtener(id) : Promise.resolve(null),
    ]);
    return { juegos, partida };
  }, [id]);
  const titulo = id ? "Editar partida" : "Registrar partida";
  if (consulta.cargando)
    return (
      <Cargando
        texto={
          id
            ? "Cargando la partida…"
            : "Buscando tus videojuegos para registrar la partida…"
        }
      />
    );
  if (consulta.noEncontrado)
    return (
      <Vacio
        titulo="Partida no disponible"
        texto="Puede que se haya eliminado. Vuelve a tu historial para elegir otra."
        accion={
          <Link className="boton" to="/partidas">
            Ir a mis partidas
          </Link>
        }
      />
    );
  if (consulta.error || !consulta.datos)
    return (
      <>
        <Encabezado
          etiqueta="UN PASO MÁS EN TU AVENTURA"
          titulo={titulo}
          texto="Elige tu juego y registra tu sesión."
        />
        <Fallo mensaje={consulta.error} reintentar={consulta.recargar} />
      </>
    );
  if (!consulta.datos.juegos.length)
    return (
      <Vacio
        titulo="Primero necesitas un videojuego"
        texto="Añade un juego a tu biblioteca y después registra tu primera sesión."
        accion={
          <Link className="boton" to="/videojuegos/nuevo">
            Crear videojuego
          </Link>
        }
      />
    );
  return (
    <Formulario
      key={id ?? seleccionado}
      juegos={consulta.datos.juegos}
      seleccionado={seleccionado}
      inicial={consulta.datos.partida}
    />
  );
}

function Formulario({
  juegos,
  seleccionado,
  inicial,
}: {
  juegos: Videojuego[];
  seleccionado: string;
  inicial: Partida | null;
}) {
  const navegar = useNavigate();
  const juegoInicial = inicial
    ? idDeJuego(inicial)
    : (juegos.find((juego) => juego._id === seleccionado)?._id ?? "");
  const [videojuego, setVideojuego] = useState(juegoInicial);
  const [fecha, setFecha] = useState(() =>
    aCampoLocal(inicial ? new Date(inicial.fecha) : new Date()),
  );
  const [minutos, setMinutos] = useState(
    inicial ? String(inicial.duracionMinutos) : "",
  );
  const [avance, setAvance] = useState(
    inicial ? String(inicial.porcentajeAvance) : "",
  );
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const volver = juegoInicial ? `/videojuegos/${juegoInicial}` : "/partidas";
  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");
    const instante = new Date(fecha);
    if (
      !videojuego ||
      !fecha ||
      Number.isNaN(instante.getTime()) ||
      !minutos ||
      Number(minutos) < 1 ||
      !avance ||
      Number(avance) < 0 ||
      Number(avance) > 100
    ) {
      setError(
        "Elige un videojuego, una fecha válida, al menos un minuto y un avance de 0 a 100.",
      );
      return;
    }
    setGuardando(true);
    const datos = {
      videojuego,
      fecha: instante.toISOString(),
      duracionMinutos: Number(minutos),
      porcentajeAvance: Number(avance),
      notas: notas.trim(),
    };
    try {
      if (inicial) await partidasApi.actualizar(inicial._id, datos);
      else await partidasApi.crear(datos);
      navegar(`/videojuegos/${videojuego}`);
    } catch (fallo) {
      setError(mensajeError(fallo));
      setGuardando(false);
    }
  };
  return (
    <>
      <Link className="volver" to={volver}>
        ← {juegoInicial ? "Volver al videojuego" : "Mis partidas"}
      </Link>
      <Encabezado
        etiqueta="UN PASO MÁS EN TU AVENTURA"
        titulo={inicial ? "Editar partida" : "Registrar partida"}
        texto={
          inicial
            ? "Corrige la fecha, el tiempo o el avance de esta sesión."
            : "Guarda el tiempo que dedicaste y el avance con el que terminaste."
        }
      />
      <form
        className="panel formulario"
        onSubmit={(evento) => void guardar(evento)}
      >
        <fieldset disabled={guardando}>
          <legend>¿Cómo fue tu sesión?</legend>
          <p className="ayuda">Los campos marcados con * son obligatorios.</p>
          <label>
            Videojuego *
            <select
              required
              value={videojuego}
              onChange={(e) => setVideojuego(e.target.value)}
            >
              <option value="">Selecciona un videojuego</option>
              {juegos.map((juego) => (
                <option key={juego._id} value={juego._id}>
                  {juego.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha y hora de inicio *
            <input
              required
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <span className="ayuda">
              La hora corresponde a la zona horaria de tu dispositivo. Si la
              sesión pasó de medianoche, cuenta en el día en que empezó.
            </span>
          </label>
          <div className="form-grid">
            <label>
              Duración en minutos *
              <input
                required
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 60"
                value={minutos}
                onChange={(e) => setMinutos(e.target.value)}
              />
            </label>
            <label>
              Avance al terminar (%) *
              <input
                required
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="De 0 a 100"
                value={avance}
                onChange={(e) => setAvance(e.target.value)}
              />
            </label>
          </div>
          <label>
            Notas de la sesión
            <textarea
              rows={4}
              placeholder="¿Qué descubriste? ¿Qué reto te espera?"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </label>
        </fieldset>
        <div className="aviso informativo">
          Al guardar volverás al videojuego para ver su resumen y tu semana
          actualizados.
        </div>
        {error && <Fallo mensaje={error} />}
        <div className="form-pie">
          <Link className="boton secundario" to={volver}>
            Cancelar
          </Link>
          <button className="boton" type="submit" disabled={guardando}>
            {guardando
              ? "Guardando…"
              : inicial
                ? "Guardar cambios"
                : "Guardar partida"}
          </button>
        </div>
      </form>
    </>
  );
}

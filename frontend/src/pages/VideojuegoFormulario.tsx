import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import {
  estados,
  generos,
  plataformas,
  etiquetas,
  type Videojuego,
  type VideojuegoEntrada,
} from "../api/tipos";
import { mensajeError, useCarga } from "../hooks/useCarga";
import { Cargando, Fallo, Vacio } from "../components/Estados";
import { Encabezado } from "../components/Encabezado";

export function VideojuegoFormulario() {
  const { id } = useParams();
  const consulta = useCarga(
    () => (id ? videojuegosApi.obtener(id) : Promise.resolve(null)),
    [id],
  );
  if (consulta.cargando)
    return (
      <Cargando
        texto={
          id ? "Cargando la ficha del videojuego…" : "Preparando el formulario…"
        }
      />
    );
  if (consulta.error)
    return (
      <>
        <Link className="volver" to="/videojuegos">
          ← Mi biblioteca
        </Link>
        <Fallo mensaje={consulta.error} reintentar={consulta.recargar} />
      </>
    );
  if (id && !consulta.datos)
    return (
      <Vacio
        titulo="Videojuego no disponible"
        texto="Elige otro desde tu biblioteca."
        accion={
          <Link to="/videojuegos" className="boton">
            Ir a mi biblioteca
          </Link>
        }
      />
    );
  return (
    <Formulario key={id ?? "nuevo"} inicial={consulta.datos ?? undefined} />
  );
}

function Formulario({ inicial }: { inicial?: Videojuego }) {
  const navegar = useNavigate();
  const [datos, setDatos] = useState<VideojuegoEntrada>(() =>
    inicial
      ? {
          nombre: inicial.nombre,
          plataforma: inicial.plataforma,
          genero: inicial.genero,
          estado: inicial.estado,
          logros: inicial.logros.map((logro) => ({ ...logro })),
        }
      : {
          nombre: "",
          plataforma: "PC",
          genero: "accion",
          estado: "jugando",
          logros: [],
        },
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const volver = inicial ? `/videojuegos/${inicial._id}` : "/videojuegos";
  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");
    if (!datos.nombre.trim()) {
      setError("Escribe el nombre del videojuego.");
      return;
    }
    if (datos.logros.some((logro) => !logro.nombre.trim())) {
      setError("Escribe el nombre de cada logro o elimina las filas vacías.");
      return;
    }
    setGuardando(true);
    const entrada = {
      ...datos,
      nombre: datos.nombre.trim(),
      logros: datos.logros.map((logro) => ({
        ...logro,
        nombre: logro.nombre.trim(),
      })),
    };
    try {
      const juego = inicial
        ? await videojuegosApi.actualizar(inicial._id, entrada)
        : await videojuegosApi.crear(entrada);
      navegar(`/videojuegos/${juego._id}`);
    } catch (fallo) {
      setError(mensajeError(fallo));
      setGuardando(false);
    }
  };
  return (
    <>
      <Link className="volver" to={volver}>
        ← {inicial ? "Volver al videojuego" : "Mi biblioteca"}
      </Link>
      <Encabezado
        etiqueta="DALE UN LUGAR A TU PRÓXIMA AVENTURA"
        titulo={inicial ? "Editar videojuego" : "Nuevo videojuego"}
        texto={
          inicial
            ? "Actualiza su ficha y las metas que quieres conseguir."
            : "Añade un juego a tu biblioteca. El progreso lo irás construyendo partida a partida."
        }
      />
      <form
        className="panel formulario"
        onSubmit={(evento) => void guardar(evento)}
      >
        <fieldset disabled={guardando}>
          <legend>La ficha del juego</legend>
          <p className="ayuda">Los campos marcados con * son obligatorios.</p>
          <label>
            Nombre del videojuego *
            <input
              name="nombre"
              required
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              placeholder="Ej. Hollow Knight"
              autoComplete="off"
            />
          </label>
          <div className="form-grid">
            <label>
              Plataforma *
              <select
                name="plataforma"
                value={datos.plataforma}
                onChange={(e) =>
                  setDatos({
                    ...datos,
                    plataforma: e.target
                      .value as VideojuegoEntrada["plataforma"],
                  })
                }
              >
                {plataformas.map((valor) => (
                  <option key={valor} value={valor}>
                    {etiquetas[valor]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Género *
              <select
                name="genero"
                value={datos.genero}
                onChange={(e) =>
                  setDatos({
                    ...datos,
                    genero: e.target.value as VideojuegoEntrada["genero"],
                  })
                }
              >
                {generos.map((valor) => (
                  <option key={valor} value={valor}>
                    {etiquetas[valor]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Estado *
            <select
              name="estado"
              value={datos.estado}
              onChange={(e) =>
                setDatos({
                  ...datos,
                  estado: e.target.value as VideojuegoEntrada["estado"],
                })
              }
            >
              {estados.map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetas[valor]}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <fieldset disabled={guardando} className="logros-form">
          <legend>Pequeñas metas, grandes logros</legend>
          <p className="ayuda">
            Opcional. Define los logros propios de este juego; podrás marcarlos
            desde su detalle.
          </p>
          {datos.logros.length === 0 && (
            <p className="vacio-inline">
              Todavía no has añadido logros. Puedes hacerlo ahora o más
              adelante.
            </p>
          )}
          {datos.logros.map((logro, indice) => (
            <div className="logro-fila" key={logro._id ?? indice}>
              <label>
                Logro {indice + 1}
                <input
                  required
                  value={logro.nombre}
                  placeholder="Ej. Derrotar al primer jefe"
                  onChange={(e) =>
                    setDatos({
                      ...datos,
                      logros: datos.logros.map((actual, i) =>
                        i === indice
                          ? { ...actual, nombre: e.target.value }
                          : actual,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="enlace peligro"
                type="button"
                aria-label={`Quitar logro ${indice + 1}`}
                onClick={() =>
                  setDatos({
                    ...datos,
                    logros: datos.logros.filter((_, i) => i !== indice),
                  })
                }
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            className="boton secundario"
            type="button"
            onClick={() =>
              setDatos({
                ...datos,
                logros: [...datos.logros, { nombre: "", obtenido: false }],
              })
            }
          >
            ＋ Añadir logro
          </button>
        </fieldset>
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
                : "Crear videojuego"}
          </button>
        </div>
      </form>
    </>
  );
}

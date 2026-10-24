import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import { partidasApi } from "../api/partidasApi";
import { etiquetas } from "../api/tipos";
import { mensajeError, useCarga } from "../hooks/useCarga";
import { Encabezado } from "../components/Encabezado";
import { Cargando, Fallo, Vacio } from "../components/Estados";
import { fechaLegible, PartidasTabla } from "../components/PartidasTabla";

export function VideojuegoDetalle() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const [ocupado, setOcupado] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const consulta = useCarga(async () => {
    const [juego, resumen, partidas] = await Promise.all([
      videojuegosApi.obtener(id),
      videojuegosApi.resumen(id),
      videojuegosApi.partidas(id),
    ]);
    return { juego, resumen, partidas };
  }, [id]);
  const marcarLogro = async (logroId: string, obtenido: boolean) => {
    const anterior = consulta.datos?.juego;
    setOcupado(logroId);
    setErrorAccion("");
    // Respuesta inmediata del control; se revierte si el servidor rechaza el cambio.
    consulta.setDatos((actual) =>
      actual && actual.juego._id === id
        ? {
            ...actual,
            juego: {
              ...actual.juego,
              logros: actual.juego.logros.map((logro) =>
                logro._id === logroId ? { ...logro, obtenido } : logro,
              ),
            },
          }
        : actual,
    );
    try {
      const juego = await videojuegosApi.marcarLogro(id, logroId, obtenido);
      consulta.setDatos((actual) =>
        actual && actual.juego._id === id ? { ...actual, juego } : actual,
      );
    } catch (error) {
      if (anterior)
        consulta.setDatos((actual) =>
          actual && actual.juego._id === id
            ? { ...actual, juego: anterior }
            : actual,
        );
      setErrorAccion(mensajeError(error));
    } finally {
      setOcupado("");
    }
  };
  const eliminarJuego = async () => {
    if (
      !window.confirm(
        "¿Eliminar este videojuego y todas sus partidas? Esta acción no se puede deshacer.",
      )
    )
      return;
    setOcupado("juego");
    setErrorAccion("");
    try {
      await videojuegosApi.eliminar(id);
      navegar("/videojuegos");
    } catch (error) {
      setErrorAccion(mensajeError(error));
      setOcupado("");
    }
  };
  const eliminarPartida = async (partidaId: string) => {
    if (!window.confirm("¿Eliminar esta partida? El resumen se actualizará."))
      return;
    setOcupado(partidaId);
    setErrorAccion("");
    try {
      await partidasApi.eliminar(partidaId);
      consulta.recargar();
    } catch (error) {
      setErrorAccion(mensajeError(error));
    } finally {
      setOcupado("");
    }
  };
  if (consulta.cargando) return <Cargando texto="Preparando tu progreso…" />;
  if (consulta.error)
    return (
      <>
        <Link className="volver" to="/videojuegos">
          ← Volver a mi biblioteca
        </Link>
        <Fallo mensaje={consulta.error} reintentar={consulta.recargar} />
      </>
    );
  if (!consulta.datos)
    return (
      <Vacio
        titulo="Videojuego no disponible"
        texto="Vuelve a la biblioteca para elegir otro juego."
        accion={
          <Link to="/videojuegos" className="boton">
            Ir a mi biblioteca
          </Link>
        }
      />
    );
  const { juego, resumen, partidas } = consulta.datos;
  return (
    <>
      <Link className="volver" to="/videojuegos">
        ← Mi biblioteca
      </Link>
      <Encabezado
        etiqueta="EL REGISTRO DE TU AVENTURA"
        titulo={juego.nombre}
        texto={`${etiquetas[juego.plataforma]} · ${etiquetas[juego.genero]}`}
        accion={
          <>
            <Link className="boton secundario" to={`/videojuegos/${id}/editar`}>
              Editar juego
            </Link>
            <Link className="boton" to={`/partidas/nueva?videojuego=${id}`}>
              + Registrar partida
            </Link>
          </>
        }
      />
      <span className={`chip ${juego.estado}`}>{etiquetas[juego.estado]}</span>
      {errorAccion && <Fallo mensaje={errorAccion} />}
      <section className="resumen-panel" aria-labelledby="titulo-resumen">
        <div className="titulo-seccion">
          <div>
            <p className="ceja">CADA SESIÓN CUENTA</p>
            <h2 id="titulo-resumen">Tu progreso, al día</h2>
          </div>
          <span className="etiqueta-clara">Resumen de partidas</span>
        </div>
        <dl className="resumen-grid">
          <div>
            <dt>Partidas registradas</dt>
            <dd>{resumen.totalPartidas}</dd>
          </div>
          <div>
            <dt>Horas totales</dt>
            <dd>
              {resumen.horasTotales.toFixed(1)}
              <span> h</span>
            </dd>
          </div>
          <div>
            <dt>Avance actual</dt>
            <dd>
              {resumen.porcentajeAvanceActual}
              <span> %</span>
            </dd>
            <progress
              value={resumen.porcentajeAvanceActual}
              max={100}
              aria-label="Porcentaje de avance actual"
            />
          </div>
          <div>
            <dt>Última partida</dt>
            <dd className="fecha-resumen">
              {fechaLegible(resumen.ultimaPartida)}
            </dd>
          </div>
        </dl>
        <p className="nota-resumen">
          El avance corresponde a tu sesión más reciente.{" "}
          {resumen.totalPartidas === 0
            ? "Registra tu primera partida para empezar."
            : "Los tiempos suman todas tus partidas."}
        </p>
      </section>
      <section className="panel logros-panel" aria-labelledby="titulo-logros">
        <div className="titulo-seccion">
          <h2 id="titulo-logros">Logros de esta aventura</h2>
          <span className="contador">
            {juego.logros.filter((logro) => logro.obtenido).length} /{" "}
            {juego.logros.length}
          </span>
        </div>
        {juego.logros.length ? (
          <ul className="logros-lista">
            {juego.logros.map((logro) => (
              <li key={logro._id}>
                <label className={`logro ${logro.obtenido ? "obtenido" : ""}`}>
                  <input
                    type="checkbox"
                    checked={logro.obtenido}
                    disabled={!!ocupado}
                    onChange={(e) =>
                      void marcarLogro(logro._id, e.target.checked)
                    }
                  />
                  <span>
                    {logro.nombre}
                    <small>
                      {ocupado === logro._id
                        ? "Guardando…"
                        : logro.obtenido
                          ? "Obtenido"
                          : "Por conseguir"}
                    </small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio
            titulo="Hay metas por descubrir"
            texto="Añade logros desde la edición de este juego."
            accion={
              <Link
                className="boton secundario"
                to={`/videojuegos/${id}/editar`}
              >
                Añadir logros
              </Link>
            }
          />
        )}
      </section>
      <section
        className="panel historial-panel"
        aria-labelledby="titulo-historial"
      >
        <div className="titulo-seccion">
          <h2 id="titulo-historial">Tus partidas</h2>
          <span className="contador">{partidas.length} sesiones</span>
        </div>
        {partidas.length ? (
          <PartidasTabla
            partidas={partidas}
            juego={juego}
            eliminar={eliminarPartida}
            ocupado={ocupado}
          />
        ) : (
          <Vacio
            titulo="Tu primera sesión te espera"
            texto="Registra cuándo jugaste, cuántos minutos y tu avance al terminar."
            accion={
              <Link className="boton" to={`/partidas/nueva?videojuego=${id}`}>
                Registrar primera partida
              </Link>
            }
          />
        )}
      </section>
      <div className="zona-eliminar">
        <p>¿Este juego ya no forma parte de tu biblioteca?</p>
        <button
          className="enlace peligro"
          type="button"
          disabled={!!ocupado}
          onClick={() => void eliminarJuego()}
        >
          {ocupado === "juego"
            ? "Eliminando…"
            : "Eliminar videojuego y sus partidas"}
        </button>
      </div>
    </>
  );
}

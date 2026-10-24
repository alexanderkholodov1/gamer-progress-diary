import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import {
  estados,
  plataformas,
  generos,
  etiquetas,
  type Filtros,
} from "../api/tipos";
import { useCarga } from "../hooks/useCarga";
import { Encabezado } from "../components/Encabezado";
import { Cargando, Fallo, Vacio } from "../components/Estados";

export function VideojuegosLista() {
  const [borrador, setBorrador] = useState<Filtros>({
    nombre: "",
    estado: "",
    plataforma: "",
    genero: "",
  });
  const [filtros, setFiltros] = useState<Filtros>({});
  const consulta = useCarga(() => videojuegosApi.listar(filtros), [filtros]);
  const filtrado = Object.values(filtros).some(Boolean);
  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setFiltros({ ...borrador, nombre: borrador.nombre?.trim() });
  };
  const limpiar = () => {
    setBorrador({ nombre: "", estado: "", plataforma: "", genero: "" });
    setFiltros({});
  };
  return (
    <>
      <Encabezado
        etiqueta="TU ESPACIO DE JUEGO"
        titulo="Mi biblioteca"
        texto="Cada juego tiene una historia. Lleva el registro de la tuya."
        accion={
          <Link className="boton" to="/videojuegos/nuevo">
            <span aria-hidden="true">＋</span> Nuevo videojuego
          </Link>
        }
      />
      <div className="franja">
        <div className="franja-icono" aria-hidden="true">
          ✦
        </div>
        <div>
          <strong>Una partida más, un poco más lejos.</strong>
          <p>Registra tus sesiones y descubre cómo avanza tu aventura.</p>
        </div>
        <Link className="enlace-fuerte" to="/partidas/nueva">
          Registrar partida <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <section className="panel filtros-panel" aria-label="Filtrar videojuegos">
        <form onSubmit={aplicar} className="filtros">
          <label className="busqueda">
            Buscar videojuego
            <input
              type="search"
              placeholder="Nombre del videojuego…"
              value={borrador.nombre}
              onChange={(e) =>
                setBorrador({ ...borrador, nombre: e.target.value })
              }
            />
          </label>
          <label>
            Estado
            <select
              value={borrador.estado}
              onChange={(e) =>
                setBorrador({ ...borrador, estado: e.target.value })
              }
            >
              <option value="">Todos los estados</option>
              {estados.map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetas[valor]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Plataforma
            <select
              value={borrador.plataforma}
              onChange={(e) =>
                setBorrador({ ...borrador, plataforma: e.target.value })
              }
            >
              <option value="">Todas</option>
              {plataformas.map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetas[valor]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Género
            <select
              value={borrador.genero}
              onChange={(e) =>
                setBorrador({ ...borrador, genero: e.target.value })
              }
            >
              <option value="">Todos</option>
              {generos.map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetas[valor]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="boton secundario">
            Filtrar
          </button>
          {filtrado && (
            <button type="button" className="enlace" onClick={limpiar}>
              Limpiar
            </button>
          )}
        </form>
      </section>
      <div className="titulo-seccion">
        <h2>{filtrado ? "Resultados de tu búsqueda" : "Tus videojuegos"}</h2>
        {!consulta.cargando && consulta.datos && (
          <span className="contador">
            {consulta.datos.length}{" "}
            {consulta.datos.length === 1 ? "juego" : "juegos"}
          </span>
        )}
      </div>
      {consulta.cargando ? (
        <Cargando texto="Buscando tus videojuegos…" />
      ) : consulta.error ? (
        <Fallo mensaje={consulta.error} reintentar={consulta.recargar} />
      ) : !consulta.datos?.length ? (
        <Vacio
          titulo={
            filtrado
              ? "No encontramos videojuegos"
              : "Tu aventura comienza aquí"
          }
          texto={
            filtrado
              ? "Prueba con otro nombre o cambia los filtros."
              : "Añade tu primer videojuego para empezar a registrar tu progreso."
          }
          accion={
            filtrado ? (
              <button className="boton secundario" onClick={limpiar}>
                Limpiar filtros
              </button>
            ) : (
              <Link className="boton" to="/videojuegos/nuevo">
                Añadir mi primer juego
              </Link>
            )
          }
        />
      ) : (
        <div className="juegos-grid">
          {consulta.datos.map((juego, indice) => (
            <article className="juego-card" key={juego._id}>
              <div className={`juego-identidad tono-${indice % 4}`}>
                <span aria-hidden="true" className="monograma">
                  {juego.nombre.slice(0, 2).toUpperCase()}
                </span>
                <span className={`chip ${juego.estado}`}>
                  {etiquetas[juego.estado]}
                </span>
              </div>
              <div className="juego-contenido">
                <p className="metadatos">
                  {etiquetas[juego.plataforma]}
                  <span aria-hidden="true"> · </span>
                  {etiquetas[juego.genero]}
                </p>
                <h3>
                  <Link to={`/videojuegos/${juego._id}`}>{juego.nombre}</Link>
                </h3>
                <p className="detalle-suave">
                  {juego.logros.filter((logro) => logro.obtenido).length} de{" "}
                  {juego.logros.length} logros obtenidos
                </p>
                <Link className="ver-juego" to={`/videojuegos/${juego._id}`}>
                  Ver mi progreso <span aria-hidden="true">→</span>
                  <span className="solo-lector"> en {juego.nombre}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

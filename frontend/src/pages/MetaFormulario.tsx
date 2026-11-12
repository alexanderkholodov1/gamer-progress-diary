import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import { metasApi } from "../api/metasApi";
import type { HitoEntrada, Meta, Videojuego } from "../api/tipos";
import { mensajeError, useCarga } from "../hooks/useCarga";
import { Cargando, Fallo, Vacio } from "../components/Estados";
import { Encabezado } from "../components/Encabezado";

const MAX_HITOS = 5;
interface HitoBorrador {
  clave: string;
  descripcion: string;
  porcentajeObjetivo: string;
}
let contador = 0;
const nuevaClave = () => `hito-${++contador}`;

// Crea la meta del juego si no tiene una activa, o edita la activa (HU-2.1, HU-2.2, T-10).
export function MetaFormulario() {
  const { id = "" } = useParams();
  const consulta = useCarga(async () => {
    const [juego, activas] = await Promise.all([
      videojuegosApi.obtener(id),
      metasApi.listarDeVideojuego(id, true),
    ]);
    return { juego, meta: activas[0] ?? null };
  }, [id]);
  if (consulta.cargando) return <Cargando texto="Preparando tu meta…" />;
  if (consulta.noEncontrado)
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
  if (consulta.error || !consulta.datos)
    return (
      <>
        <Link className="volver" to={`/videojuegos/${id}`}>
          ← Volver al videojuego
        </Link>
        <Fallo mensaje={consulta.error} reintentar={consulta.recargar} />
      </>
    );
  const { juego, meta } = consulta.datos;
  if (!meta && !["jugando", "pausado"].includes(juego.estado))
    return (
      <Vacio
        titulo="Este juego no admite metas"
        texto={`${juego.nombre} está ${juego.estado}. Cámbialo a «jugando» o «pausado» si quieres volver a fijarte una meta.`}
        accion={
          <Link className="boton secundario" to={`/videojuegos/${id}`}>
            Volver al videojuego
          </Link>
        }
      />
    );
  return <Formulario key={meta?._id ?? "nueva"} juego={juego} meta={meta} />;
}

function Formulario({ juego, meta }: { juego: Videojuego; meta: Meta | null }) {
  const navegar = useNavigate();
  const [horas, setHoras] = useState(meta ? String(meta.horasSemanales) : "");
  const [dias, setDias] = useState(meta ? String(meta.diasPorSemana) : "3");
  const [hitos, setHitos] = useState<HitoBorrador[]>(() =>
    // DR-4: mismo orden que el progreso (RN-02), de menor a mayor objetivo.
    [...(meta?.hitos ?? [])]
      .sort((a, b) => a.porcentajeObjetivo - b.porcentajeObjetivo)
      .map((hito) => ({
        clave: hito._id,
        descripcion: hito.descripcion,
        porcentajeObjetivo: String(hito.porcentajeObjetivo),
      })),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const volver = `/videojuegos/${juego._id}`;

  const cambiarHito = (clave: string, cambios: Partial<HitoBorrador>) =>
    setHitos((actuales) =>
      actuales.map((hito) =>
        hito.clave === clave ? { ...hito, ...cambios } : hito,
      ),
    );

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");
    const horasSemanales = Number(horas);
    const diasPorSemana = Number(dias);
    if (!horas || !(horasSemanales > 0 && horasSemanales <= 100)) {
      setError(
        "Escribe cuántas horas quieres jugar por semana: más de 0 y hasta 100.",
      );
      return;
    }
    if (
      !Number.isInteger(diasPorSemana) ||
      diasPorSemana < 1 ||
      diasPorSemana > 7
    ) {
      setError("Elige de 1 a 7 días por semana.");
      return;
    }
    const entradas: HitoEntrada[] = hitos.map((hito) => ({
      descripcion: hito.descripcion.trim(),
      porcentajeObjetivo: Number(hito.porcentajeObjetivo),
    }));
    if (
      entradas.some(
        (hito) =>
          !hito.descripcion ||
          !(hito.porcentajeObjetivo >= 1 && hito.porcentajeObjetivo <= 100),
      )
    ) {
      setError(
        "Cada hito necesita una descripción y un objetivo de 1 a 100 %. Completa o quita las filas vacías.",
      );
      return;
    }
    setGuardando(true);
    try {
      if (meta)
        await metasApi.actualizar(meta._id, {
          horasSemanales,
          diasPorSemana,
          hitos: entradas,
        });
      else
        await metasApi.crear({
          videojuego: juego._id,
          horasSemanales,
          diasPorSemana,
          hitos: entradas,
        });
      navegar(volver);
    } catch (fallo) {
      // Por ejemplo, la meta duplicada (409) llega con un mensaje claro desde la API.
      setError(mensajeError(fallo));
      setGuardando(false);
    }
  };

  return (
    <>
      <Link className="volver" to={volver}>
        ← Volver a {juego.nombre}
      </Link>
      <Encabezado
        etiqueta="TU COMPROMISO DE LA SEMANA"
        titulo={meta ? "Editar meta semanal" : "Nueva meta semanal"}
        texto={
          meta
            ? `Ajusta tu meta para ${juego.nombre}. El progreso de esta semana se calculará con los nuevos valores.`
            : `¿Cuánto quieres jugar ${juego.nombre} cada semana? Mediremos tus horas, tus días y tu racha.`
        }
      />
      <form
        className="panel formulario meta-form"
        onSubmit={(evento) => void guardar(evento)}
        noValidate
      >
        <fieldset disabled={guardando}>
          <legend>Tu meta</legend>
          <p className="ayuda">
            La semana va de lunes a domingo. Los campos con * son obligatorios.
          </p>
          <div className="form-grid">
            <label>
              Horas por semana *
              <input
                required
                type="number"
                inputMode="decimal"
                min="0.5"
                max="100"
                step="0.5"
                placeholder="Ej. 5"
                value={horas}
                aria-describedby="ayuda-horas"
                onChange={(e) => setHoras(e.target.value)}
              />
              <span id="ayuda-horas" className="campo-ayuda">
                Más de 0 y hasta 100 horas. Puedes usar medias horas.
              </span>
            </label>
            <label>
              Días por semana *
              <select
                required
                value={dias}
                aria-describedby="ayuda-dias"
                onChange={(e) => setDias(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "día" : "días"}
                  </option>
                ))}
              </select>
              <span id="ayuda-dias" className="campo-ayuda">
                Varias partidas el mismo día cuentan como un día.
              </span>
            </label>
          </div>
        </fieldset>
        <fieldset disabled={guardando} className="hitos-form">
          <legend>Hitos de avance</legend>
          <p className="ayuda">
            Opcional, hasta {MAX_HITOS}. Un hito se alcanza solo cuando el
            avance de tu partida más reciente llega a su objetivo.
          </p>
          {hitos.length === 0 && (
            <p className="vacio-inline">
              Sin hitos por ahora. Por ejemplo: «Llegar al 50 %».
            </p>
          )}
          {hitos.map((hito, indice) => (
            <div className="hito-fila" key={hito.clave}>
              <label>
                Hito {indice + 1}
                <input
                  required
                  maxLength={80}
                  placeholder="Ej. Llegar al 50 %"
                  value={hito.descripcion}
                  onChange={(e) =>
                    cambiarHito(hito.clave, { descripcion: e.target.value })
                  }
                />
              </label>
              <label>
                Objetivo (%)
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="1 a 100"
                  value={hito.porcentajeObjetivo}
                  onChange={(e) =>
                    cambiarHito(hito.clave, {
                      porcentajeObjetivo: e.target.value,
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="enlace peligro"
                aria-label={`Quitar hito ${indice + 1}`}
                onClick={() =>
                  setHitos((actuales) =>
                    actuales.filter((h) => h.clave !== hito.clave),
                  )
                }
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="boton secundario"
            disabled={hitos.length >= MAX_HITOS}
            onClick={() =>
              setHitos((actuales) => [
                ...actuales,
                {
                  clave: nuevaClave(),
                  descripcion: "",
                  porcentajeObjetivo: "",
                },
              ])
            }
          >
            + Añadir hito
          </button>
          {hitos.length >= MAX_HITOS && (
            <p className="campo-ayuda">
              Llegaste al máximo de {MAX_HITOS} hitos.
            </p>
          )}
        </fieldset>
        {error && <Fallo mensaje={error} />}
        <div className="form-pie">
          <Link className="boton secundario" to={volver}>
            Cancelar
          </Link>
          <button className="boton" type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : meta ? "Guardar cambios" : "Crear meta"}
          </button>
        </div>
      </form>
    </>
  );
}

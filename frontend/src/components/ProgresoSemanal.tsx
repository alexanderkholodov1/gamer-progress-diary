import { useState } from "react";
import { Link } from "react-router-dom";
import { metasApi } from "../api/metasApi";
import type { Estado, HitoEvaluado } from "../api/tipos";
import { mensajeError, useCarga } from "../hooks/useCarga";
import { Cargando, Fallo } from "./Estados";
import { ConfirmacionEnLinea } from "./ConfirmacionEnLinea";

const numero = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 1 });
const mes = new Intl.DateTimeFormat("es-EC", {
  month: "short",
  timeZone: "UTC",
});
const aFecha = (dia: string) => new Date(`${dia}T12:00:00Z`);
const plural = (n: number, uno: string, varios: string) =>
  n === 1 ? uno : varios;

/** «Semana del 9 al 15 de nov.» o «Semana del 30 de nov. al 6 de dic.» (fechas ya calculadas por la API). */
export function rangoSemana({ inicio, fin }: { inicio: string; fin: string }) {
  const [desde, hasta] = [aFecha(inicio), aFecha(fin)];
  const mesDesde = mes.format(desde);
  const mesHasta = mes.format(hasta);
  return mesDesde === mesHasta
    ? `Semana del ${desde.getUTCDate()} al ${hasta.getUTCDate()} de ${mesHasta}`
    : `Semana del ${desde.getUTCDate()} de ${mesDesde} al ${hasta.getUTCDate()} de ${mesHasta}`;
}

function IconoHito({ alcanzado }: { alcanzado: boolean }) {
  return (
    <svg className="hito-icono" viewBox="0 0 20 20" aria-hidden="true">
      {alcanzado ? (
        <path
          d="M5 10.5l3.2 3.2L15 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <circle
          cx="10"
          cy="10"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 2.5"
        />
      )}
    </svg>
  );
}

function Hitos({ hitos }: { hitos: HitoEvaluado[] }) {
  if (!hitos.length)
    return (
      <p className="vacio-inline">
        Tu meta no tiene hitos. Puedes añadirlos al editarla.
      </p>
    );
  return (
    <ul className="hitos-lista">
      {hitos.map((hito) => (
        <li
          key={`${hito.porcentajeObjetivo}-${hito.descripcion}`}
          className={`hito ${hito.alcanzado ? "alcanzado" : "pendiente"}`}
        >
          <IconoHito alcanzado={hito.alcanzado} />
          <span className="hito-texto">
            {hito.descripcion}
            <small>Objetivo: {hito.porcentajeObjetivo} % de avance</small>
          </span>
          <span className="hito-estado">
            {hito.alcanzado ? "Alcanzado" : "Pendiente"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProgresoSemanal({
  videojuegoId,
  estadoJuego,
  revision,
}: {
  videojuegoId: string;
  estadoJuego: Estado;
  revision: number;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const consulta = useCarga(async () => {
    const [progreso, activas] = await Promise.all([
      metasApi.progresoSemanal(videojuegoId),
      metasApi.listarDeVideojuego(videojuegoId, true),
    ]);
    return { progreso, metaActiva: activas[0] ?? null };
  }, [videojuegoId, revision]);

  const desactivar = async (metaId: string) => {
    setDesactivando(true);
    setErrorAccion("");
    try {
      await metasApi.desactivar(metaId);
      setConfirmando(false);
      consulta.recargar();
    } catch (error) {
      setErrorAccion(mensajeError(error));
    } finally {
      setDesactivando(false);
    }
  };

  const encabezado = (ceja: string) => (
    <div className="titulo-seccion">
      <div>
        <p className="ceja">{ceja}</p>
        <h2 id="titulo-progreso">Tu semana de juego</h2>
      </div>
    </div>
  );

  if (consulta.cargando)
    return (
      <section
        className="progreso-panel"
        aria-labelledby="titulo-progreso"
        aria-busy="true"
      >
        {encabezado("METAS Y RACHAS")}
        <Cargando texto="Calculando tu semana…" />
      </section>
    );
  if (consulta.error || !consulta.datos)
    return (
      <section className="progreso-panel" aria-labelledby="titulo-progreso">
        {encabezado("METAS Y RACHAS")}
        <Fallo
          mensaje={consulta.error || "No pudimos calcular tu semana."}
          reintentar={consulta.recargar}
        />
      </section>
    );

  const { progreso, metaActiva } = consulta.datos;
  const {
    meta,
    horasSemana,
    porcentajeHoras,
    diasJugadosSemana,
    rachaActual,
    mejorRacha,
  } = progreso;
  const admiteMeta = estadoJuego === "jugando" || estadoJuego === "pausado";
  const superada = porcentajeHoras !== null && porcentajeHoras > 100;

  return (
    <section className="progreso-panel" aria-labelledby="titulo-progreso">
      <div className="titulo-seccion">
        <div>
          <p className="ceja">{rangoSemana(progreso.semana).toUpperCase()}</p>
          <h2 id="titulo-progreso">Tu semana de juego</h2>
        </div>
        <span className="chip neutro">
          {meta
            ? `Meta: ${numero.format(meta.horasSemanales)} h y ${meta.diasPorSemana} ${plural(meta.diasPorSemana, "día", "días")} por semana`
            : "Sin meta activa"}
        </span>
      </div>

      {progreso.metaCumplida && (
        <p className="progreso-cumplida" role="status">
          <IconoHito alcanzado /> ¡Meta de la semana cumplida! Llegaste a tus
          horas y a tus días.
        </p>
      )}

      <dl className="progreso-grid">
        <div className="progreso-dato">
          <dt>Horas esta semana</dt>
          <dd className="progreso-cifra">
            {numero.format(horasSemana)}
            <span>
              {" "}
              h{meta ? ` de ${numero.format(meta.horasSemanales)} h` : ""}
            </span>
          </dd>
          {meta && porcentajeHoras !== null && (
            <>
              <progress
                className="progreso-barra"
                value={Math.min(porcentajeHoras, 100)}
                max={100}
                aria-label={`Horas frente a la meta: ${porcentajeHoras} %`}
              />
              <p className="progreso-nota">
                {porcentajeHoras} %
                {superada && (
                  <strong className="progreso-superada">
                    {" "}
                    · Meta superada
                  </strong>
                )}
              </p>
            </>
          )}
        </div>
        <div className="progreso-dato">
          <dt>Días jugados</dt>
          <dd className="progreso-cifra">
            {diasJugadosSemana}
            <span>
              {" "}
              {meta
                ? `de ${meta.diasPorSemana} ${plural(meta.diasPorSemana, "día", "días")}`
                : plural(diasJugadosSemana, "día", "días")}
            </span>
          </dd>
          {meta && (
            <ol className="segmentos" aria-hidden="true">
              {Array.from({ length: meta.diasPorSemana }, (_, i) => (
                <li
                  key={i}
                  className={i < diasJugadosSemana ? "lleno" : undefined}
                />
              ))}
            </ol>
          )}
        </div>
        <div className="progreso-dato racha">
          <dt>Racha actual</dt>
          <dd className="progreso-cifra">
            {rachaActual}
            <span> {plural(rachaActual, "día seguido", "días seguidos")}</span>
          </dd>
          <p className="progreso-nota">
            {rachaActual === 0
              ? "Juega hoy para empezar una racha."
              : "¡Sigue así!"}
          </p>
        </div>
        <div className="progreso-dato">
          <dt>Mejor racha</dt>
          <dd className="progreso-cifra">
            {mejorRacha}
            <span> {plural(mejorRacha, "día", "días")}</span>
          </dd>
        </div>
      </dl>

      {meta ? (
        <div className="hitos">
          <h3>Hitos de avance</h3>
          <Hitos hitos={progreso.hitos} />
        </div>
      ) : (
        <div className="progreso-vacio">
          {admiteMeta ? (
            <>
              <p>
                Aún no tienes meta para este juego. Fija una y mide tu semana.
              </p>
              <Link className="boton" to={`/videojuegos/${videojuegoId}/meta`}>
                Crear meta semanal
              </Link>
            </>
          ) : (
            <p>
              Este juego está {estadoJuego}, así que no admite metas. Cámbialo a
              «jugando» o «pausado» si quieres volver a fijarte una.
            </p>
          )}
        </div>
      )}

      {errorAccion && <Fallo mensaje={errorAccion} />}

      {metaActiva && !confirmando && (
        <div className="progreso-acciones">
          <Link
            className="boton secundario"
            to={`/videojuegos/${videojuegoId}/meta`}
          >
            Editar meta
          </Link>
          <button
            type="button"
            className="enlace peligro"
            onClick={() => setConfirmando(true)}
          >
            Desactivar meta
          </button>
        </div>
      )}
      {metaActiva && confirmando && (
        <ConfirmacionEnLinea
          pregunta="¿Desactivar tu meta?"
          detalle="Seguirás viendo tus horas y rachas, pero sin objetivo. No se puede reactivar: para volver a medirte crearás una meta nueva."
          textoConfirmar="Sí, desactivar"
          ocupado={desactivando}
          onConfirmar={() => void desactivar(metaActiva._id)}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </section>
  );
}

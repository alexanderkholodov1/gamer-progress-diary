import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { videojuegosApi } from '../api/videojuegosApi';
import { partidasApi } from '../api/partidasApi';
import type { Videojuego } from '../api/tipos';
import { mensajeError, useCarga } from '../hooks/useCarga';
import { Cargando, Fallo, Vacio } from '../components/Estados';
import { Encabezado } from '../components/Encabezado';

export function PartidaFormulario() {
  const [parametros] = useSearchParams();
  const seleccionado = parametros.get('videojuego') ?? '';
  const consulta = useCarga(() => videojuegosApi.listar(), []);
  if (consulta.cargando) return <Cargando texto="Buscando tus videojuegos para registrar la partida…" />;
  if (consulta.error) return <><Encabezado etiqueta="UN PASO MÁS EN TU AVENTURA" titulo="Registrar partida" texto="Elige tu juego y registra tu sesión." /><Fallo mensaje={consulta.error} reintentar={consulta.recargar} /></>;
  if (!consulta.datos?.length) return <Vacio titulo="Primero necesitas un videojuego" texto="Añade un juego a tu biblioteca y después registra tu primera sesión." accion={<Link className="boton" to="/videojuegos/nuevo">Crear videojuego</Link>} />;
  return <Formulario key={seleccionado} juegos={consulta.datos} seleccionado={seleccionado} />;
}

function Formulario({ juegos, seleccionado }: { juegos: Videojuego[]; seleccionado: string }) {
  const navegar = useNavigate();
  const juegoInicial = juegos.find(juego => juego._id === seleccionado)?._id ?? '';
  const [videojuego, setVideojuego] = useState(juegoInicial);
  const [fecha, setFecha] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [minutos, setMinutos] = useState('');
  const [avance, setAvance] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const volver = juegoInicial ? `/videojuegos/${juegoInicial}` : '/partidas';
  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault(); setError('');
    const instante = new Date(fecha);
    if (!videojuego || !fecha || Number.isNaN(instante.getTime()) || !minutos || Number(minutos) < 1
      || !avance || Number(avance) < 0 || Number(avance) > 100) {
      setError('Elige un videojuego, una fecha válida, al menos un minuto y un avance de 0 a 100.'); return;
    }
    setGuardando(true);
    try {
      await partidasApi.crear({ videojuego, fecha: instante.toISOString(), duracionMinutos: Number(minutos), porcentajeAvance: Number(avance), notas: notas.trim() });
      navegar(`/videojuegos/${videojuego}`);
    } catch (fallo) { setError(mensajeError(fallo)); setGuardando(false); }
  };
  return <><Link className="volver" to={volver}>← {juegoInicial ? 'Volver al videojuego' : 'Mis partidas'}</Link>
    <Encabezado etiqueta="UN PASO MÁS EN TU AVENTURA" titulo="Registrar partida" texto="Guarda el tiempo que dedicaste y el avance con el que terminaste." />
    <form className="panel formulario" onSubmit={evento => void guardar(evento)}>
      <fieldset disabled={guardando}><legend>¿Cómo fue tu sesión?</legend><p className="ayuda">Los campos marcados con * son obligatorios.</p>
        <label>Videojuego *<select required value={videojuego} onChange={e => setVideojuego(e.target.value)}><option value="">Selecciona un videojuego</option>{juegos.map(juego => <option key={juego._id} value={juego._id}>{juego.nombre}</option>)}</select></label>
        <label>Fecha y hora *<input required type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} /><span className="ayuda">La hora corresponde a la zona horaria de tu dispositivo.</span></label>
        <div className="form-grid"><label>Duración en minutos *<input required type="number" min="1" step="1" placeholder="Ej. 60" value={minutos} onChange={e => setMinutos(e.target.value)} /></label>
          <label>Avance al terminar (%) *<input required type="number" min="0" max="100" step="1" placeholder="De 0 a 100" value={avance} onChange={e => setAvance(e.target.value)} /></label></div>
        <label>Notas de la sesión<textarea rows={4} placeholder="¿Qué descubriste? ¿Qué reto te espera?" value={notas} onChange={e => setNotas(e.target.value)} /></label>
      </fieldset>
      <div className="aviso informativo">Al guardar volverás al videojuego para ver su resumen actualizado.</div>
      {error && <Fallo mensaje={error} />}
      <div className="form-pie"><Link className="boton secundario" to={volver}>Cancelar</Link><button className="boton" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar partida'}</button></div>
    </form></>;
}

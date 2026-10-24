import { useState } from 'react';
import { Link } from 'react-router-dom';
import { partidasApi } from '../api/partidasApi';
import { mensajeError, useCarga } from '../hooks/useCarga';
import { Encabezado } from '../components/Encabezado';
import { Cargando, Fallo, Vacio } from '../components/Estados';
import { PartidasTabla } from '../components/PartidasTabla';

export function PartidasLista() {
  const consulta = useCarga(() => partidasApi.listar(), []);
  const [ocupado, setOcupado] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar esta partida? También se actualizará el resumen del videojuego.')) return;
    setOcupado(id); setErrorAccion('');
    try { await partidasApi.eliminar(id); consulta.recargar(); }
    catch (error) { setErrorAccion(mensajeError(error)); }
    finally { setOcupado(''); }
  };
  return <><Encabezado etiqueta="UN HISTORIAL DE BUENOS MOMENTOS" titulo="Mis partidas" texto="Todas tus sesiones, desde la más reciente. Cada minuto forma parte de tu progreso."
    accion={<Link className="boton" to="/partidas/nueva">＋ Registrar partida</Link>} />
    {errorAccion && <Fallo mensaje={errorAccion} />}
    {consulta.cargando ? <Cargando texto="Cargando el historial de tus partidas…" /> : consulta.error ? <Fallo mensaje={consulta.error} reintentar={consulta.recargar} /> : !consulta.datos?.length
      ? <Vacio titulo="Aún no hay partidas registradas" texto="Elige un videojuego y cuéntanos cómo fue tu primera sesión." accion={<Link className="boton" to="/partidas/nueva">Registrar mi primera partida</Link>} />
      : <section className="panel historial-panel" aria-labelledby="historial-titulo"><div className="titulo-seccion"><h2 id="historial-titulo">Tu historial</h2><span className="contador">{consulta.datos.length} {consulta.datos.length === 1 ? 'sesión' : 'sesiones'}</span></div>
        <PartidasTabla partidas={consulta.datos} eliminar={eliminar} ocupado={ocupado} /></section>}
  </>;
}

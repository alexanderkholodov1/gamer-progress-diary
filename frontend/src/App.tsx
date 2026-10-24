import { useEffect } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { VideojuegosLista } from './pages/VideojuegosLista';
import { VideojuegoDetalle } from './pages/VideojuegoDetalle';
import { VideojuegoFormulario } from './pages/VideojuegoFormulario';
import { PartidasLista } from './pages/PartidasLista';
import { PartidaFormulario } from './pages/PartidaFormulario';
import { Vacio } from './components/Estados';

export function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <div className="app-shell">
    <a href="#contenido" className="saltar">Saltar al contenido</a>
    <aside className="sidebar"><Link to="/videojuegos" className="marca" aria-label="Diario gamer, ir a mi biblioteca"><span className="marca-icono" aria-hidden="true">d<span>g</span></span><span>diario<span className="marca-sub">gamer</span></span></Link>
      <div className="nav-grupo"><p className="nav-etiqueta">MI DIARIO</p><nav aria-label="Navegación principal">
        <NavLink to="/videojuegos"><span aria-hidden="true">▦</span> Mi biblioteca</NavLink>
        <NavLink to="/partidas"><span aria-hidden="true">◷</span> Mis partidas</NavLink>
      </nav></div>
      <div className="sidebar-nota"><span aria-hidden="true">✧</span><strong>Disfruta el camino.</strong><p>El progreso se construye una partida a la vez.</p></div>
      <div className="perfil"><span className="avatar" aria-hidden="true">A</span><div><strong>Alexander</strong><small>USFQ · Desarrollo Web 3</small></div></div>
    </aside>
    <div className="area-principal"><div className="barra-superior"><span>Tu diario de progreso</span><span className="barra-detalle"><i aria-hidden="true" /> Una aventura a tu ritmo</span></div>
      <main id="contenido" tabIndex={-1}><Routes>
        <Route path="/" element={<Navigate to="/videojuegos" replace />} />
        <Route path="/videojuegos" element={<VideojuegosLista />} />
        <Route path="/videojuegos/nuevo" element={<VideojuegoFormulario />} />
        <Route path="/videojuegos/:id" element={<VideojuegoDetalle />} />
        <Route path="/videojuegos/:id/editar" element={<VideojuegoFormulario />} />
        <Route path="/partidas" element={<PartidasLista />} />
        <Route path="/partidas/nueva" element={<PartidaFormulario />} />
        <Route path="*" element={<Vacio titulo="Esta página no está en tu mapa" texto="Vuelve a tu biblioteca para seguir la aventura." accion={<Link className="boton" to="/videojuegos">Ir a mi biblioteca</Link>} />} />
      </Routes></main><footer className="pie">Hecho para jugar, recordar y seguir avanzando.<span>Diario de Progreso Gamer · 2026</span></footer>
    </div>
  </div>;
}

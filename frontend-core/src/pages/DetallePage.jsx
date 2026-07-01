import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getSolicitud, registrarIngresos, evaluar, enviarAComite, resolver, desembolsar,
} from '../services/coreApi';
import { obtenerSesion } from '../services/auth';

const AZUL = '#004A9F';
const money = (x) =>
  'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLOR_ESTADO = {
  'En Evaluacion': '#F39C12', 'En Comite': '#8E44AD',
  'Aprobado': '#27AE60', 'Rechazado': '#E74C3C', 'Desembolsado': '#004A9F',
};

export default function DetallePage() {
  const { cod } = useParams();
  const rol = obtenerSesion()?.personal?.rol;   // solo UX: la seguridad real está en el backend
  const esAsesor = rol === 'asesor';
  const esComite = rol === 'comite';
  const [sol, setSol] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Inputs de acciones
  const [ingreso, setIngreso] = useState('');
  const [ingresoDisp, setIngresoDisp] = useState('');
  const [gasto, setGasto] = useState('');
  const [montoAprob, setMontoAprob] = useState('');
  const [motivo, setMotivo] = useState('');

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const d = await getSolicitud(cod);
      setSol(d);
      setMontoAprob(d.monto_solicitado);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo cargar la solicitud.');
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => { cargar(); }, [cod]);

  // Ejecuta una acción, muestra su resultado/error y refresca.
  async function accion(fn, okText) {
    setBusy(true); setError(''); setMsg('');
    try {
      await fn();
      setMsg(okText);
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.message || 'La acción falló.');
    } finally {
      setBusy(false);
    }
  }

  if (cargando) return <Centro><i className="fa-solid fa-spinner fa-spin" /> Cargando…</Centro>;
  if (!sol) return <Centro>{error || 'No encontrada'} · <Link to="/">volver</Link></Centro>;

  const estado = sol.estado;
  const card = { background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,74,159,0.08)', padding: '1.4rem', marginBottom: '1.2rem' };
  const inp = { width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #E0E6F0', borderRadius: 8, marginBottom: '0.7rem', boxSizing: 'border-box' };
  const btn = (bg) => ({ padding: '0.7rem 1.1rem', border: 'none', borderRadius: 8, color: '#fff', background: bg, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 });

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}><i className="fa-solid fa-arrow-left" /> Bandeja</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0 1.2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{sol.codsolicitud}</h1>
          <span style={{ background: (COLOR_ESTADO[estado] || '#888') + '22', color: COLOR_ESTADO[estado] || '#888', padding: '0.3rem 0.8rem', borderRadius: 20, fontWeight: 700, fontSize: '0.8rem' }}>{estado}</span>
        </div>

        <div style={card}>
          <Fila k="Cliente" v={sol.cmac_clientes?.nombre} />
          <Fila k="Ingreso neto registrado" v={money(sol.cmac_clientes?.ingreso_neto || 0)} />
          <Fila k="Producto" v={`${sol.cmac_productos?.codigo} — ${sol.cmac_productos?.nombre}`} />
          <Fila k="Monto solicitado" v={money(sol.monto_solicitado)} />
          {sol.monto_aprobado != null && <Fila k="Monto aprobado" v={money(sol.monto_aprobado)} />}
          <Fila k="Plazo" v={`${sol.plazo_meses} meses`} />
          <Fila k="Desgravamen" v={sol.con_desgravamen ? 'Sí' : 'No'} />
          {sol.scoring != null && <Fila k="Scoring / RDS" v={`${sol.scoring} · ${sol.rds}`} />}
          {sol.motivo_rechazo && <Fila k="Motivo rechazo" v={sol.motivo_rechazo} />}
          {sol.evaluaciones?.length > 0 && <Fila k="Evaluaciones" v={`${sol.evaluaciones.length} registrada(s)`} />}
        </div>

        {msg && <Banner ok>{msg}</Banner>}
        {error && <Banner>{error}</Banner>}

        {/* Aviso si el estado requiere una acción que tu rol NO puede ejecutar (solo UX) */}
        {((estado === 'En Evaluacion' && !esAsesor) ||
          ((estado === 'En Comite' || estado === 'Aprobado') && !esComite)) && (
          <div style={{ ...card, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-lock" style={{ color: '#8E44AD' }} />
            Tu rol (<b>{rol}</b>) no puede ejecutar la acción de este paso —
            requiere rol <b>{estado === 'En Evaluacion' ? 'asesor' : 'comité'}</b>.
          </div>
        )}

        {/* Panel de acciones según el estado (y el rol) */}
        {estado === 'En Evaluacion' && esAsesor && (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Paso 1 · Asesor</h3>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Registrar ingreso neto del cliente</label>
            <input style={inp} type="number" value={ingreso} onChange={(e) => setIngreso(e.target.value)} placeholder="S/ ingreso mensual" />
            <button style={btn('#16A085')} disabled={busy} onClick={() => accion(() => registrarIngresos(cod, Number(ingreso)), 'Ingreso registrado.')}>
              <i className="fa-solid fa-coins" /> Registrar ingresos
            </button>

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid #eee' }} />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Evaluación (ingreso disponible / gasto familiar)</label>
            <input style={inp} type="number" value={ingresoDisp} onChange={(e) => setIngresoDisp(e.target.value)} placeholder="Ingreso disponible" />
            <input style={inp} type="number" value={gasto} onChange={(e) => setGasto(e.target.value)} placeholder="Gasto familiar (opcional)" />
            <button style={btn('#2980B9')} disabled={busy} onClick={() => accion(() => evaluar(cod, { ingresoDisponible: Number(ingresoDisp), gastoFamiliar: Number(gasto) || 0 }), 'Evaluación registrada.')}>
              <i className="fa-solid fa-clipboard-check" /> Registrar evaluación
            </button>

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid #eee' }} />

            <button style={btn('#8E44AD')} disabled={busy} onClick={() => accion(() => enviarAComite(cod), 'Enviada a comité.')}>
              <i className="fa-solid fa-people-group" /> Enviar a comité
            </button>
          </div>
        )}

        {estado === 'En Comite' && esComite && (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Paso 2 · Comité</h3>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Monto aprobado</label>
            <input style={inp} type="number" value={montoAprob} onChange={(e) => setMontoAprob(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
              <button style={btn('#27AE60')} disabled={busy} onClick={() => accion(() => resolver(cod, { resultado: 'APROBADO', montoAprobado: Number(montoAprob) }), 'Solicitud aprobada.')}>
                <i className="fa-solid fa-check" /> Aprobar
              </button>
            </div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Motivo de rechazo</label>
            <input style={inp} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (si rechazas)" />
            <button style={btn('#E74C3C')} disabled={busy} onClick={() => accion(() => resolver(cod, { resultado: 'RECHAZADO', motivoRechazo: motivo }), 'Solicitud rechazada.')}>
              <i className="fa-solid fa-xmark" /> Rechazar
            </button>
          </div>
        )}

        {estado === 'Aprobado' && esComite && (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Paso 3 · Desembolso</h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Genera el crédito, el cronograma y la operación de desembolso. El cliente lo verá en su Homebanking.</p>
            <button style={btn(AZUL)} disabled={busy} onClick={() => accion(() => desembolsar(cod), 'Crédito desembolsado.')}>
              <i className="fa-solid fa-hand-holding-dollar" /> Desembolsar
            </button>
          </div>
        )}

        {(estado === 'Desembolsado' || estado === 'Rechazado') && (
          <div style={{ ...card, textAlign: 'center', color: '#666' }}>
            <i className={`fa-solid ${estado === 'Desembolsado' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ fontSize: '1.6rem', color: COLOR_ESTADO[estado] }} />
            <p style={{ margin: '0.5rem 0 0' }}>Flujo finalizado: <b>{estado}</b>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Fila({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F5F7FA', fontSize: '0.88rem' }}>
      <span style={{ color: '#888' }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}
function Banner({ ok, children }) {
  return (
    <div style={{ padding: '0.8rem 1rem', borderRadius: 12, marginBottom: '1.2rem', background: ok ? '#E8F8F0' : '#FEF0F0', border: `1.5px solid ${ok ? '#27AE60' : '#E74C3C'}`, color: ok ? '#1b7a3d' : '#b3261e' }}>
      <i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} /> {children}
    </div>
  );
}
function Centro({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>{children}</div>;
}

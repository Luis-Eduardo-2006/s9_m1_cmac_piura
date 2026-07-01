import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCartera, getGestiones, registrarGestion, derivarJudicial, castigar } from '../services/coreApi';
import { obtenerSesion } from '../services/auth';
import { COLOR_BANDA } from './RecuperacionesPage';

const AZUL = '#004A9F';
const money = (x) => 'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TIPOS = ['llamada', 'visita', 'SMS', 'compromiso'];

export default function MoraDetallePage() {
  const { cod } = useParams();
  const rol = obtenerSesion()?.personal?.rol;
  const esAdmin = rol === 'administrador';
  const esComite = rol === 'comite';
  const esGestor = ['administrador', 'asesor', 'analista'].includes(rol);

  const [cuenta, setCuenta] = useState(null);
  const [gestiones, setGestiones] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [tipo, setTipo] = useState('llamada');
  const [obs, setObs] = useState('');
  const [compromiso, setCompromiso] = useState('');

  async function cargar() {
    setError('');
    try {
      // La cuenta se toma de la cartera (incluye banda calculada); el historial aparte.
      const cartera = await getCartera();
      setCuenta(cartera.find((c) => c.codcuentacredito === cod) || null);
      setGestiones(await getGestiones(cod));
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo cargar la cuenta.');
    }
  }
  useEffect(() => { cargar(); }, [cod]);

  async function accion(fn, okText) {
    setBusy(true); setError(''); setMsg('');
    try { await fn(); setMsg(okText); await cargar(); }
    catch (e) { setError(e?.response?.data?.message || 'La acción falló.'); }
    finally { setBusy(false); }
  }

  const card = { background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,74,159,0.08)', padding: '1.4rem', marginBottom: '1.2rem' };
  const inp = { width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #E0E6F0', borderRadius: 8, marginBottom: '0.7rem', boxSizing: 'border-box' };
  const btn = (bg) => ({ padding: '0.7rem 1.1rem', border: 'none', borderRadius: 8, color: '#fff', background: bg, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 });

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/recuperaciones" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}><i className="fa-solid fa-arrow-left" /> Cartera en mora</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0 1.2rem' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{cod}</h1>
          {cuenta && <span style={{ background: (COLOR_BANDA[cuenta.banda] || '#888') + '22', color: COLOR_BANDA[cuenta.banda] || '#888', padding: '0.3rem 0.8rem', borderRadius: 20, fontWeight: 700, fontSize: '0.8rem' }}>{cuenta.banda}</span>}
        </div>

        {msg && <Banner ok>{msg}</Banner>}
        {error && <Banner>{error}</Banner>}

        {cuenta && (
          <div style={card}>
            <Fila k="Cliente" v={cuenta.cliente} />
            <Fila k="Saldo capital" v={money(cuenta.saldo_capital)} />
            <Fila k="Días de atraso" v={cuenta.dias_atraso} />
            <Fila k="Estado (BD)" v={cuenta.estado_mora} />
          </div>
        )}

        {/* R2 · Registrar gestión (roles gestores) */}
        {esGestor ? (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Registrar gestión de cobranza</h3>
            <select style={inp} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={inp} placeholder="Observación" value={obs} onChange={(e) => setObs(e.target.value)} />
            <label style={{ fontSize: '0.78rem', color: '#666' }}>Compromiso de pago (opcional)</label>
            <input style={inp} type="date" value={compromiso} onChange={(e) => setCompromiso(e.target.value)} />
            <button style={btn('#16A085')} disabled={busy} onClick={() => accion(() => registrarGestion(cod, { tipo_gestion: tipo, observacion: obs, compromiso_pago: compromiso || null }), 'Gestión registrada.')}>
              <i className="fa-solid fa-phone" /> Registrar gestión
            </button>
          </div>
        ) : (
          <div style={{ ...card, color: '#666' }}><i className="fa-solid fa-lock" /> Tu rol (<b>{rol}</b>) no gestiona cobranza.</div>
        )}

        {/* R3 · Transiciones críticas (visibles según rol; el backend valida umbral + rol) */}
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Acciones de recuperación</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {esAdmin && (
              <button style={btn('#C0392B')} disabled={busy} onClick={() => accion(() => derivarJudicial(cod, 'Derivación desde UI'), 'Derivado a judicial.')}>
                <i className="fa-solid fa-gavel" /> Derivar a judicial (≥121 días)
              </button>
            )}
            {esComite && (
              <button style={btn('#2C3E50')} disabled={busy} onClick={() => accion(() => castigar(cod, 'Castigo desde UI'), 'Crédito castigado.')}>
                <i className="fa-solid fa-ban" /> Castigar (&gt;180 días)
              </button>
            )}
            {!esAdmin && !esComite && <span style={{ color: '#666', fontSize: '0.85rem' }}><i className="fa-solid fa-lock" /> Solo administrador (judicial) o comité (castigar).</span>}
          </div>
        </div>

        {/* Historial de gestiones */}
        <div style={{ ...card, marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Historial de gestiones ({gestiones.length})</h3>
          {gestiones.length === 0 ? (
            <p style={{ color: '#888', fontSize: '0.85rem' }}>Sin gestiones registradas.</p>
          ) : (
            gestiones.map((g) => (
              <div key={g.id} style={{ borderLeft: `3px solid ${COLOR_BANDA[g.banda] || '#888'}`, padding: '0.5rem 0.8rem', marginBottom: 8, background: '#FAFBFF', borderRadius: 6 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{g.tipo_gestion} · <span style={{ color: COLOR_BANDA[g.banda] }}>{g.banda}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>{g.observacion || '—'}</div>
                <div style={{ fontSize: '0.72rem', color: '#999' }}>{new Date(g.fecha).toLocaleString('es-PE')}{g.compromiso_pago ? ` · compromiso: ${g.compromiso_pago}` : ''}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Fila({ k, v }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F5F7FA', fontSize: '0.88rem' }}><span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>;
}
function Banner({ ok, children }) {
  return <div style={{ padding: '0.8rem 1rem', borderRadius: 12, marginBottom: '1.2rem', background: ok ? '#E8F8F0' : '#FEF0F0', border: `1.5px solid ${ok ? '#27AE60' : '#E74C3C'}`, color: ok ? '#1b7a3d' : '#b3261e' }}><i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} /> {children}</div>;
}

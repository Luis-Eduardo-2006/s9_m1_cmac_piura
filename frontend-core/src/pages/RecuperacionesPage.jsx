import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCartera, getKpisMora } from '../services/coreApi';
import { obtenerSesion, cerrarSesion } from '../services/auth';

const AZUL = '#004A9F';
const money = (x) => 'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Semáforo de banda (preventiva/temprana ámbar, tardía/judicial rojo, castigado gris/negro).
export const COLOR_BANDA = {
  'Vigente': '#27AE60',
  'Mora Preventiva': '#F39C12',
  'Mora Temprana': '#F39C12',
  'Mora Tardia': '#E74C3C',
  'Judicial': '#C0392B',
  'Castigado': '#2C3E50',
};
const BANDAS_MORA = ['Mora Preventiva', 'Mora Temprana', 'Mora Tardia', 'Judicial', 'Castigado'];

export default function RecuperacionesPage() {
  const navigate = useNavigate();
  const { personal } = obtenerSesion() || {};
  const [kpis, setKpis] = useState(null);
  const [cartera, setCartera] = useState([]);
  const [banda, setBanda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar(filtro = banda) {
    setCargando(true); setError('');
    try {
      const [k, c] = await Promise.all([getKpisMora(), getCartera(filtro || undefined)]);
      setKpis(k); setCartera(c);
    } catch (e) {
      if (e?.response?.status === 401) { cerrarSesion(); navigate('/login'); return; }
      setError(e?.response?.data?.message || 'No se pudo cargar la cartera en mora.');
    } finally { setCargando(false); }
  }
  useEffect(() => { cargar(''); }, []);

  function filtrar(b) { setBanda(b); cargar(b); }

  const th = { textAlign: 'left', padding: '0.7rem 0.8rem', fontSize: '0.73rem', color: '#fff', fontWeight: 700 };
  const td = { textAlign: 'left', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderBottom: '1px solid #F0F4FA' };

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ background: AZUL, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <div style={{ fontWeight: 800 }}><i className="fa-solid fa-hand-holding-hand" /> Recuperaciones · CMAC Piura</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}><i className="fa-solid fa-inbox" /> Bandeja</Link>
          <span>{personal?.nombre} · <b style={{ textTransform: 'capitalize' }}>{personal?.rol}</b></span>
        </div>
      </nav>

      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: 0 }}>Cartera en mora</h1>

        {error && <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', marginBottom: '1rem' }}><i className="fa-solid fa-triangle-exclamation" /> {error}</div>}

        {/* KPIs */}
        {kpis && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <Kpi label="Saldo total" valor={money(kpis.saldoTotal)} />
            <Kpi label="Saldo en mora (NPL)" valor={money(kpis.saldoMora)} color="#E74C3C" />
            <Kpi label="Ratio de mora" valor={`${kpis.ratioMoraPct} %`} color="#C0392B" />
            <Kpi label="Créditos" valor={kpis.totalCreditos} />
          </div>
        )}

        {/* Conteo por banda (chips clicables = filtro) */}
        {kpis && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            <Chip activo={banda === ''} onClick={() => filtrar('')} color={AZUL}>Todas</Chip>
            {BANDAS_MORA.map((b) => (
              <Chip key={b} activo={banda === b} onClick={() => filtrar(b)} color={COLOR_BANDA[b]}>
                {b} · {kpis.porBanda?.[b]?.conteo ?? 0}
              </Chip>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,74,159,0.08)' }}>
          {cargando ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando…</div>
          ) : cartera.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Sin créditos en esta banda.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: AZUL }}>
                    <th style={th}>Cuenta</th><th style={th}>Cliente</th><th style={th}>Saldo capital</th>
                    <th style={th}>Días atraso</th><th style={th}>Banda</th><th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {cartera.map((c) => (
                    <tr key={c.codcuentacredito}>
                      <td style={{ ...td, fontWeight: 700, color: AZUL }}>{c.codcuentacredito}</td>
                      <td style={td}>{c.cliente}</td>
                      <td style={td}>{money(c.saldo_capital)}</td>
                      <td style={td}>{c.dias_atraso}</td>
                      <td style={td}><span style={{ background: (COLOR_BANDA[c.banda] || '#888') + '22', color: COLOR_BANDA[c.banda] || '#888', padding: '0.25rem 0.7rem', borderRadius: 20, fontWeight: 700, fontSize: '0.76rem' }}>{c.banda}</span></td>
                      <td style={td}><Link to={`/mora/${c.codcuentacredito}`} style={{ color: AZUL, fontWeight: 600, textDecoration: 'none' }}>Gestionar <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, valor, color = '#1A1A2E' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.2rem', boxShadow: '0 4px 20px rgba(0,74,159,0.08)' }}>
      <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color, marginTop: 4 }}>{valor}</div>
    </div>
  );
}
function Chip({ children, activo, onClick, color }) {
  return (
    <button onClick={onClick} style={{ border: `1.5px solid ${color}`, background: activo ? color : '#fff', color: activo ? '#fff' : color, padding: '0.35rem 0.8rem', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
      {children}
    </button>
  );
}

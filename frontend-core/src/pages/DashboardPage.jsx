import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { getDashboard, descargarCsv } from '../services/coreApi';
import { obtenerSesion, cerrarSesion } from '../services/auth';
import { COLOR_BANDA } from './RecuperacionesPage';

const AZUL = '#004A9F';
const AMARILLO = '#F5C200';
const money = (x) => 'S/ ' + Number(x).toLocaleString('es-PE', { maximumFractionDigits: 0 });
const money2 = (x) => 'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PROD_NOMBRE = { EMP: 'Empresarial', CON: 'Consumo' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { personal } = obtenerSesion() || {};
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);

  useEffect(() => {
    (async () => {
      setCargando(true); setError('');
      try { setData(await getDashboard()); }
      catch (e) {
        if (e?.response?.status === 401) { cerrarSesion(); navigate('/login'); return; }
        setError(e?.response?.data?.message || 'No se pudo cargar el dashboard.');
      } finally { setCargando(false); }
    })();
  }, []);

  async function exportar() {
    setBajando(true);
    try { await descargarCsv(); } catch { setError('No se pudo descargar el CSV.'); } finally { setBajando(false); }
  }

  const card = { background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,74,159,0.08)', padding: '1.2rem' };

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ background: AZUL, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <div style={{ fontWeight: 800 }}><i className="fa-solid fa-chart-line" /> Dashboard · CMAC Piura</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}><i className="fa-solid fa-inbox" /> Bandeja</Link>
          <Link to="/recuperaciones" style={{ color: '#fff', textDecoration: 'none' }}><i className="fa-solid fa-hand-holding-hand" /> Recuperaciones</Link>
          <span>{personal?.nombre}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1150, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Cartera de créditos — análisis ejecutivo</h1>
          <button onClick={exportar} disabled={bajando} style={{ background: AMARILLO, color: '#1A1A2E', border: 'none', borderRadius: 8, padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer' }}>
            <i className="fa-solid fa-file-csv" /> {bajando ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>

        {error && <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', marginBottom: '1rem' }}><i className="fa-solid fa-triangle-exclamation" /> {error}</div>}
        {cargando && <div style={{ ...card, textAlign: 'center', color: '#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando datos…</div>}

        {data && (
          <>
            {/* 1 · KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Kpi label="Cartera total" valor={money(data.kpis.cartera_total)} icon="fa-wallet" />
              <Kpi label="Ratio de mora" valor={`${data.kpis.ratio_mora.toFixed(1)} %`} icon="fa-triangle-exclamation" color="#C0392B" />
              <Kpi label="Cartera vencida" valor={money(data.kpis.cartera_vencida)} icon="fa-clock" color="#E74C3C" />
              <Kpi label="Desembolsos" valor={money(data.kpis.desembolsos_total)} icon="fa-hand-holding-dollar" color="#16A085" />
              <Kpi label="N° créditos" valor={data.kpis.n_creditos} icon="fa-file-invoice-dollar" />
              <Kpi label="Ticket promedio" valor={money2(data.kpis.ticket_promedio)} icon="fa-coins" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
              {/* 2 · Evolución de desembolsos */}
              <div style={card}>
                <h3 style={sub}>Desembolsos por mes</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.desembolsos_por_mes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={AZUL} stopOpacity={0.6} /><stop offset="95%" stopColor={AZUL} stopOpacity={0.05} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
                    <XAxis dataKey="periodo" fontSize={12} /><YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000)}k`} />
                    <Tooltip formatter={(v) => money2(v)} />
                    <Area type="monotone" dataKey="monto" stroke={AZUL} fill="url(#g)" strokeWidth={2} name="Desembolsado" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 3 · Saldo por banda (dona con semáforo) */}
              <div style={card}>
                <h3 style={sub}>Cartera por banda de mora</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.mora_por_banda.filter((b) => b.saldo > 0)} dataKey="saldo" nameKey="banda" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {data.mora_por_banda.filter((b) => b.saldo > 0).map((b) => <Cell key={b.banda} fill={COLOR_BANDA[b.banda] || '#888'} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [money2(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 4 · Cartera por producto */}
              <div style={card}>
                <h3 style={sub}>Cartera por producto</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.cartera_por_producto.map((p) => ({ ...p, nombre: PROD_NOMBRE[p.producto] || p.producto }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
                    <XAxis dataKey="nombre" fontSize={12} /><YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000)}k`} />
                    <Tooltip formatter={(v) => money2(v)} />
                    <Bar dataKey="saldo" fill={AZUL} name="Saldo" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5 · Tabla por banda con ratio */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4FA' }}>
                <h3 style={{ ...sub, margin: 0 }}>Detalle por banda de mora</h3>
                <span style={{ background: '#FEECEC', color: '#C0392B', padding: '0.3rem 0.8rem', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem' }}>Ratio de mora: {data.kpis.ratio_mora.toFixed(1)} %</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#F5F7FA' }}>
                  <th style={th}>Banda</th><th style={{ ...th, textAlign: 'right' }}>Saldo</th><th style={{ ...th, textAlign: 'right' }}>Créditos</th><th style={{ ...th, textAlign: 'right' }}>% cartera</th>
                </tr></thead>
                <tbody>
                  {data.mora_por_banda.map((b) => (
                    <tr key={b.banda}>
                      <td style={td}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLOR_BANDA[b.banda], marginRight: 8 }} />{b.banda}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money2(b.saldo)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{b.conteo}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{data.kpis.cartera_total > 0 ? ((b.saldo / data.kpis.cartera_total) * 100).toFixed(1) : '0.0'} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 12 }}>
              Datos reales de Supabase (cartera del Core). El seed actual contiene solo el producto Empresarial (EMP);
              cuando existan créditos de Consumo aparecerán automáticamente. Dashboard analítico integrado + exportación CSV como puente a Power BI.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const sub = { margin: '0 0 0.8rem', fontSize: '0.9rem', fontWeight: 700, color: '#1A1A2E' };
const th = { textAlign: 'left', padding: '0.6rem 1.2rem', fontSize: '0.72rem', color: '#666', fontWeight: 700, textTransform: 'uppercase' };
const td = { textAlign: 'left', padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderBottom: '1px solid #F5F7FA' };

function Kpi({ label, valor, icon, color = '#1A1A2E' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 4px 20px rgba(0,74,159,0.08)' }}>
      <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}><i className={`fa-solid ${icon}`} style={{ marginRight: 6, color }} />{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, color, marginTop: 6 }}>{valor}</div>
    </div>
  );
}

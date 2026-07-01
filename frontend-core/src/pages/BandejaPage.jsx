import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSolicitudes } from '../services/coreApi';
import { obtenerSesion, cerrarSesion } from '../services/auth';

const AZUL = '#004A9F';
const money = (x) =>
  'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLOR_ESTADO = {
  'En Evaluacion': '#F39C12',
  'En Comite': '#8E44AD',
  'Aprobado': '#27AE60',
  'Rechazado': '#E74C3C',
  'Desembolsado': '#004A9F',
};

export default function BandejaPage() {
  const navigate = useNavigate();
  const { personal } = obtenerSesion() || {};
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      setItems(await getSolicitudes());
    } catch (e) {
      if (e?.response?.status === 401) { cerrarSesion(); navigate('/login'); return; }
      setError(e?.response?.data?.message || 'No se pudo cargar la bandeja.');
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => { cargar(); }, []);

  function salir() { cerrarSesion(); navigate('/login'); }

  const th = { textAlign: 'left', padding: '0.7rem 0.8rem', fontSize: '0.73rem', color: '#fff', fontWeight: 700 };
  const td = { textAlign: 'left', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderBottom: '1px solid #F0F4FA' };

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ background: AZUL, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <div style={{ fontWeight: 800 }}><i className="fa-solid fa-building-columns" /> Core CMAC Piura</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.85rem' }}>
          <span>{personal?.nombre} · <b style={{ textTransform: 'capitalize' }}>{personal?.rol}</b></span>
          <button onClick={salir} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: 8, cursor: 'pointer' }}>
            <i className="fa-solid fa-right-from-bracket" /> Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Bandeja de solicitudes</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/dashboard" style={{ color: AZUL, fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-chart-line" /> Dashboard
            </Link>
            <Link to="/recuperaciones" style={{ color: AZUL, fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-hand-holding-hand" /> Recuperaciones
            </Link>
            <button onClick={cargar} style={{ background: 'none', border: 'none', color: AZUL, fontWeight: 600, cursor: 'pointer' }}>
              <i className="fa-solid fa-rotate" /> Refrescar
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', marginBottom: '1rem' }}>
            <i className="fa-solid fa-triangle-exclamation" /> {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,74,159,0.08)' }}>
          {cargando ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No hay solicitudes.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: AZUL }}>
                    <th style={th}>Código</th>
                    <th style={th}>Cliente</th>
                    <th style={th}>Producto</th>
                    <th style={th}>Monto</th>
                    <th style={th}>Plazo</th>
                    <th style={th}>Estado</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.codsolicitud}>
                      <td style={{ ...td, fontWeight: 700, color: AZUL }}>{s.codsolicitud}</td>
                      <td style={td}>{s.cmac_clientes?.nombre || '—'}</td>
                      <td style={td}>{s.cmac_productos?.codigo || '—'}</td>
                      <td style={td}>{money(s.monto_aprobado ?? s.monto_solicitado)}</td>
                      <td style={td}>{s.plazo_meses}m</td>
                      <td style={td}>
                        <span style={{ background: (COLOR_ESTADO[s.estado] || '#888') + '22', color: COLOR_ESTADO[s.estado] || '#888', padding: '0.25rem 0.7rem', borderRadius: 20, fontWeight: 700, fontSize: '0.76rem' }}>{s.estado}</span>
                      </td>
                      <td style={td}>
                        <Link to={`/solicitud/${s.codsolicitud}`} style={{ color: AZUL, fontWeight: 600, textDecoration: 'none' }}>Abrir <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }} /></Link>
                      </td>
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

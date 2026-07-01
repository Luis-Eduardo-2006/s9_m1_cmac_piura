import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMisSolicitudes } from '../services/dataService';

const AZUL = '#004A9F';
const money = (x) =>
  'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Color por estado del flujo de otorgamiento.
const COLOR_ESTADO = {
  'En Evaluacion': '#F39C12',
  'En Comite': '#8E44AD',
  'Aprobado': '#27AE60',
  'Rechazado': '#E74C3C',
  'Desembolsado': '#004A9F',
};

export default function MisSolicitudesPage() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      setItems(await getMisSolicitudes());
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar tus solicitudes.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const th = { textAlign: 'left', padding: '0.7rem 0.8rem', fontSize: '0.73rem', color: '#fff', fontWeight: 700, letterSpacing: '0.3px' };
  const td = { textAlign: 'left', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderBottom: '1px solid #F0F4FA', color: '#333' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#EEF2FA', minHeight: '100vh', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <Link to="/dashboard" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            <i className="fa-solid fa-arrow-left" /> Volver al dashboard
          </Link>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={cargar} style={{ background: 'none', border: 'none', color: AZUL, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-rotate" /> Refrescar
            </button>
            <Link to="/solicitar-credito" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
              <i className="fa-solid fa-plus" /> Nueva solicitud
            </Link>
          </div>
        </div>

        <h1 style={{ color: '#1A1A2E', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.2rem' }}>
          <i className="fa-solid fa-folder-open" style={{ color: AZUL, marginRight: 10 }} />
          Mis solicitudes
        </h1>

        {error && (
          <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', marginBottom: '1rem' }}>
            <i className="fa-solid fa-triangle-exclamation" /> {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,74,159,0.08)' }}>
          {cargando ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              <i className="fa-solid fa-spinner fa-spin" /> Cargando…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              Aún no tienes solicitudes. <Link to="/solicitar-credito" style={{ color: AZUL }}>Solicita un crédito</Link>.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: AZUL }}>
                    <th style={th}>Código</th>
                    <th style={th}>Producto</th>
                    <th style={th}>Monto</th>
                    <th style={th}>Plazo</th>
                    <th style={th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.codsolicitud}>
                      <td style={{ ...td, fontWeight: 700, color: AZUL }}>{s.codsolicitud}</td>
                      <td style={td}>{s.cmac_productos?.codigo || '—'}</td>
                      <td style={td}>{money(s.monto_aprobado ?? s.monto_solicitado)}</td>
                      <td style={td}>{s.plazo_meses}m</td>
                      <td style={td}>
                        <span style={{ background: (COLOR_ESTADO[s.estado] || '#888') + '22', color: COLOR_ESTADO[s.estado] || '#888', padding: '0.25rem 0.7rem', borderRadius: 20, fontWeight: 700, fontSize: '0.76rem' }}>
                          {s.estado}
                        </span>
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

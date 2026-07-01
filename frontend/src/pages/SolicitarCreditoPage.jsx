import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { simularCredito, crearSolicitud } from '../services/dataService';

const AZUL = '#004A9F';
const AMARILLO = '#F5C200';
const money = (x) =>
  'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SolicitarCreditoPage() {
  const navigate = useNavigate();
  const [monto, setMonto] = useState(10000);
  const [meses, setMeses] = useState(12);
  const [conDesgravamen, setConDesgravamen] = useState(false);

  const [sim, setSim] = useState(null);
  const [cargandoSim, setCargandoSim] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  // Previsualiza la simulación (endpoint público de P1).
  useEffect(() => {
    const m = Number(monto);
    const n = Number(meses);
    if (!m || !n || m <= 0 || n <= 0) { setSim(null); return; }
    let cancelado = false;
    setCargandoSim(true);
    setError('');
    const t = setTimeout(async () => {
      try {
        const data = await simularCredito({ productoCodigo: 'EMP', monto: m, plazoMeses: n, conDesgravamen });
        if (!cancelado) setSim(data);
      } catch (e) {
        if (!cancelado) { setSim(null); setError(e?.response?.data?.message || 'No se pudo simular.'); }
      } finally {
        if (!cancelado) setCargandoSim(false);
      }
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [monto, meses, conDesgravamen]);

  async function enviar() {
    setError('');
    setOkMsg('');
    setEnviando(true);
    try {
      const r = await crearSolicitud({
        productoCodigo: 'EMP',
        monto: Number(monto),
        plazoMeses: Number(meses),
        conDesgravamen,
      });
      setOkMsg(`Solicitud ${r.codsolicitud} creada (estado: ${r.estado}).`);
      setTimeout(() => navigate('/mis-solicitudes'), 1200);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  }

  const card = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,74,159,0.08)', padding: '1.6rem' };
  const label = { display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' };
  const inp = { width: '100%', padding: '0.65rem 0.8rem', border: '1.5px solid #E0E6F0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#EEF2FA', minHeight: '100vh', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <Link to="/dashboard" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            <i className="fa-solid fa-arrow-left" /> Volver al dashboard
          </Link>
          <Link to="/mis-solicitudes" style={{ color: AZUL, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            Mis solicitudes <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>

        <h1 style={{ color: '#1A1A2E', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.2rem' }}>
          <i className="fa-solid fa-hand-holding-dollar" style={{ color: AMARILLO, marginRight: 10 }} />
          Solicitar crédito
        </h1>

        <div style={{ ...card, marginBottom: '1.2rem' }}>
          <label style={label}>Monto (S/)</label>
          <input style={{ ...inp, marginBottom: '1rem' }} type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <label style={label}>Plazo (meses)</label>
          <input style={{ ...inp, marginBottom: '1rem' }} type="number" min="1" value={meses} onChange={(e) => setMeses(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#333', cursor: 'pointer' }}>
            <input type="checkbox" checked={conDesgravamen} onChange={(e) => setConDesgravamen(e.target.checked)} style={{ accentColor: AZUL }} />
            Con seguro de desgravamen (TEA 40.92 %)
          </label>
        </div>

        {/* Simulación */}
        <div style={{ ...card, background: 'linear-gradient(120deg, #003580, #004A9F)', color: '#fff', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cuota mensual estimada</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: AMARILLO }}>
            {sim ? money(sim.cuota) : (cargandoSim ? 'Calculando…' : '—')}
          </div>
          {sim && (
            <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
              TEA {(sim.tea * 100).toFixed(2)} % · {sim.cronograma.length} cuotas · Total {money(sim.cuota * sim.cronograma.length)}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', marginBottom: '1rem' }}>
            <i className="fa-solid fa-triangle-exclamation" /> {error}
          </div>
        )}
        {okMsg && (
          <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#E8F8F0', border: '1.5px solid #27AE60', color: '#1b7a3d', marginBottom: '1rem' }}>
            <i className="fa-solid fa-circle-check" /> {okMsg}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={enviando || !sim}
          style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', fontWeight: 700, borderRadius: 10, border: 'none', cursor: enviando || !sim ? 'default' : 'pointer', color: '#fff', background: AZUL, opacity: enviando || !sim ? 0.6 : 1 }}
        >
          {enviando ? <><i className="fa-solid fa-spinner fa-spin" /> Enviando…</> : <><i className="fa-solid fa-paper-plane" /> Enviar solicitud</>}
        </button>
      </div>
    </div>
  );
}

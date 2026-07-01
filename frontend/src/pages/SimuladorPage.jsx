import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casos } from '../data/casos';
import { simularCredito } from '../services/dataService';
import { useResponsive } from '../hooks/useResponsive';

const AZUL     = '#004A9F';
const AMARILLO = '#F5C200';

const money = (x) =>
  'S/ ' + Number(x).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SimuladorPage() {
  const { isMobile, isTablet } = useResponsive();
  const isSmall = isMobile || isTablet;

  const [monto,          setMonto]          = useState(10000);
  const [meses,          setMeses]          = useState(12);
  const [conDesgravamen, setConDesgravamen] = useState(false);
  const [primeraCuota,   setPrimeraCuota]   = useState('2026-03-03');
  const [casoCargado,    setCasoCargado]    = useState('');

  // El cálculo vive en el backend (Core). Aquí solo se consume el endpoint.
  const [resultado, setResultado] = useState(null);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const m = Number(monto);
    const n = Number(meses);
    if (!m || !n || m <= 0 || n <= 0) {
      setResultado(null);
      setError('');
      setCargando(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError('');

    // Debounce: evita una petición por cada tecla.
    const t = setTimeout(async () => {
      try {
        const data = await simularCredito({
          productoCodigo: 'EMP',
          monto: m,
          plazoMeses: n,
          conDesgravamen,
          primeraCuota,
        });
        if (cancelado) return;
        // Respuesta del backend: { producto, tea, tem, cuota, cronograma }
        setResultado({ cuota: data.cuota, tea: data.tea, tem: data.tem, filas: data.cronograma });
      } catch (e) {
        if (cancelado) return;
        setResultado(null);
        setError(e?.response?.data?.message || 'No se pudo conectar con el servidor.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 350);

    return () => { cancelado = true; clearTimeout(t); };
  }, [monto, meses, conDesgravamen, primeraCuota]);

  function cargarCaso(id) {
    setCasoCargado(id);
    if (!id) return;
    const c = casos.find((x) => x.id === Number(id));
    if (!c) return;
    setMonto(c.monto);
    setMeses(c.plazoMeses);
    setConDesgravamen(c.conDesgravamen);
    setPrimeraCuota(c.primeraCuota);
  }

  const casoRef  = casoCargado ? casos.find((x) => x.id === Number(casoCargado)) : null;
  const coincide = casoRef && resultado && Math.abs(resultado.cuota - casoRef.cuotaEsperada) <= 0.01;

  const card  = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,74,159,0.08)', padding: isMobile ? '1.2rem' : '1.6rem' };
  const label = { display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' };
  const inp   = { width: '100%', padding: '0.65rem 0.8rem', border: '1.5px solid #E0E6F0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'Inter, sans-serif' };
  const th    = { textAlign: 'right', padding: '0.6rem 0.7rem', fontSize: '0.73rem', color: '#fff', fontWeight: 700, letterSpacing: '0.3px' };
  const td    = { textAlign: 'right', padding: '0.5rem 0.7rem', fontSize: '0.82rem', borderBottom: '1px solid #F0F4FA', color: '#333' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#EEF2FA', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(120deg, #003580 0%, #004A9F 60%, #0060C8 100%)', padding: isMobile ? '1.2rem 1rem 2.5rem' : '1.5rem 2rem 3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '5%',  top: '-30px',  width: '200px', height: '200px', background: 'rgba(0,174,239,0.13)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: '18%', bottom: '-60px', width: '130px', height: '130px', background: 'rgba(0,174,239,0.08)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
            <i className="fa-solid fa-arrow-left" /> Volver al inicio
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: 44, height: 44, background: AMARILLO, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-calculator" style={{ color: '#fff', fontSize: '1.2rem' }} />
            </div>
            <div>
              <h1 style={{ color: '#fff', margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900 }}>Simulador de crédito</h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '0.8rem' }}>
                Crédito Empresarial · Micro Micro · Amortización francesa
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '-1.5rem auto 0', padding: isMobile ? '0 1rem 2rem' : '0 2rem 3rem', position: 'relative', zIndex: 2 }}>

        <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: '1.2rem', alignItems: 'start', marginBottom: '1.4rem' }}>

          {/* Formulario */}
          <div style={card}>
            <h3 style={{ margin: '0 0 1.2rem', color: '#1A1A2E', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-sliders" style={{ color: AZUL }} /> Parámetros del crédito
            </h3>

            <label style={label}>Cargar caso de prueba (1–30)</label>
            <select style={{ ...inp, marginBottom: '1.2rem', cursor: 'pointer' }} value={casoCargado} onChange={(e) => cargarCaso(e.target.value)}>
              <option value="">— Ingreso manual —</option>
              {casos.map((c) => (
                <option key={c.id} value={c.id}>
                  Caso {c.id} · {c.cliente} · {money(c.monto)} · {c.plazoMeses}m
                </option>
              ))}
            </select>

            <label style={label}>Monto del préstamo (S/)</label>
            <input style={{ ...inp, marginBottom: '1.2rem' }} type="number" min="1" value={monto}
              onChange={(e) => { setMonto(e.target.value); setCasoCargado(''); }} />

            <label style={label}>Plazo (meses)</label>
            <input style={{ ...inp, marginBottom: '1.2rem' }} type="number" min="1" value={meses}
              onChange={(e) => { setMeses(e.target.value); setCasoCargado(''); }} />

            <label style={label}>Primera fecha de pago</label>
            <input style={{ ...inp, marginBottom: '1.2rem' }} type="date" value={primeraCuota}
              onChange={(e) => { setPrimeraCuota(e.target.value); setCasoCargado(''); }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#333', cursor: 'pointer', padding: '0.7rem 0.8rem', background: conDesgravamen ? '#EEF5FF' : '#F8F9FC', borderRadius: 10, border: `1.5px solid ${conDesgravamen ? AZUL : '#E0E6F0'}` }}>
              <input type="checkbox" checked={conDesgravamen} onChange={(e) => { setConDesgravamen(e.target.checked); setCasoCargado(''); }}
                style={{ width: 16, height: 16, accentColor: AZUL, flexShrink: 0 }} />
              <span>Con seguro de desgravamen <span style={{ color: AZUL, fontWeight: 700 }}>(TEA 40.92 %)</span></span>
            </label>
          </div>

          {/* Resultado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Error de red / validación del backend */}
            {error && (
              <div style={{ padding: '0.8rem 1rem', borderRadius: 12, fontSize: '0.82rem', background: '#FEF0F0', border: '1.5px solid #E74C3C', color: '#b3261e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-triangle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            {/* Cuota */}
            <div style={{ ...card, background: 'linear-gradient(120deg, #003580 0%, #004A9F 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, bottom: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Cuota mensual</div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.4rem', fontWeight: 900, color: AMARILLO, letterSpacing: '-1px', lineHeight: 1 }}>
                {resultado ? money(resultado.cuota) : (cargando ? 'Calculando…' : '—')}
              </div>
              {resultado && (
                <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  TEA {(resultado.tea * 100).toFixed(2)} % &nbsp;·&nbsp; TEM {(resultado.tem * 100).toFixed(4)} %
                </div>
              )}
            </div>

            {/* Resumen */}
            {resultado && (
              <div style={card}>
                <h3 style={{ margin: '0 0 0.9rem', color: '#1A1A2E', fontSize: '0.88rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: AZUL, marginRight: 6 }} /> Resumen
                </h3>
                {[
                  { label: 'Total a pagar',   valor: money(resultado.cuota * resultado.filas.length), color: '#1A1A2E' },
                  { label: 'Total intereses', valor: money(resultado.cuota * resultado.filas.length - Number(monto)), color: '#E74C3C' },
                  { label: 'N° de cuotas',    valor: `${resultado.filas.length} cuotas`, color: AZUL },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F5F7FA' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{r.label}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: r.color }}>{r.valor}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Badge de validación */}
            {casoRef && resultado && (
              <div style={{ padding: '0.8rem 1rem', borderRadius: 12, fontSize: '0.82rem', background: coincide ? '#E8F8F0' : '#FEF0F0', border: `1.5px solid ${coincide ? '#27AE60' : '#E74C3C'}`, color: coincide ? '#1b7a3d' : '#b3261e', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <i className={`fa-solid ${coincide ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{coincide ? '¡Caso validado!' : 'No coincide'}</div>
                  <div style={{ opacity: 0.85 }}>
                    {coincide
                      ? `Cuota calculada = esperada del Caso ${casoRef.id} (${money(casoRef.cuotaEsperada)}).`
                      : `Esperado ${money(casoRef.cuotaEsperada)} para el Caso ${casoRef.id}.`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cronograma */}
        {resultado && (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4FA' }}>
              <h3 style={{ margin: 0, color: '#1A1A2E', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-table" style={{ color: AZUL }} /> Cronograma de pagos
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#888', background: '#F0F4FA', padding: '0.25rem 0.7rem', borderRadius: 20, fontWeight: 600 }}>
                {resultado.filas.length} cuotas
              </span>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr style={{ background: AZUL }}>
                    <th style={{ ...th, textAlign: 'center' }}>N°</th>
                    <th style={{ ...th, textAlign: 'left' }}>Fecha</th>
                    <th style={th}>Cuota</th>
                    <th style={th}>Capital</th>
                    <th style={th}>Interés</th>
                    <th style={th}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.filas.map((f, i) => (
                    <tr key={f.n} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: AZUL }}>{f.n}</td>
                      <td style={{ ...td, textAlign: 'left', color: '#666', whiteSpace: 'nowrap' }}>{f.fecha}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#1A1A2E' }}>{f.cuota.toFixed(2)}</td>
                      <td style={td}>{f.capital.toFixed(2)}</td>
                      <td style={{ ...td, color: '#E74C3C' }}>{f.interes.toFixed(2)}</td>
                      <td style={{ ...td, fontWeight: 600, color: f.saldo === 0 ? '#27AE60' : '#333' }}>{f.saldo.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

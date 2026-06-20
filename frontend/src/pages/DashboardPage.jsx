import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerSesion, cerrarSesion } from '../services/authService';
import { getCuentas, getMovimientos } from '../services/dataService';

function formatoSoles(n) {
  return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFecha(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const acciones = [
  { icono: 'fa-right-left',   label: 'Transferir'       },
  { icono: 'fa-file-invoice', label: 'Estado de cuenta' },
  { icono: 'fa-credit-card',  label: 'Pagar cuota'      },
  { icono: 'fa-chart-bar',    label: 'Mis créditos'     },
];

export default function DashboardPage() {
  const navigate  = useNavigate();
  const sesion    = obtenerSesion();
  const usuario   = sesion?.usuario;
  const nombre    = usuario?.nombre || usuario?.email?.split('@')[0] || 'Cliente';
  const email     = usuario?.email || '';
  const inicial   = nombre.charAt(0).toUpperCase();

  const [tarjetas,    setTarjetas]    = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [errorCarga,  setErrorCarga]  = useState('');

  useEffect(() => {
    Promise.all([getCuentas(), getMovimientos()])
      .then(([cuentas, movs]) => { setTarjetas(cuentas); setMovimientos(movs); })
      .catch(err => setErrorCarga(err.response?.data?.message || 'No se pudieron cargar los datos.'))
      .finally(() => setCargando(false));
  }, []);

  function handleLogout() { cerrarSesion(); navigate('/'); }

  const totalSaldo = tarjetas.reduce((acc, t) => acc + Number(t.saldo), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2FA', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: '#004A9F',
        padding: '0 2rem',
        height: '64px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <i className="fa-solid fa-building-columns" style={{ color: '#F5C200', fontSize: '1.4rem' }} />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.5px' }}>CAJA PIURA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '0.4rem' }}>
            <i className="fa-solid fa-bell" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem' }} />
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#F5C200', borderRadius: '50%', border: '1.5px solid #004A9F' }} />
          </div>

          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #F5C200, #e0ac00)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#003580', fontSize: '0.95rem',
            }}>
              {inicial}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#fff' }}>{nombre}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Cliente activo</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', padding: '0.42rem 1rem', borderRadius: '8px',
            fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <i className="fa-solid fa-right-from-bracket" /> Salir
          </button>
        </div>
      </nav>

      {/* ── Hero banner ── */}
      <section style={{
        background: 'linear-gradient(120deg, #003580 0%, #004A9F 60%, #0060C8 100%)',
        color: '#fff', padding: '2.8rem 2rem 4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '6%',  top: '-40px',   width: '240px', height: '240px', background: 'rgba(0,174,239,0.14)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: '17%', bottom: '-70px', width: '150px', height: '150px', background: 'rgba(0,174,239,0.09)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: '42%',  top: '15px',    width: '60px',  height: '60px',  background: 'rgba(245,194,0,0.1)',   borderRadius: '50%' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '0.68rem' }} /> Sesión activa y segura
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.3rem' }}>
              Hola, <span style={{ color: '#F5C200' }}>{nombre}</span> 👋
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>Bienvenido a tu banca personal · Caja Piura</p>
          </div>

          {/* Glassmorphism total */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '18px', padding: '1.4rem 2rem', textAlign: 'center', minWidth: '210px',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              Saldo total
            </p>
            {cargando
              ? <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5C200' }}>…</p>
              : <p style={{ fontSize: '2rem', fontWeight: 900, color: '#F5C200', letterSpacing: '-0.5px' }}>{formatoSoles(totalSaldo)}</p>
            }
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.35rem' }}>Suma de todas tus cuentas</p>
          </div>
        </div>
      </section>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: '1100px', margin: '-1.8rem auto 0', padding: '0 2rem 3rem', position: 'relative', zIndex: 2 }}>

        {errorCarga && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffb3b3', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1.2rem', color: '#c0392b', fontSize: '0.87rem' }}>
            <i className="fa-solid fa-circle-xmark" style={{ marginRight: '0.5rem' }} />{errorCarga}
          </div>
        )}

        {/* ── Tarjetas de cuentas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.2rem', marginBottom: '1.6rem' }}>
          {cargando && (
            <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: '#aaa', boxShadow: '0 4px 20px rgba(0,74,159,0.06)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: '#004A9F', display: 'block', marginBottom: '0.6rem' }} />
              Cargando cuentas...
            </div>
          )}
          {!cargando && tarjetas.map((t) => (
            <div key={t.id} style={{
              background: '#fff', borderRadius: '16px', padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,74,159,0.07)',
              borderTop: `4px solid ${t.color}`,
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,74,159,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,74,159,0.07)'; }}
            >
              {/* Círculo deco */}
              <div style={{ position: 'absolute', right: '-18px', bottom: '-18px', width: '85px', height: '85px', background: `${t.color}0D`, borderRadius: '50%' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                <div style={{ width: '42px', height: '42px', background: `${t.color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${t.icono}`} style={{ color: t.color, fontSize: '1.1rem' }} />
                </div>
                <span style={{ background: `${t.color}15`, color: t.color, fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Activa
                </span>
              </div>

              <p style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>{t.label}</p>
              <p style={{ fontSize: '1.55rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.5px', marginBottom: '0.2rem' }}>{formatoSoles(t.saldo)}</p>
              <p style={{ fontSize: '0.71rem', color: '#ccc' }}>{t.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Grid principal ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 295px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Movimientos */}
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,74,159,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '1.3rem 1.6rem', borderBottom: '1px solid #F0F4FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '0.97rem', fontWeight: 700, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#004A9F' }} /> Últimos movimientos
              </h2>
              <span style={{ fontSize: '0.76rem', color: '#004A9F', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Ver todos <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.62rem' }} />
              </span>
            </div>

            <div>
              {cargando && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.3rem', color: '#004A9F', display: 'block', marginBottom: '0.5rem' }} />
                  Cargando movimientos...
                </div>
              )}
              {!cargando && movimientos.length === 0 && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#bbb', fontSize: '0.87rem' }}>Sin movimientos registrados.</div>
              )}
              {movimientos.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.6rem',
                  borderBottom: i < movimientos.length - 1 ? '1px solid #F7F9FC' : 'none',
                  transition: 'background 0.15s', cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F7F9FD'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '42px', height: '42px', flexShrink: 0,
                    background: m.tipo === 'entrada' ? '#E8F8F0' : '#FEF0F0',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`fa-solid ${m.tipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}`}
                      style={{ color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C', fontSize: '0.88rem' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.87rem', fontWeight: 600, color: '#1A1A2E', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.descripcion}
                    </p>
                    <p style={{ fontSize: '0.71rem', color: '#bbb' }}>{formatoFecha(m.fecha)}</p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 800, color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C', marginBottom: '0.15rem' }}>
                      {m.tipo === 'entrada' ? '+' : '-'}{formatoSoles(m.monto)}
                    </p>
                    <span style={{
                      fontSize: '0.63rem', fontWeight: 700,
                      color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C',
                      background: m.tipo === 'entrada' ? '#E8F8F0' : '#FEF0F0',
                      padding: '0.1rem 0.45rem', borderRadius: '6px',
                    }}>
                      {m.tipo === 'entrada' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Accesos rápidos */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,74,159,0.07)', padding: '1.3rem 1.4rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-bolt" style={{ color: '#F5C200' }} /> Accesos rápidos
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                {acciones.map((a) => (
                  <button key={a.label} style={{
                    background: '#F5F7FA', border: '1.5px solid #E8EEF8',
                    borderRadius: '12px', padding: '1rem 0.5rem',
                    fontSize: '0.74rem', color: '#333', fontWeight: 600,
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#004A9F';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = '#004A9F';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,74,159,0.22)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#F5F7FA';
                      e.currentTarget.style.color = '#333';
                      e.currentTarget.style.borderColor = '#E8EEF8';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <i className={`fa-solid ${a.icono}`} style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.4rem' }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Perfil */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,74,159,0.07)', overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(120deg, #003580 0%, #004A9F 100%)',
                padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
              }}>
                <div style={{
                  width: '46px', height: '46px',
                  background: 'linear-gradient(135deg, #F5C200, #e0ac00)',
                  borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '1.15rem', color: '#003580',
                }}>
                  {inicial}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: '0.2rem' }}>{nombre}</div>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, background: 'rgba(245,194,0,0.2)', color: '#F5C200', padding: '0.15rem 0.55rem', borderRadius: '10px' }}>
                    Cliente MYPE
                  </span>
                </div>
              </div>

              <div style={{ padding: '0.8rem 1.4rem' }}>
                {[
                  { label: 'Correo', valor: email,    icono: 'fa-envelope'     },
                  { label: 'Estado', valor: 'Activo', icono: 'fa-circle-check' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #F5F7FA' }}>
                    <span style={{ color: '#aaa', fontSize: '0.77rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className={`fa-solid ${row.icono}`} style={{ color: '#004A9F', fontSize: '0.72rem', width: '14px' }} />
                      {row.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.77rem', color: row.label === 'Estado' ? '#27AE60' : '#444', maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {row.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner seguridad */}
            <div style={{
              background: 'linear-gradient(120deg, #003580 0%, #004A9F 100%)',
              borderRadius: '16px', padding: '1.2rem 1.4rem', color: '#fff',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-25px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.55rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#F5C200', fontSize: '1.25rem' }} />
                <span style={{ fontWeight: 700, fontSize: '0.87rem' }}>Conexión segura</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>
                Nunca te pediremos tu contraseña por teléfono, correo o SMS.
              </p>
            </div>

          </div>
        </div>
      </div>

      <footer style={{ background: '#1A1A2E', color: '#555', textAlign: 'center', padding: '1.2rem', fontSize: '0.74rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS | Información protegida bajo Ley N° 29733
      </footer>
    </div>
  );
}

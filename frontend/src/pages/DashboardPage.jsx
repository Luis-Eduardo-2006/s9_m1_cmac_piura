import { useNavigate } from 'react-router-dom';
import { obtenerSesion, cerrarSesion } from '../services/authService';

const movimientos = [
  { fecha: '15/05/2026', descripcion: 'Depósito en efectivo',          monto: '+S/ 1,200.00', tipo: 'entrada' },
  { fecha: '13/05/2026', descripcion: 'Pago de cuota Crédito MYPE',    monto: '-S/   450.00', tipo: 'salida'  },
  { fecha: '10/05/2026', descripcion: 'Transferencia recibida',         monto: '+S/   800.00', tipo: 'entrada' },
  { fecha: '08/05/2026', descripcion: 'Retiro en cajero automático',    monto: '-S/   300.00', tipo: 'salida'  },
  { fecha: '05/05/2026', descripcion: 'Pago de servicios – Enosa',      monto: '-S/   120.00', tipo: 'salida'  },
];

const tarjetas = [
  { label: 'Cuenta de Ahorros', valor: 'S/ 3,450.00', sub: 'N° 001-0000123456',  color: '#004A9F', icono: 'fa-piggy-bank' },
  { label: 'Crédito MYPE',      valor: 'S/ 8,000.00', sub: 'Saldo pendiente',     color: '#F5C200', icono: 'fa-hand-holding-usd' },
  { label: 'Próxima cuota',     valor: 'S/   450.00', sub: 'Vence el 15/06/2026', color: '#E74C3C', icono: 'fa-calendar-day' },
  { label: 'CTS',               valor: 'S/ 1,200.00', sub: 'Depósito semestral',  color: '#27AE60', icono: 'fa-briefcase' },
];

const acciones = [
  { icono: 'fa-right-left',          label: 'Transferir'       },
  { icono: 'fa-file-invoice',        label: 'Estado de cuenta' },
  { icono: 'fa-credit-card',         label: 'Pagar cuota'      },
  { icono: 'fa-chart-bar',           label: 'Mis créditos'     },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const sesion   = obtenerSesion();
  const usuario  = sesion?.usuario;
  const nombre   = usuario?.nombre || usuario?.email?.split('@')[0] || 'Cliente';
  const email    = usuario?.email || '';

  function handleLogout() {
    cerrarSesion();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Navbar */}
      <nav style={{ background: '#004A9F', padding: '0.9rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <img
          src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png"
          alt="Caja Piura"
          style={{ height: '36px', objectFit: 'contain', cursor: 'pointer', filter: 'brightness(0) invert(1)' }}
          onClick={() => navigate('/')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: '36px', height: '36px', background: '#F5C200', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-user" style={{ color: '#fff', fontSize: '0.9rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{nombre}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>{email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Saludo */}
      <div style={{ background: 'linear-gradient(90deg, #003580, #004A9F)', padding: '1.8rem 2rem', color: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.2rem' }}>
              <i className="fa-solid fa-hand-wave" style={{ marginRight: '0.5rem', color: '#F5C200' }} />
              Bienvenido, <span style={{ color: '#F5C200' }}>{nombre}</span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '0.75rem' }} />
              Último acceso: hoy 17 de mayo de 2026 — Sesión activa y segura
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#F5C200', fontSize: '1.5rem' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        {/* Tarjetas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
          {tarjetas.map((t) => (
            <div key={t.label} style={{ background: '#fff', borderRadius: '12px', padding: '1.4rem', boxShadow: '0 2px 12px rgba(0,74,159,0.08)', borderLeft: `5px solid ${t.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: t.color }}>{t.valor}</p>
                  <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.2rem' }}>{t.sub}</p>
                </div>
                <div style={{ width: '40px', height: '40px', background: `${t.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${t.icono}`} style={{ color: t.color, fontSize: '1.1rem' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Movimientos */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,74,159,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #F0F5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#004A9F' }} /> Últimos movimientos
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#004A9F', cursor: 'pointer', fontWeight: 600 }}>
                Ver todos <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }} />
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F5F7FA' }}>
                  <th style={{ textAlign: 'left', padding: '0.7rem 1.5rem', color: '#666', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem', color: '#666', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '0.7rem 1.5rem', color: '#666', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F0F0F8' }}>
                    <td style={{ padding: '0.9rem 1.5rem', color: '#888', fontSize: '0.78rem' }}>{m.fecha}</td>
                    <td style={{ padding: '0.9rem 0.7rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className={`fa-solid ${m.tipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}`}
                        style={{ color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C', fontSize: '0.7rem', width: '16px' }} />
                      {m.descripcion}
                    </td>
                    <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', fontWeight: 700, color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C' }}>{m.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Accesos rápidos */}
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,74,159,0.08)', padding: '1.2rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-bolt" style={{ color: '#F5C200' }} /> Accesos rápidos
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                {acciones.map((a) => (
                  <button key={a.label}
                    style={{ background: '#F0F5FF', border: '1px solid #C5D8FF', borderRadius: '10px', padding: '0.9rem 0.5rem', fontSize: '0.78rem', color: '#004A9F', fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#004A9F'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F0F5FF'; e.currentTarget.style.color = '#004A9F'; }}
                  >
                    <i className={`fa-solid ${a.icono}`} style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.3rem' }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Perfil */}
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,74,159,0.08)', padding: '1.2rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-user-circle" style={{ color: '#004A9F' }} /> Mi perfil
              </h3>
              {[
                { label: 'Nombre',      valor: nombre,    icono: 'fa-user' },
                { label: 'Correo',      valor: email,     icono: 'fa-envelope' },
                { label: 'Tipo cliente', valor: 'MYPE',   icono: 'fa-tag' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className={`fa-solid ${row.icono}`} style={{ color: '#004A9F', width: '14px' }} />
                    {row.label}
                  </span>
                  <span style={{ fontWeight: 600, color: row.label === 'Tipo cliente' ? '#F5C200' : '#333', fontSize: row.label === 'Correo' ? '0.74rem' : '0.82rem', maxWidth: '140px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.valor}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <footer style={{ marginTop: '3rem', background: '#1A1A2E', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS | Información protegida bajo Ley N° 29733
      </footer>
    </div>
  );
}

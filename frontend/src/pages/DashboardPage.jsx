import { useNavigate } from 'react-router-dom';
import { obtenerSesion, cerrarSesion } from '../services/authService';

const movimientos = [
  { fecha: '15/05/2026', descripcion: 'Depósito en efectivo', monto: '+S/ 1,200.00', tipo: 'entrada' },
  { fecha: '13/05/2026', descripcion: 'Pago de cuota Crédito MYPE', monto: '-S/ 450.00', tipo: 'salida' },
  { fecha: '10/05/2026', descripcion: 'Transferencia recibida', monto: '+S/ 800.00', tipo: 'entrada' },
  { fecha: '08/05/2026', descripcion: 'Retiro en cajero automático', monto: '-S/ 300.00', tipo: 'salida' },
  { fecha: '05/05/2026', descripcion: 'Pago de servicios – Enosa', monto: '-S/ 120.00', tipo: 'salida' },
];

export default function DashboardPage() {
  const navigate  = useNavigate();
  const sesion    = obtenerSesion();
  const usuario   = sesion?.usuario;
  const nombre    = usuario?.nombre || usuario?.email?.split('@')[0] || 'Cliente';
  const email     = usuario?.email || '';

  function handleLogout() {
    cerrarSesion();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F0' }}>

      {/* Navbar */}
      <nav style={{ background: '#8B0000', padding: '0.9rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ background: '#fff', color: '#8B0000', fontWeight: 900, fontSize: '1rem', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>CAJA</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>PIURA</div>
            <div style={{ color: '#F5C518', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '1px' }}>MI BANCA</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', color: '#fff' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{nombre}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Saludo */}
      <div style={{ background: 'linear-gradient(90deg, #8B0000, #A50000)', padding: '1.8rem 2rem', color: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            👋 Bienvenido, <strong>{nombre}</strong>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
            Último acceso: hoy 17 de mayo de 2026 — Sesión activa y segura 🔒
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        {/* Tarjetas de cuentas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
          {[
            { label: 'Cuenta de Ahorros', valor: 'S/ 3,450.00', sub: 'N° 001-0000123456', color: '#8B0000', icono: '💰' },
            { label: 'Crédito MYPE', valor: 'S/ 8,000.00', sub: 'Saldo pendiente', color: '#C8960C', icono: '📋' },
            { label: 'Próxima cuota', valor: 'S/ 450.00', sub: 'Vence el 15/06/2026', color: '#C0392B', icono: '📅' },
            { label: 'CTS', valor: 'S/ 1,200.00', sub: 'Depósito semestral', color: '#27AE60', icono: '🏦' },
          ].map((t) => (
            <div key={t.label} style={{ background: '#fff', borderRadius: '10px', padding: '1.4rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `5px solid ${t.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.3rem', fontWeight: 500 }}>{t.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: t.color }}>{t.valor}</p>
                  <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.2rem' }}>{t.sub}</p>
                </div>
                <div style={{ fontSize: '1.8rem' }}>{t.icono}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Movimientos recientes */}
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#333' }}>Últimos movimientos</h2>
              <span style={{ fontSize: '0.78rem', color: '#8B0000', cursor: 'pointer', fontWeight: 600 }}>Ver todos →</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8F8F8' }}>
                  <th style={{ textAlign: 'left', padding: '0.7rem 1.5rem', color: '#666', fontWeight: 600, fontSize: '0.78rem' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem', color: '#666', fontWeight: 600, fontSize: '0.78rem' }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '0.7rem 1.5rem', color: '#666', fontWeight: 600, fontSize: '0.78rem' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.78rem' }}>{m.fecha}</td>
                    <td style={{ padding: '0.85rem 0.7rem', color: '#333' }}>{m.descripcion}</td>
                    <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right', fontWeight: 700, color: m.tipo === 'entrada' ? '#27AE60' : '#E74C3C' }}>{m.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Accesos rápidos */}
            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '1.2rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333', marginBottom: '1rem' }}>Accesos rápidos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                {[
                  { icono: '↔️', label: 'Transferir' },
                  { icono: '📄', label: 'Estado de cuenta' },
                  { icono: '💳', label: 'Pagar cuota' },
                  { icono: '📊', label: 'Mis créditos' },
                ].map((accion) => (
                  <button key={accion.label} style={{ background: '#FFF5F5', border: '1px solid #FFD5D5', borderRadius: '8px', padding: '0.8rem 0.5rem', fontSize: '0.78rem', color: '#8B0000', fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#8B0000'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.color = '#8B0000'; }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{accion.icono}</div>
                    {accion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info usuario */}
            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '1.2rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333', marginBottom: '0.8rem' }}>Mi perfil</h3>
              <div style={{ fontSize: '0.82rem', color: '#555' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Nombre</span>
                  <span style={{ fontWeight: 600 }}>{nombre}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Correo</span>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Tipo cliente</span>
                  <span style={{ fontWeight: 600, color: '#8B0000' }}>MYPE</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', background: '#1A1A1A', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS | Información protegida bajo Ley N° 29733
      </footer>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export default function BancaPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>

      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E0E6EF', padding: '0.9rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <img
          src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png"
          alt="Caja Piura"
          style={{ height: '40px', objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
        <span style={{ color: '#666', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left" style={{ color: '#004A9F' }} /> Volver al inicio
        </span>
      </nav>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '3rem 2.5rem', maxWidth: '500px', width: '100%', boxShadow: '0 8px 32px rgba(0,74,159,0.10)', textAlign: 'center' }}>

          {/* Icono */}
          <div style={{ width: '76px', height: '76px', background: 'linear-gradient(135deg, #004A9F, #0060C8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <i className="fa-solid fa-lock" style={{ color: '#fff', fontSize: '1.8rem' }} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#004A9F', marginBottom: '0.5rem' }}>
            Caja Digital
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Accede de forma segura a tu cuenta Caja Piura y gestiona tus finanzas desde cualquier lugar, las 24 horas.
          </p>

          {/* Beneficios */}
          <div style={{ background: '#F0F5FF', border: '1px solid #C5D8FF', borderRadius: '10px', padding: '1.2rem', marginBottom: '1.8rem', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#004A9F', fontSize: '0.85rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-star" style={{ color: '#F5C200' }} /> ¿Qué puedes hacer?
            </div>
            {[
              { icon: 'fa-chart-line',      text: 'Consultar saldos y movimientos' },
              { icon: 'fa-right-left',      text: 'Realizar transferencias interbancarias' },
              { icon: 'fa-file-invoice-dollar', text: 'Pagar cuotas de crédito' },
              { icon: 'fa-file-lines',      text: 'Generar estado de cuenta' },
            ].map((item) => (
              <div key={item.text} style={{ fontSize: '0.83rem', color: '#444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: '#004A9F', width: '16px' }} />
                {item.text}
              </div>
            ))}
          </div>

          {/* Zona segura */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.8rem', background: '#F0FFF4', border: '1px solid #B7E4C7', borderRadius: '8px', padding: '0.7rem 1rem' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#27AE60', fontSize: '1rem' }} />
            <span style={{ fontSize: '0.8rem', color: '#1E7E4A', fontWeight: 500 }}>
              Conexión segura SSL 256-bit · Zona certificada SBS
            </span>
          </div>

          <button
            className="btn btn-azul"
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '8px', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-right-to-bracket" /> Ingresar a mi cuenta
          </button>

          <p style={{ marginTop: '1.2rem', fontSize: '0.78rem', color: '#999' }}>
            ¿Problemas para ingresar? <strong style={{ color: '#004A9F' }}>(073) 284-300</strong>
          </p>
        </div>

        {/* Aviso de seguridad */}
        <div style={{ marginTop: '1.5rem', maxWidth: '500px', width: '100%', background: '#FFFBEB', border: '1px solid #F5C518', borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: '#D4A000', fontSize: '1rem', marginTop: '0.1rem' }} />
          <p style={{ fontSize: '0.78rem', color: '#7A6000', lineHeight: 1.5 }}>
            <strong>Aviso de seguridad:</strong> Caja Piura nunca te pedirá tu contraseña por correo, WhatsApp o llamadas. Si recibes este tipo de solicitudes, repórtalo al <strong>0800-10840</strong>.
          </p>
        </div>
      </div>

      <div style={{ background: '#1A1A2E', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS | RUC: 20112887341
      </div>
    </div>
  );
}

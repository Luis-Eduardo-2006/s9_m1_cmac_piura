import { useNavigate } from 'react-router-dom';

export default function BancaPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F0F0' }}>

      {/* Header */}
      <nav style={{ background: '#8B0000', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#fff', color: '#8B0000', fontWeight: 900, fontSize: '1rem', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>CAJA</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>PIURA</div>
            <div style={{ color: '#F5C518', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '1px' }}>CMAC PIURA S.A.</div>
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>← Volver al inicio</span>
      </nav>

      {/* Contenido principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>

        {/* Card zona segura */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '3rem 2.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center' }}>

          {/* Icono candado */}
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #8B0000, #A50000)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            🔒
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8B0000', marginBottom: '0.5rem' }}>
            Banca por Internet
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Accede de forma segura a tu cuenta CMAC Piura y gestiona tus finanzas desde cualquier lugar.
          </p>

          {/* Beneficios */}
          <div style={{ background: '#FFF5F5', border: '1px solid #FFD5D5', borderRadius: '8px', padding: '1.2rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, color: '#8B0000', fontSize: '0.85rem', marginBottom: '0.8rem' }}>¿Qué puedes hacer?</div>
            {[
              '✓  Consultar saldos y movimientos',
              '✓  Realizar transferencias interbancarias',
              '✓  Pagar tus cuotas de crédito',
              '✓  Generar estado de cuenta',
            ].map((item) => (
              <div key={item} style={{ fontSize: '0.83rem', color: '#555', marginBottom: '0.4rem' }}>{item}</div>
            ))}
          </div>

          {/* Zona segura */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.8rem', background: '#F0FFF4', border: '1px solid #B7E4C7', borderRadius: '6px', padding: '0.6rem 1rem' }}>
            <span style={{ fontSize: '1rem' }}>🛡️</span>
            <span style={{ fontSize: '0.8rem', color: '#2D6A4F', fontWeight: 500 }}>
              Conexión segura SSL 256-bit | Zona certificada por la SBS
            </span>
          </div>

          <button
            className="btn btn-rojo"
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '6px' }}
          >
            Ingresar a mi cuenta →
          </button>

          <p style={{ marginTop: '1.2rem', fontSize: '0.78rem', color: '#999' }}>
            ¿Problemas para ingresar? Llama al <strong style={{ color: '#8B0000' }}>(073) 284-300</strong>
          </p>
        </div>

        {/* Aviso de seguridad */}
        <div style={{ marginTop: '1.5rem', maxWidth: '480px', width: '100%', background: '#FFF8DC', border: '1px solid #F5C518', borderRadius: '8px', padding: '1rem 1.2rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <p style={{ fontSize: '0.78rem', color: '#7A6000', lineHeight: 1.5 }}>
            <strong>Aviso de seguridad:</strong> CMAC Piura nunca te pedirá tu contraseña por correo electrónico, WhatsApp o llamadas telefónicas. Si recibes este tipo de solicitudes, repórtalo al 0800-10840.
          </p>
        </div>
      </div>

      {/* Footer mínimo */}
      <div style={{ background: '#1A1A1A', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS | RUC: 20112887341
      </div>
    </div>
  );
}

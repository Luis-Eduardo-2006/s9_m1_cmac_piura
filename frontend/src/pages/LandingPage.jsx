import { useNavigate } from 'react-router-dom';

const productos = [
  {
    icono: '🏦',
    titulo: 'Cuenta de Ahorros',
    desc: 'La mejor tasa del mercado para hacer crecer tu dinero. Sin comisiones de mantenimiento.',
  },
  {
    icono: '💳',
    titulo: 'Crédito MYPE',
    desc: 'Financiamiento desde S/ 500 hasta S/ 50,000 para impulsar tu negocio.',
  },
  {
    icono: '🌾',
    titulo: 'Crédito Agropecuario',
    desc: 'Apoyo financiero para productores agrícolas y ganaderos de la región Piura.',
  },
  {
    icono: '🏠',
    titulo: 'Crédito Hipotecario',
    desc: 'Haz realidad el sueño de tu casa propia con cuotas accesibles.',
  },
  {
    icono: '📱',
    titulo: 'CTS',
    desc: 'Deposita tu CTS con nosotros y accede a la mejor tasa de interés del mercado.',
  },
  {
    icono: '🛡️',
    titulo: 'Seguros',
    desc: 'Protege lo que más importa con nuestros planes de seguro de vida y accidentes.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Barra superior */}
      <div style={{ background: '#6B0000', padding: '0.4rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#ddd' }}>
        <span>📞 (073) 284-300 &nbsp;|&nbsp; 📧 atencionalcliente@cajapiura.com.pe</span>
        <span>Lunes a Viernes: 8:00am – 6:00pm &nbsp;|&nbsp; Sábados: 8:00am – 1:00pm</span>
      </div>

      {/* Navbar principal */}
      <nav style={{ background: '#fff', borderBottom: '3px solid #8B0000', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#8B0000', color: '#fff', fontWeight: 900, fontSize: '1.1rem', padding: '0.4rem 0.7rem', borderRadius: '4px', letterSpacing: '1px' }}>
            CAJA
          </div>
          <div>
            <div style={{ color: '#8B0000', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>PIURA</div>
            <div style={{ color: '#C8960C', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '1px' }}>CMAC PIURA S.A.</div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.88rem', fontWeight: 500 }}>
          <span style={{ color: '#333', cursor: 'pointer' }}>Personas</span>
          <span style={{ color: '#333', cursor: 'pointer' }}>Empresas</span>
          <span style={{ color: '#333', cursor: 'pointer' }}>Ahorros</span>
          <span style={{ color: '#333', cursor: 'pointer' }}>Créditos</span>
          <span style={{ color: '#333', cursor: 'pointer' }}>Seguros</span>
          <span style={{ color: '#333', cursor: 'pointer' }}>Tarifario</span>
          <button
            className="btn btn-rojo"
            onClick={() => navigate('/banca')}
            style={{ fontSize: '0.85rem' }}
          >
            🔐 Banca por Internet
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #6B0000 0%, #8B0000 40%, #A50000 100%)', color: '#fff', padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'rgba(200,150,12,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: '#C8960C', color: '#fff', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '1px' }}>
            ✦ TU CAJA DE CONFIANZA DESDE 1992
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1.2rem', lineHeight: 1.2 }}>
            Finanzas para el<br />microempresario peruano
          </h1>
          <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem', color: 'rgba(255,255,255,0.9)' }}>
            Más de 30 años impulsando el desarrollo económico de Piura y el norte del Perú.
            Ahorros seguros, créditos accesibles, atención personalizada.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-dorado" onClick={() => navigate('/banca')} style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
              Ingresar a Banca por Internet
            </button>
            <button className="btn btn-outline-blanco" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
              Solicitar un Crédito
            </button>
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', padding: '1.5rem 2rem', gap: '1rem' }}>
          {[
            { valor: '+600,000', label: 'Clientes activos' },
            { valor: '90+', label: 'Agencias en Piura' },
            { valor: '30+', label: 'Años de experiencia' },
            { valor: 'AAA', label: 'Calificación crediticia' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8B0000' }}>{item.valor}</div>
              <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.2rem' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section style={{ padding: '4rem 2rem', background: '#F8F8F8' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A1A1A' }}>Nuestros Productos</h2>
            <div style={{ width: '60px', height: '4px', background: '#8B0000', margin: '0.8rem auto 0', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {productos.map((p) => (
              <div key={p.titulo} style={{ background: '#fff', borderRadius: '8px', padding: '1.8rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: '4px solid #8B0000', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>{p.icono}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#8B0000', marginBottom: '0.5rem' }}>{p.titulo}</h3>
                <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner banca digital */}
      <section style={{ background: 'linear-gradient(90deg, #8B0000, #C0392B)', color: '#fff', padding: '3.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              📱 Banca Digital CMAC Piura
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', maxWidth: '500px' }}>
              Gestiona tus cuentas, realiza transferencias y consulta tus movimientos las 24 horas del día desde cualquier dispositivo.
            </p>
          </div>
          <button className="btn btn-dorado" onClick={() => navigate('/banca')} style={{ fontSize: '1rem', padding: '0.9rem 2rem', whiteSpace: 'nowrap' }}>
            Ingresar ahora →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A1A1A', color: '#999', padding: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>CAJA PIURA</div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.7 }}>Caja Municipal de Ahorro y Crédito de Piura S.A.C.<br />RUC: 20112887341</p>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.85rem' }}>Productos</div>
            {['Ahorros', 'Créditos', 'CTS', 'Seguros', 'Fondos Mutuos'].map(item => (
              <div key={item} style={{ fontSize: '0.8rem', marginBottom: '0.4rem', cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.85rem' }}>Atención al Cliente</div>
            {['Central: (073) 284-300', 'WhatsApp: 962 000 000', 'Email: atencionalcliente@cajapiura.com.pe', 'SBS: 0800-10840 (gratuito)'].map(item => (
              <div key={item} style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.85rem' }}>Legal</div>
            {['Términos y Condiciones', 'Política de Privacidad', 'Tarifario', 'Libro de Reclamaciones'].map(item => (
              <div key={item} style={{ fontSize: '0.8rem', marginBottom: '0.4rem', cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #333', paddingTop: '1.2rem', textAlign: 'center', fontSize: '0.78rem' }}>
          © 2026 Caja Municipal de Ahorro y Crédito de Piura S.A.C. | Supervisada por la SBS
        </div>
      </footer>
    </div>
  );
}

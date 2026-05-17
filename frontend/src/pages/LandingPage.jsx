import { useNavigate } from 'react-router-dom';

const productos = [
  { icono: 'fa-piggy-bank',     titulo: 'Cuenta de Ahorros',       desc: 'La mejor tasa del mercado para hacer crecer tu dinero. Sin comisiones de mantenimiento.' },
  { icono: 'fa-hand-holding-usd', titulo: 'Crédito MYPE',          desc: 'Financiamiento desde S/ 500 hasta S/ 50,000 para impulsar tu negocio.' },
  { icono: 'fa-tractor',        titulo: 'Crédito Agropecuario',     desc: 'Apoyo financiero para productores agrícolas y ganaderos de la región Piura.' },
  { icono: 'fa-house-chimney',  titulo: 'Crédito Hipotecario',      desc: 'Haz realidad el sueño de tu casa propia con cuotas accesibles.' },
  { icono: 'fa-briefcase',      titulo: 'CTS',                      desc: 'Deposita tu CTS y accede a la mejor tasa de interés del mercado.' },
  { icono: 'fa-shield-halved',  titulo: 'Seguros',                  desc: 'Protege lo que más importa con nuestros planes de seguro de vida y accidentes.' },
];

const stats = [
  { valor: '+600,000', label: 'Clientes activos',    icono: 'fa-users' },
  { valor: '90+',      label: 'Agencias en Piura',   icono: 'fa-location-dot' },
  { valor: '44',       label: 'Años de experiencia', icono: 'fa-calendar-check' },
  { valor: 'AAA',      label: 'Calificación crediticia', icono: 'fa-star' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Barra superior */}
      <div style={{ background: '#002D6E', padding: '0.35rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span><i className="fa-solid fa-phone" style={{ marginRight: '0.4rem', color: '#F5C200' }} />(073) 284-300</span>
          <span><i className="fa-solid fa-envelope" style={{ marginRight: '0.4rem', color: '#F5C200' }} />atencionalcliente@cajapiura.com.pe</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.3rem', color: '#F5C200' }} />Emergencia</span>
          <span><i className="fa-solid fa-universal-access" style={{ marginRight: '0.3rem' }} />Accesibilidad</span>
          <span>Lun–Vie: 8:00am – 6:00pm</span>
        </div>
      </div>

      {/* Navbar principal */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E0E6EF', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <img
          src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png"
          alt="Caja Piura"
          style={{ height: '42px', objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <div style={{ display: 'flex', gap: '1.8rem', alignItems: 'center', fontSize: '0.88rem', fontWeight: 500, color: '#333' }}>
          {['Productos', 'Operaciones', 'Caja Digital', 'Promociones'].map(item => (
            <span key={item} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onMouseEnter={e => e.currentTarget.style.color = '#004A9F'}
              onMouseLeave={e => e.currentTarget.style.color = '#333'}
            >
              {item} <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem' }} />
            </span>
          ))}
          <span style={{ cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#004A9F'}
            onMouseLeave={e => e.currentTarget.style.color = '#333'}
          >
            ¿Necesitas Ayuda? <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem' }} />
          </span>
          <i className="fa-solid fa-magnifying-glass" style={{ color: '#555', cursor: 'pointer', fontSize: '1rem' }} />
          <i className="fa-solid fa-phone" style={{ color: '#555', cursor: 'pointer', fontSize: '1rem' }} />
          <button
            className="btn btn-azul"
            onClick={() => navigate('/banca')}
            style={{ borderRadius: '25px', padding: '0.55rem 1.3rem', fontSize: '0.85rem' }}
          >
            Banca por internet
          </button>
        </div>
      </nav>

      {/* Tabs Para mí / Para mi negocio */}
      <div style={{ background: '#004A9F', display: 'flex', gap: 0 }}>
        <button style={{ background: '#F5C200', color: '#fff', border: 'none', padding: '0.6rem 1.8rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
          Para mí
        </button>
        <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', padding: '0.6rem 1.8rem', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
        >
          Para mi negocio
        </button>
      </div>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(120deg, #003580 0%, #004A9F 60%, #0060C8 100%)', color: '#fff', padding: '4.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '380px', position: 'relative', overflow: 'hidden' }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', right: '38%', top: '50%', transform: 'translateY(-50%)', width: '180px', height: '180px', background: 'rgba(0,174,239,0.18)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: '34%', bottom: '-40px', width: '100px', height: '100px', background: 'rgba(0,174,239,0.12)', borderRadius: '50%' }} />

        <div style={{ maxWidth: '520px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Impulsando<br />
            <span style={{ color: '#F5C200', fontStyle: 'italic' }}>oportunidades</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Estás viendo <span style={{ color: '#F5C200' }}>soluciones para ti.</span>
          </p>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>
            ¿Necesitas opciones para tu negocio?
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" style={{ background: '#1A1A2E', color: '#fff', borderRadius: '8px', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/banca')}>
              <i className="fa-solid fa-briefcase" /> Para mi negocio
            </button>
            <button className="btn btn-amarillo" style={{ borderRadius: '8px', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/banca')}>
              <i className="fa-solid fa-right-to-bracket" /> Banca por internet
            </button>
          </div>
        </div>

        {/* Badge 44 años */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: '180px', height: '180px', background: '#F5C200', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(245,194,0,0.45)' }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#003580', lineHeight: 1 }}>44</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#003580' }}>años</div>
          </div>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '40px', height: '40px', background: '#00AEEF', borderRadius: '50%', opacity: 0.7 }} />
          <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '25px', height: '25px', background: '#00AEEF', borderRadius: '50%', opacity: 0.5 }} />
        </div>
      </section>

      {/* Indicadores */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E0E6EF' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', padding: '1.8rem 2rem', gap: '1rem' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ padding: '0.5rem' }}>
              <i className={`fa-solid ${s.icono}`} style={{ color: '#F5C200', fontSize: '1.4rem', marginBottom: '0.5rem', display: 'block' }} />
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#004A9F' }}>{s.valor}</div>
              <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Simula tu crédito — banner */}
      <section style={{ background: 'linear-gradient(90deg, #f5f7fa 60%, #e8f0fb 100%)', padding: '2.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '0.4rem' }}>
            Simula tu crédito o ahorro <span style={{ color: '#F5C200' }}>con Caja Piura</span>
          </h2>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>Calcula tus cuotas y tasas en segundos, sin compromiso.</p>
        </div>
        <button className="btn btn-amarillo" style={{ whiteSpace: 'nowrap', borderRadius: '8px', padding: '0.8rem 2rem', fontSize: '0.95rem' }}>
          <i className="fa-solid fa-calculator" /> Simular ahora
        </button>
      </section>

      {/* Productos */}
      <section style={{ padding: '4rem 2rem', background: '#F5F7FA' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A1A2E' }}>Nuestros Productos</h2>
            <div style={{ width: '60px', height: '4px', background: '#F5C200', margin: '0.8rem auto 0', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {productos.map((p) => (
              <div key={p.titulo}
                style={{ background: '#fff', borderRadius: '10px', padding: '1.8rem', boxShadow: '0 2px 12px rgba(0,74,159,0.07)', borderTop: '4px solid #004A9F', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,74,159,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,74,159,0.07)'; }}
              >
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #004A9F, #0060C8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <i className={`fa-solid ${p.icono}`} style={{ color: '#fff', fontSize: '1.2rem' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#004A9F', marginBottom: '0.5rem' }}>{p.titulo}</h3>
                <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: '1rem' }}>{p.desc}</p>
                <span style={{ fontSize: '0.82rem', color: '#F5C200', fontWeight: 600, cursor: 'pointer' }}>
                  Ver más <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Caja Digital */}
      <section style={{ background: 'linear-gradient(90deg, #004A9F, #0060C8)', color: '#fff', padding: '3.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem' }}>
            <div style={{ width: '44px', height: '44px', background: '#F5C200', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-mobile-screen" style={{ color: '#fff', fontSize: '1.3rem' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Caja Digital</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: '500px' }}>
            Gestiona tus cuentas, realiza transferencias y consulta tus movimientos las 24 horas desde cualquier dispositivo.
          </p>
        </div>
        <button className="btn btn-amarillo" onClick={() => navigate('/banca')} style={{ borderRadius: '8px', padding: '0.9rem 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-right-to-bracket" /> Ingresar ahora
        </button>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A1A2E', color: '#aaa', padding: '3rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <img src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png" alt="Caja Piura" style={{ height: '36px', marginBottom: '0.8rem', filter: 'brightness(0) invert(1)', objectFit: 'contain' }} />
            <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#888' }}>Caja Municipal de Ahorro y Crédito de Piura S.A.C.<br />RUC: 20112887341</p>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
              {['fa-facebook-f', 'fa-instagram', 'fa-linkedin-in', 'fa-youtube'].map(icon => (
                <div key={icon} style={{ width: '32px', height: '32px', background: '#004A9F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className={`fa-brands ${icon}`} style={{ color: '#fff', fontSize: '0.8rem' }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem', fontSize: '0.88rem' }}>Productos</div>
            {['Ahorros', 'Créditos', 'CTS', 'Seguros', 'Fondos Mutuos'].map(item => (
              <div key={item} style={{ fontSize: '0.8rem', marginBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', color: '#F5C200' }} />{item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem', fontSize: '0.88rem' }}>Atención al Cliente</div>
            {[
              { icon: 'fa-phone', text: '(073) 284-300' },
              { icon: 'fa-whatsapp', text: '962 000 000' },
              { icon: 'fa-envelope', text: 'atencionalcliente@cajapiura.com.pe' },
              { icon: 'fa-headset', text: 'SBS: 0800-10840 (gratuito)' },
            ].map(item => (
              <div key={item.text} style={{ fontSize: '0.78rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <i className={`fa-${item.icon.includes('whatsapp') ? 'brands' : 'solid'} ${item.icon}`} style={{ color: '#F5C200', marginTop: '0.1rem', minWidth: '14px' }} />
                {item.text}
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem', fontSize: '0.88rem' }}>Legal</div>
            {['Términos y Condiciones', 'Política de Privacidad', 'Tarifario', 'Libro de Reclamaciones'].map(item => (
              <div key={item} style={{ fontSize: '0.8rem', marginBottom: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', color: '#F5C200' }} />{item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2D2D4E', paddingTop: '1.2rem', textAlign: 'center', fontSize: '0.78rem' }}>
          © 2026 Caja Municipal de Ahorro y Crédito de Piura S.A.C. | Supervisada por la SBS
        </div>
      </footer>
    </div>
  );
}

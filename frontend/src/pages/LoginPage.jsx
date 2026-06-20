import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, guardarSesion } from '../services/authService';
import { useResponsive } from '../hooks/useResponsive';

export default function LoginPage() {
  const navigate    = useNavigate();
  const { isMobile } = useResponsive();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [exito,    setExito]    = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPass,  setVerPass]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');
    if (!email || !password) { setError('Por favor completa todos los campos.'); return; }
    setCargando(true);
    try {
      const data = await login(email, password);
      guardarSesion(data.token, data.user);
      setExito('¡Autenticación exitosa! Redirigiendo...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas. Verifica tus datos.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>

      {/* Header */}
      <nav style={{ background: '#004A9F', padding: isMobile ? '0.75rem 1rem' : '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img
          src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png"
          alt="Caja Piura"
          style={{ height: '34px', objectFit: 'contain', cursor: 'pointer', filter: 'brightness(0) invert(1)' }}
          onClick={() => navigate('/')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>
          <i className="fa-solid fa-lock" />
          {!isMobile && <span>Conexión segura</span>}
        </div>
      </nav>

      {/* Formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,74,159,0.12)', overflow: 'hidden' }}>

          {/* Encabezado del card */}
          <div style={{ background: 'linear-gradient(135deg, #003580, #004A9F)', padding: isMobile ? '1.5rem 1.2rem' : '2rem', textAlign: 'center', color: '#fff' }}>
            <img
              src="https://images.seeklogo.com/logo-png/29/1/caja-piura-logo-png_seeklogo-299545.png"
              alt="Caja Piura"
              style={{ height: '34px', objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: '1rem' }}
            />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Caja Digital</h2>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>Ingresa con tus credenciales de acceso</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1.5rem 1.2rem' : '2rem' }}>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#333', marginBottom: '0.4rem' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#004A9F', marginRight: '0.4rem' }} />
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #E0E6EF', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#004A9F'}
                onBlur={e  => e.target.style.borderColor = '#E0E6EF'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#333', marginBottom: '0.4rem' }}>
                <i className="fa-solid fa-key" style={{ color: '#004A9F', marginRight: '0.4rem' }} />
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ display: 'block', width: '100%', padding: '0.75rem 2.8rem 0.75rem 1rem', border: '1.5px solid #E0E6EF', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#004A9F'}
                  onBlur={e  => e.target.style.borderColor = '#E0E6EF'}
                />
                <i
                  className={`fa-solid ${verPass ? 'fa-eye-slash' : 'fa-eye'}`}
                  onClick={() => setVerPass(!verPass)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa', cursor: 'pointer', padding: '0.4rem' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-circle-xmark" style={{ color: '#e74c3c', flexShrink: 0 }} />
                <span className="error-msg" style={{ marginTop: 0 }}>{error}</span>
              </div>
            )}

            {exito && (
              <div style={{ background: '#F0FFF4', border: '1px solid #B7E4C7', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#27ae60', flexShrink: 0 }} />
                <span className="success-msg" style={{ marginTop: 0 }}>{exito}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-azul"
              disabled={cargando}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '8px', justifyContent: 'center', opacity: cargando ? 0.75 : 1 }}
            >
              {cargando
                ? <><i className="fa-solid fa-spinner fa-spin" /> Verificando...</>
                : <><i className="fa-solid fa-right-to-bracket" /> Ingresar</>
              }
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#004A9F', cursor: 'pointer', fontWeight: 500 }}>
                <i className="fa-solid fa-circle-question" style={{ marginRight: '0.3rem' }} />
                ¿Olvidaste tu contraseña?
              </span>
            </div>
          </form>

          <div style={{ background: '#F5F7FA', borderTop: '1px solid #E0E6EF', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#004A9F', fontSize: '0.85rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#888' }}>Protegido con cifrado SSL de 256 bits</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#1A1A2E', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS
      </div>
    </div>
  );
}

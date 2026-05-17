import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, guardarSesion } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F0F0' }}>

      {/* Header */}
      <nav style={{ background: '#8B0000', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ background: '#fff', color: '#8B0000', fontWeight: 900, fontSize: '1rem', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>CAJA</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>PIURA</div>
            <div style={{ color: '#F5C518', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '1px' }}>CMAC PIURA S.A.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>
          <span>🔒</span>
          <span>Conexión segura</span>
        </div>
      </nav>

      {/* Formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Encabezado del card */}
          <div style={{ background: 'linear-gradient(135deg, #8B0000, #A50000)', padding: '2rem', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🔐</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>Banca por Internet</h2>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>Ingresa con tus credenciales de acceso</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#333', marginBottom: '0.4rem' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                style={{ display: 'block', width: '100%', padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#8B0000'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#333', marginBottom: '0.4rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ display: 'block', width: '100%', padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#8B0000'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: '6px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>❌</span>
                <span className="error-msg" style={{ marginTop: 0 }}>{error}</span>
              </div>
            )}

            {exito && (
              <div style={{ background: '#F0FFF4', border: '1px solid #B7E4C7', borderRadius: '6px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✅</span>
                <span className="success-msg" style={{ marginTop: 0 }}>{exito}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-rojo"
              disabled={cargando}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '6px', opacity: cargando ? 0.75 : 1 }}
            >
              {cargando ? '⏳ Verificando...' : 'Ingresar'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#999', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</span>
            </div>
          </form>

          {/* Footer del card */}
          <div style={{ background: '#F8F8F8', borderTop: '1px solid #eee', padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem' }}>🛡️</span>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>Protegido con cifrado SSL de 256 bits</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1A1A1A', color: '#777', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>
        © 2026 CMAC Piura S.A.C. | Supervisada por la SBS
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, guardarSesion } from '../services/auth';

const AZUL = '#004A9F';
const AMARILLO = '#F5C200';

export default function LoginPage() {
  const navigate = useNavigate();
  const [numerodni, setNumerodni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!numerodni || !password) { setError('Completa DNI y contraseña.'); return; }
    setCargando(true);
    try {
      const data = await login(numerodni.trim(), password.trim());
      guardarSesion(data.token, data.personal);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  const inp = { width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #E0E6EF', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,74,159,0.15)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, #003580, ${AZUL})`, padding: '2rem', textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 52, height: 52, background: AMARILLO, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
            <i className="fa-solid fa-building-columns" style={{ color: '#fff', fontSize: '1.4rem' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Core Bancario</h2>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>Acceso del personal · CMAC Piura</p>
        </div>
        <form onSubmit={submit} style={{ padding: '2rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>DNI</label>
          <input style={inp} value={numerodni} onChange={(e) => setNumerodni(e.target.value)} placeholder="11111111" autoComplete="username" />
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Contraseña</label>
          <input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="(en dev = DNI)" autoComplete="current-password" />

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', color: '#b3261e', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-circle-xmark" /> {error}
            </div>
          )}

          <button type="submit" disabled={cargando} style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, borderRadius: 8, border: 'none', color: '#fff', background: AZUL, cursor: cargando ? 'default' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? <><i className="fa-solid fa-spinner fa-spin" /> Verificando…</> : <><i className="fa-solid fa-right-to-bracket" /> Ingresar</>}
          </button>
        </form>
      </div>
    </div>
  );
}

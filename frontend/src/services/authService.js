import axios from 'axios';

const API = 'http://localhost:3000/api/auth';

export async function login(email, password) {
  const res = await axios.post(`${API}/login`, { email, password });
  return res.data;
}

export function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function obtenerSesion() {
  const token = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');
  if (!token) return null;
  return { token, usuario: JSON.parse(usuario) };
}

export function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

export function haySession() {
  return !!localStorage.getItem('token');
}

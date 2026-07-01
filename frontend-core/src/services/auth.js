import axios from 'axios';

const API = import.meta.env.VITE_API_URL_CORE;

export async function login(numerodni, password) {
  const res = await axios.post(`${API}/auth/login`, { numerodni, password });
  return res.data; // { token, personal }
}

export function guardarSesion(token, personal) {
  localStorage.setItem('core_token', token);
  localStorage.setItem('core_personal', JSON.stringify(personal));
}

export function obtenerSesion() {
  const token = localStorage.getItem('core_token');
  if (!token) return null;
  return { token, personal: JSON.parse(localStorage.getItem('core_personal') || 'null') };
}

export function cerrarSesion() {
  localStorage.removeItem('core_token');
  localStorage.removeItem('core_personal');
}

export function haySession() {
  return !!localStorage.getItem('core_token');
}

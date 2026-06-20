import axios from 'axios';
import { obtenerSesion } from './authService';

const API = import.meta.env.VITE_API_URL;

function authHeader() {
  const { token } = obtenerSesion() || {};
  return { Authorization: `Bearer ${token}` };
}

export async function getCuentas() {
  const res = await axios.get(`${API}/cuentas`, { headers: authHeader() });
  return res.data;
}

export async function getMovimientos() {
  const res = await axios.get(`${API}/movimientos`, { headers: authHeader() });
  return res.data;
}

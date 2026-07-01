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

// Simulador de crédito: el cálculo vive en el backend (Core). Endpoint público.
// API ya incluye el segmento '/api' → resultado: `${API}/creditos/simular`.
export async function simularCredito(payload) {
  const res = await axios.post(`${API}/creditos/simular`, payload);
  return res.data;
}

// Solicitar crédito desde el Homebanking (cliente autenticado).
export async function crearSolicitud(payload) {
  const res = await axios.post(`${API}/hb/solicitar`, payload, { headers: authHeader() });
  return res.data;
}

// Estado de las solicitudes del cliente autenticado.
export async function getMisSolicitudes() {
  const res = await axios.get(`${API}/hb/mis-solicitudes`, { headers: authHeader() });
  return res.data;
}

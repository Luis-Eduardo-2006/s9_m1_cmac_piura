import axios from 'axios';
import { obtenerSesion } from './auth';

const API = import.meta.env.VITE_API_URL_CORE;

function authHeader() {
  const { token } = obtenerSesion() || {};
  return { Authorization: `Bearer ${token}` };
}

export async function getSolicitudes() {
  const res = await axios.get(`${API}/solicitudes`, { headers: authHeader() });
  return res.data;
}

export async function getSolicitud(cod) {
  const res = await axios.get(`${API}/solicitudes/${cod}`, { headers: authHeader() });
  return res.data;
}

export async function registrarIngresos(cod, ingresoNeto) {
  const res = await axios.post(`${API}/solicitudes/${cod}/ingresos`, { ingresoNeto }, { headers: authHeader() });
  return res.data;
}

export async function evaluar(cod, payload) {
  const res = await axios.post(`${API}/solicitudes/${cod}/evaluacion`, payload, { headers: authHeader() });
  return res.data;
}

export async function enviarAComite(cod) {
  const res = await axios.post(`${API}/solicitudes/${cod}/comite`, {}, { headers: authHeader() });
  return res.data;
}

export async function resolver(cod, payload) {
  const res = await axios.post(`${API}/solicitudes/${cod}/resolver`, payload, { headers: authHeader() });
  return res.data;
}

export async function desembolsar(cod) {
  const res = await axios.post(`${API}/solicitudes/${cod}/desembolsar`, {}, { headers: authHeader() });
  return res.data;
}

// --- Recuperaciones / Mora (P5) ---
export async function getCartera(banda) {
  const res = await axios.get(`${API}/mora/cartera`, { headers: authHeader(), params: banda ? { banda } : {} });
  return res.data;
}
export async function getKpisMora() {
  const res = await axios.get(`${API}/mora/kpis`, { headers: authHeader() });
  return res.data;
}
export async function getGestiones(cod) {
  const res = await axios.get(`${API}/mora/${cod}/gestiones`, { headers: authHeader() });
  return res.data;
}
export async function registrarGestion(cod, payload) {
  const res = await axios.post(`${API}/mora/${cod}/gestion`, payload, { headers: authHeader() });
  return res.data;
}
export async function derivarJudicial(cod, observacion) {
  const res = await axios.post(`${API}/mora/${cod}/judicial`, { observacion }, { headers: authHeader() });
  return res.data;
}
export async function castigar(cod, observacion) {
  const res = await axios.post(`${API}/mora/${cod}/castigar`, { observacion }, { headers: authHeader() });
  return res.data;
}

// --- Dashboard (P7) ---
export async function getDashboard() {
  const res = await axios.get(`${API}/dashboard/resumen`, { headers: authHeader() });
  return res.data;
}
export async function descargarCsv() {
  const res = await axios.get(`${API}/dashboard/export.csv`, { headers: authHeader(), responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cartera_cmac_piura.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

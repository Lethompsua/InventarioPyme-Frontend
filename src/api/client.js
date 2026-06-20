import axios from 'axios';

// En dev usa el proxy Vite (/api → localhost:5199).
// En producción usa VITE_API_URL (ej: https://mi-api.railway.app/api).
// En dev, Vite proxea /api → localhost:5199 (vite.config.js).
// En producción, import.meta.env.DEV es false y Vite lo reemplaza en build time.
const baseURL = import.meta.env.DEV
  ? '/api'
  : 'https://inventariopyme-backend-production.up.railway.app/api';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

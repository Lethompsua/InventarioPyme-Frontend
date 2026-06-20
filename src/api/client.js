import axios from 'axios';

// En dev usa el proxy Vite (/api → localhost:5199).
// En producción usa VITE_API_URL (ej: https://mi-api.railway.app/api).
const PROD_API = 'https://inventariopyme-backend-production.up.railway.app/api';
const baseURL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.PROD ? PROD_API : '/api');

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

import client from './client';

export const listar = async (params = {}) => {
  const { data } = await client.get('/productos', { params });
  return data;
};

export const obtenerPorId = async (id) => {
  const { data } = await client.get(`/productos/${id}`);
  return data;
};

export const crear = async (body) => {
  const { data } = await client.post('/productos', body);
  return data;
};

export const actualizar = async (id, body) => {
  const { data } = await client.put(`/productos/${id}`, body);
  return data;
};

export const eliminar = async (id) => {
  await client.delete(`/productos/${id}`);
};

import client from './client';

export const listar = async (params = {}) => {
  const { data } = await client.get('/ventas', { params });
  return data;
};

export const crear = async (body) => {
  const { data } = await client.post('/ventas', body);
  return data;
};

export const cancelar = async (id) => {
  const { data } = await client.put(`/ventas/${id}/cancelar`);
  return data;
};

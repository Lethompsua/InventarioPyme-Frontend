import client from './client';

export const listarMovimientos = async (params = {}) => {
  const { data } = await client.get('/inventario/movimientos', { params });
  return data;
};

export const registrarEntrada = async (body) => {
  const { data } = await client.post('/inventario/entrada', body);
  return data;
};

export const registrarAjuste = async (body) => {
  const { data } = await client.post('/inventario/ajuste', body);
  return data;
};

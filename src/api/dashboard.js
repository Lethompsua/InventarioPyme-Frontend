import client from './client';

export const getResumen = async () => {
  const { data } = await client.get('/dashboard/resumen');
  return data;
};

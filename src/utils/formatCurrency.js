const formatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

export const formatCurrency = (amount) => formatter.format(amount ?? 0);

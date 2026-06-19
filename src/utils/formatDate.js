const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return dateFormatter.format(new Date(dateStr));
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return dateTimeFormatter.format(new Date(dateStr));
};

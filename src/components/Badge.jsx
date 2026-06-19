const stockVariants = {
  bajo: 'bg-red-100 text-red-700',
  critico: 'bg-red-100 text-red-700',
  suficiente: 'bg-emerald-100 text-emerald-700',
};

const estatusVariants = {
  pendiente: 'bg-amber-100 text-amber-700',
  completada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
};

const movimientoVariants = {
  entrada: 'bg-emerald-100 text-emerald-700',
  salida: 'bg-red-100 text-red-700',
  ajuste: 'bg-amber-100 text-amber-700',
  venta: 'bg-blue-100 text-blue-700',
};

export function StockBadge({ stockActual, stockMinimo }) {
  if (stockActual <= 0) return <Pill cls={stockVariants.critico}>Sin stock</Pill>;
  if (stockActual <= stockMinimo) return <Pill cls={stockVariants.bajo}>Stock bajo</Pill>;
  return <Pill cls={stockVariants.suficiente}>Suficiente</Pill>;
}

export function EstatusBadge({ estatus }) {
  const key = estatus?.toLowerCase();
  const cls = estatusVariants[key] ?? 'bg-surface-container text-on-surface-variant';
  return <Pill cls={cls}>{estatus}</Pill>;
}

export function MovimientoBadge({ tipo }) {
  const key = tipo?.toLowerCase();
  const cls = movimientoVariants[key] ?? 'bg-surface-container text-on-surface-variant';
  return <Pill cls={cls}>{tipo}</Pill>;
}

function Pill({ cls, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

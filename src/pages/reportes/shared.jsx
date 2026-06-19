import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

// ─── Constantes ────────────────────────────────────────────────────────────────
export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: '7d',    label: '7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'year',  label: 'Este año' },
  { id: 'custom',label: 'Personalizado' },
];

// ─── Utilidades de fechas ───────────────────────────────────────────────────────
export function getPeriodRange(period, customStart, customEnd) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // end-of-today is stable throughout the day (no render-loop on queryKey)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case '7d': {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 6);
      return { start: s, end: todayEnd };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: todayEnd };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: todayEnd };
    case 'custom':
      return {
        start: customStart ? new Date(customStart + 'T00:00:00') : todayStart,
        end:   customEnd   ? new Date(customEnd   + 'T23:59:59') : todayEnd,
      };
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
}

export function periodLabel(period, customStart, customEnd) {
  if (period === 'custom' && customStart && customEnd)
    return `${formatDate(customStart)} – ${formatDate(customEnd)}`;
  return PERIODS.find((p) => p.id === period)?.label ?? '';
}

export function inRange(dateStr, start, end) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

export function formatPct(n) {
  if (!isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

// ─── Selector de período ────────────────────────────────────────────────────────
export function PeriodSelector({ value, onChange, customRange, onCustomRange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
            value === p.id
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {p.label}
        </button>
      ))}

      {value === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customRange.start}
            max={customRange.end || undefined}
            onChange={(e) => onCustomRange((r) => ({ ...r, start: e.target.value }))}
            className="px-2 py-1.5 border border-outline-variant rounded text-xs text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <span className="text-xs text-on-surface-variant">–</span>
          <input
            type="date"
            value={customRange.end}
            min={customRange.start || undefined}
            onChange={(e) => onCustomRange((r) => ({ ...r, end: e.target.value }))}
            className="px-2 py-1.5 border border-outline-variant rounded text-xs text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      )}
    </div>
  );
}

// ─── Estado vacío ───────────────────────────────────────────────────────────────
export function EmptyState({ message = 'Sin datos para el período seleccionado' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
      <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────────
export function SkeletonRows({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse bg-surface-container-high"
                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonChart() {
  return (
    <div className="h-72 rounded-lg bg-surface-container-low animate-pulse flex items-end gap-3 px-6 pb-4 pt-8">
      {[60, 40, 75, 55, 85, 45, 70].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-surface-container-high"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonKpis({ count = 3 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-surface-container-high" />
          <div className="h-7 w-32 rounded bg-surface-container-high" />
          <div className="h-3 w-20 rounded bg-surface-container-high" />
        </div>
      ))}
    </div>
  );
}

// ─── Tarjeta KPI ────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, subColor = 'text-on-surface-variant', accent }) {
  return (
    <div className={`rounded-lg p-5 border shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex flex-col gap-1 ${
      accent
        ? 'bg-secondary-fixed/10 border-secondary-fixed'
        : 'bg-surface-container-lowest border-slate-200'
    }`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="text-2xl font-bold text-on-surface leading-tight">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

// ─── Tabla wrapper ──────────────────────────────────────────────────────────────
export function TableCard({ children }) {
  return (
    <div className="bg-surface-container-lowest border border-slate-200 rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Th({ children, right }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${right ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}

export function Td({ children, right, mono, bold, className = '' }) {
  return (
    <td className={`px-4 py-3 text-sm ${right ? 'text-right' : ''} ${mono ? 'tabular-nums' : ''} ${bold ? 'font-semibold' : ''} ${className}`}>
      {children}
    </td>
  );
}

// ─── Botón CSV ──────────────────────────────────────────────────────────────────
export function ExportButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Exportar CSV
    </button>
  );
}

// ─── Semáforo de stock ──────────────────────────────────────────────────────────
export function StockSemaforo({ stockActual, stockMinimo }) {
  if (stockActual <= stockMinimo)
    return <span className="inline-block w-3 h-3 rounded-full bg-red-500" title="Stock crítico" />;
  if (stockActual <= stockMinimo * 1.5)
    return <span className="inline-block w-3 h-3 rounded-full bg-amber-400" title="Stock bajo" />;
  return <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" title="Stock OK" />;
}

// ─── Tooltip Recharts custom ────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label, currency = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded shadow-md p-3 text-sm">
      <p className="font-semibold text-on-surface mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="font-medium">
            {currency ? formatCurrency(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

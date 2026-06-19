import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ShoppingCart,
  Wallet,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { getResumen } from '../api/dashboard';
import { listar as listarProductos } from '../api/productos';
import { listar as listarVentas } from '../api/ventas';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Layout } from '../components/Layout';
import { StockBadge } from '../components/Badge';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildChartData(ventas) {
  const map = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { name: DIAS[d.getDay()], Ventas: 0, Ingresos: 0 };
  }
  ventas.forEach((v) => {
    const key = v.fecha?.slice(0, 10);
    if (map[key] && v.estatus !== 'cancelada') {
      map[key].Ventas += 1;
      map[key].Ingresos += v.total;
    }
  });
  return Object.values(map);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded shadow-md p-3 text-sm">
      <p className="font-semibold text-on-surface mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}:</span>
          <span className="font-medium">
            {p.dataKey === 'Ventas' ? p.value : formatCurrency(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
};

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, footer, alert }) {
  return (
    <div
      className={`rounded-lg p-5 border shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-shadow ${
        alert
          ? 'bg-error-container/20 border-error-container relative overflow-hidden'
          : 'bg-surface-container-lowest border-slate-200'
      }`}
    >
      {alert && <div className="absolute right-0 top-0 w-20 h-20 bg-error/5 rounded-bl-full -mr-2 -mt-2" />}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${alert ? 'text-error' : 'text-on-surface-variant'}`}>
            {label}
          </p>
          <h3 className="text-2xl font-bold text-on-surface leading-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {footer && <div className="text-xs font-semibold relative z-10">{footer}</div>}
    </div>
  );
}

export default function Dashboard() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const { data: resumen } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: getResumen,
    refetchInterval: 60_000,
  });

  const { data: ventasRecientes } = useQuery({
    queryKey: ['ventas-recientes'],
    queryFn: () =>
      listarVentas({
        fechaInicio: sevenDaysAgo.toISOString(),
        fechaFin: today.toISOString(),
        tamanioPagina: 200,
      }),
    refetchInterval: 60_000,
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-stock-bajo'],
    queryFn: () => listarProductos({ tamanioPagina: 50 }),
  });

  const chartData = buildChartData(ventasRecientes?.items ?? []);
  const stockBajo = (productosData?.items ?? []).filter((p) => p.stockBajo);

  return (
    <Layout title="Resumen Ejecutivo">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Ventas Hoy"
          value={resumen?.ventasHoy ?? '—'}
          icon={ShoppingCart}
          iconBg="bg-secondary-fixed/20"
          iconColor="text-secondary"
          footer={
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp size={13} /> Transacciones del día
            </span>
          }
        />
        <KpiCard
          label="Ingresos Hoy"
          value={resumen ? formatCurrency(resumen.ingresosHoy) : '—'}
          icon={Wallet}
          iconBg="bg-secondary-fixed/20"
          iconColor="text-secondary"
          footer={
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp size={13} /> Total cobrado hoy
            </span>
          }
        />
        <KpiCard
          label="Productos Activos"
          value={resumen?.totalProductos ?? '—'}
          icon={Package}
          iconBg="bg-surface-container"
          iconColor="text-on-surface-variant"
          footer={<span className="text-on-surface-variant">Catálogo vigente</span>}
        />
        <KpiCard
          label="Stock Bajo"
          value={resumen?.productosStockBajo ?? '—'}
          icon={AlertTriangle}
          iconBg="bg-error"
          iconColor="text-on-error"
          footer={
            <a href="#stock-bajo" className="text-error flex items-center gap-1 hover:underline">
              <ArrowRight size={13} /> Ver detalles urgentes
            </a>
          }
          alert
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-slate-200 rounded-lg shadow-[0_2px_8px_rgba(15,23,42,0.04)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-on-surface">Ventas — Últimos 7 días</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2e4" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#45464d', fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  yAxisId="ingresos"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#45464d', fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <YAxis
                  yAxisId="count"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#45464d', fontSize: 11 }}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0edef' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                <Bar yAxisId="count" dataKey="Ventas" fill="#0051d5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar yAxisId="ingresos" dataKey="Ingresos" fill="#bec6e0" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-surface-container-lowest border border-slate-200 rounded-lg shadow-[0_2px_8px_rgba(15,23,42,0.04)] p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-on-surface mb-5">Actividad Reciente</h3>
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            {(ventasRecientes?.items ?? []).slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed/30 text-secondary flex items-center justify-center shrink-0">
                  <ShoppingCart size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {v.folio} — {formatCurrency(v.total)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {formatDate(v.fecha)} · {v.usuario}
                  </p>
                </div>
              </div>
            ))}
            {!ventasRecientes?.items?.length && (
              <p className="text-sm text-on-surface-variant">Sin actividad reciente</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div id="stock-bajo" className="bg-surface-container-lowest border border-slate-200 rounded-lg shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-on-surface flex items-center gap-2">
              Productos con Stock Bajo
              <span className="bg-error text-on-error text-xs px-2 py-0.5 rounded-full font-bold">
                {stockBajo.length}
              </span>
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Requieren reabastecimiento para evitar quiebre de stock
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['SKU', 'Producto', 'Categoría', 'Stock Actual', 'Stock Mín.', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stockBajo.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-on-surface">{p.nombre}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{p.categoria}</td>
                  <td className="px-4 py-3 font-bold text-error text-right">{p.stockActual}</td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">{p.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <StockBadge stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
                  </td>
                </tr>
              ))}
              {!stockBajo.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                    ¡Todo el stock está en niveles saludables!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

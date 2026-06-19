import { useState, lazy, Suspense } from 'react';
import { BarChart2, TrendingUp, Package, Award, CalendarDays, ArrowLeftRight } from 'lucide-react';
import { Layout } from '../components/Layout';
import { PeriodSelector, SkeletonChart, SkeletonRows } from './reportes/shared';

const ReporteVentas      = lazy(() => import('./reportes/ReporteVentas'));
const ReporteInventario  = lazy(() => import('./reportes/ReporteInventario'));
const ReporteTopProductos = lazy(() => import('./reportes/ReporteTopProductos'));
const ReporteAnual       = lazy(() => import('./reportes/ReporteAnual'));
const ReporteMovimientos = lazy(() => import('./reportes/ReporteMovimientos'));

const TABS = [
  { id: 'ventas',       label: 'Ventas',             icon: TrendingUp,   hasPeriod: true  },
  { id: 'inventario',   label: 'Inventario actual',   icon: Package,      hasPeriod: false },
  { id: 'top',          label: 'Más vendidos',        icon: Award,        hasPeriod: true  },
  { id: 'anual',        label: 'Reporte anual',       icon: CalendarDays, hasPeriod: false },
  { id: 'movimientos',  label: 'Movimientos',         icon: ArrowLeftRight, hasPeriod: false },
];

function ReporteFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-surface-container-low animate-pulse" />
        ))}
      </div>
      <SkeletonChart />
      <div className="overflow-hidden rounded-lg border border-outline-variant">
        <table className="w-full"><tbody><SkeletonRows rows={6} cols={5} /></tbody></table>
      </div>
    </div>
  );
}

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <Layout title="Reportes">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Tabs */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-1 min-w-max bg-surface-container-low p-1 rounded-lg">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de período (solo cuando aplica) */}
        {tab?.hasPeriod && (
          <div className="bg-surface-container-lowest border border-slate-200 rounded-lg px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Período</span>
              <PeriodSelector
                value={period}
                onChange={(p) => { setPeriod(p); }}
                customRange={customRange}
                onCustomRange={setCustomRange}
              />
            </div>
          </div>
        )}

        {/* Contenido */}
        <Suspense fallback={<ReporteFallback />}>
          {activeTab === 'ventas'      && <ReporteVentas period={period} customRange={customRange} />}
          {activeTab === 'inventario'  && <ReporteInventario />}
          {activeTab === 'top'         && <ReporteTopProductos period={period} customRange={customRange} />}
          {activeTab === 'anual'       && <ReporteAnual />}
          {activeTab === 'movimientos' && <ReporteMovimientos />}
        </Suspense>
      </div>
    </Layout>
  );
}

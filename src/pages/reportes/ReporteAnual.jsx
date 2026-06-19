import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { listar as listarVentas } from '../../api/ventas';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateAnualPdf } from '../../utils/pdfGenerator';
import { PdfPreviewModal } from '../../components/PdfPreviewModal';
import { useAuth } from '../../hooks/useAuth';
import {
  MESES, SkeletonChart, SkeletonKpis, SkeletonRows,
  KpiCard, TableCard, Th, Td, ChartTooltip, EmptyState, formatPct,
} from './shared';

const YEARS = [2024, 2025, 2026];

function fetchYear(year) {
  return listarVentas({
    fechaInicio: `${year}-01-01T00:00:00`,
    fechaFin:    `${year}-12-31T23:59:59`,
    tamanioPagina: 500,
  }).then((d) => d.items ?? d ?? []);
}

function groupByMonth(ventas) {
  const arr = Array.from({ length: 12 }, (_, i) => ({ mes: i, total: 0, count: 0 }));
  ventas.forEach((v) => {
    if (v.estatus === 'cancelada') return;
    const m = new Date(v.fecha).getMonth();
    arr[m].total += Number(v.total ?? 0);
    arr[m].count += 1;
  });
  return arr;
}

export default function ReporteAnual() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [pdf, setPdf] = useState(null);

  const { data: thisYear, isLoading: loadingThis } = useQuery({
    queryKey: ['reporte-anual', year],
    queryFn: () => fetchYear(year),
  });

  const { data: prevYear, isLoading: loadingPrev } = useQuery({
    queryKey: ['reporte-anual', year - 1],
    queryFn: () => fetchYear(year - 1),
  });

  const isLoading = loadingThis || loadingPrev;

  const monthsThis = groupByMonth(thisYear ?? []);
  const monthsPrev = groupByMonth(prevYear ?? []);

  const chartData = MESES.map((label, i) => ({
    label,
    [year]:     monthsThis[i].total,
    [year - 1]: monthsPrev[i].total,
  }));

  const totalThis = monthsThis.reduce((s, m) => s + m.total, 0);
  const totalPrev = monthsPrev.reduce((s, m) => s + m.total, 0);
  const promMensual = totalThis / 12;
  const mejorIdx = monthsThis.reduce(
    (best, m, i) => (m.total > monthsThis[best].total ? i : best), 0,
  );
  const peorIdx = monthsThis.reduce(
    (best, m, i) => (m.total < monthsThis[best].total ? i : best), 0,
  );
  const growthPct = totalPrev > 0 ? ((totalThis - totalPrev) / totalPrev) * 100 : null;

  function openPdf() {
    const doc = generateAnualPdf({
      chartData,
      monthsThis,
      year,
      generatedBy: user?.nombre ?? 'Usuario',
    });
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    setPdf({ blobUrl: url, filename: `reporte-anual-${year}.pdf` });
  }

  function closePdf() {
    if (pdf?.blobUrl) URL.revokeObjectURL(pdf.blobUrl);
    setPdf(null);
  }

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-on-surface-variant">Año:</span>
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                y === year
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <SkeletonKpis count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={`Total ${year}`} value={formatCurrency(totalThis)} accent
            sub={growthPct !== null ? `${formatPct(growthPct)} vs ${year - 1}` : undefined}
            subColor={growthPct === null ? '' : growthPct >= 0 ? 'text-emerald-600' : 'text-red-600'}
          />
          <KpiCard label="Promedio mensual" value={formatCurrency(promMensual)} />
          <KpiCard label="Mejor mes" value={MESES[mejorIdx]}
            sub={formatCurrency(monthsThis[mejorIdx].total)} />
          <KpiCard label="Mes más bajo" value={MESES[peorIdx]}
            sub={formatCurrency(monthsThis[peorIdx].total)} />
        </div>
      )}

      {/* Grouped bar chart */}
      <div className="bg-surface-container-lowest border border-slate-200 rounded-lg p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-semibold text-on-surface mb-4">
          Ventas mensuales — {year - 1} vs {year}
        </p>
        {isLoading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={year - 1} name={String(year - 1)} fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey={year} name={String(year)} fill="#0051d5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-on-surface">Resumen mensual</p>
          <button
            onClick={openPdf}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5" />
            Ver PDF
          </button>
        </div>
        <TableCard>
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <Th>Mes</Th><Th right>{year - 1}</Th><Th right>{year}</Th><Th right>Variación</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <SkeletonRows rows={12} cols={4} />
              ) : (
                chartData.map((row, i) => {
                  const prev = row[year - 1];
                  const curr = row[year];
                  const pct  = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                  return (
                    <tr key={row.label}
                      className={`hover:bg-surface-container-low/50 transition-colors ${i === mejorIdx ? 'bg-emerald-50/50' : ''}`}>
                      <Td bold={i === mejorIdx}>{row.label}</Td>
                      <Td right mono>{formatCurrency(prev)}</Td>
                      <Td right mono bold>{formatCurrency(curr)}</Td>
                      <Td right mono className={pct === null ? '' : pct >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {pct !== null ? formatPct(pct) : '—'}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableCard>
      </div>

      {pdf && <PdfPreviewModal blobUrl={pdf.blobUrl} filename={pdf.filename} onClose={closePdf} />}
    </div>
  );
}

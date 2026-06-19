import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { listarMovimientos } from '../../api/inventario';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateTopProductosPdf, buildFilename } from '../../utils/pdfGenerator';
import { PdfPreviewModal } from '../../components/PdfPreviewModal';
import { useAuth } from '../../hooks/useAuth';
import {
  getPeriodRange, EmptyState, SkeletonChart, SkeletonRows, SkeletonKpis,
  KpiCard, TableCard, Th, Td, ChartTooltip,
} from './shared';

function groupByProduct(movimientos) {
  const map = {};
  movimientos.forEach((m) => {
    const nombre = m.producto ?? 'Desconocido';
    if (!map[nombre]) map[nombre] = { nombre, unidades: 0, ingresos: 0 };
    map[nombre].unidades += Number(m.cantidad ?? 0);
    map[nombre].ingresos += Number(m.cantidad ?? 0) * Number(m.precioUnitario ?? 0);
  });
  return Object.values(map).sort((a, b) => b.unidades - a.unidades);
}

export default function ReporteTopProductos({ period, customRange }) {
  const { user } = useAuth();
  const [pdf, setPdf] = useState(null);
  const { start, end } = getPeriodRange(period, customRange.start, customRange.end);

  const { data: movData, isLoading } = useQuery({
    queryKey: ['reporte-top-productos', period, customRange.start, customRange.end],
    queryFn: () => listarMovimientos({ tipo: 'venta', tamanioPagina: 500 }),
    select: (d) => d.items ?? d ?? [],
  });

  const allMov = movData ?? [];
  const movimientos = allMov.filter((m) => {
    const d = new Date(m.fecha);
    return d >= start && d <= end;
  });

  const ranking = groupByProduct(movimientos);
  const top10   = ranking.slice(0, 10);

  const chartData = top10.map((r) => ({
    ...r,
    label: r.nombre.length > 20 ? r.nombre.slice(0, 18) + '…' : r.nombre,
  }));

  function openPdf() {
    const doc = generateTopProductosPdf({
      ranking,
      period,
      customRange,
      generatedBy: user?.nombre ?? 'Usuario',
    });
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    setPdf({ blobUrl: url, filename: buildFilename('reporte-top-productos', period, customRange) });
  }

  function closePdf() {
    if (pdf?.blobUrl) URL.revokeObjectURL(pdf.blobUrl);
    setPdf(null);
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {isLoading ? (
        <SkeletonKpis count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Productos vendidos" value={ranking.length} sub="distintos en el período" />
          <KpiCard
            label="Producto estrella"
            value={ranking[0]?.nombre?.slice(0, 24) ?? '—'}
            sub={ranking[0] ? `${ranking[0].unidades} unidades` : undefined}
            accent
          />
          <KpiCard label="Ingresos top 10" value={formatCurrency(top10.reduce((s, r) => s + r.ingresos, 0))} />
        </div>
      )}

      {/* Horizontal bar chart */}
      <div className="bg-surface-container-lowest border border-slate-200 rounded-lg p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-semibold text-on-surface mb-4">
          Top 10 productos — unidades vendidas
        </p>
        {isLoading ? (
          <SkeletonChart />
        ) : top10.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={top10.length * 36 + 40}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip currency={false} />} />
              <Bar dataKey="unidades" name="Unidades" fill="#0051d5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ranking table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-on-surface">Ranking completo</p>
          <button
            onClick={openPdf}
            disabled={isLoading || ranking.length === 0}
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
                <Th>#</Th><Th>Producto</Th><Th right>Unidades</Th><Th right>Ingresos</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <SkeletonRows rows={8} cols={4} />
              ) : ranking.length === 0 ? (
                <tr><td colSpan={4}><EmptyState /></td></tr>
              ) : (
                ranking.map((r, i) => (
                  <tr key={r.nombre} className="hover:bg-surface-container-low/50 transition-colors">
                    <Td>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'text-on-surface-variant'
                      }`}>
                        {i + 1}
                      </span>
                    </Td>
                    <Td bold>{r.nombre}</Td>
                    <Td right mono>{r.unidades}</Td>
                    <Td right mono>{formatCurrency(r.ingresos)}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>
      </div>

      {pdf && <PdfPreviewModal blobUrl={pdf.blobUrl} filename={pdf.filename} onClose={closePdf} />}
    </div>
  );
}

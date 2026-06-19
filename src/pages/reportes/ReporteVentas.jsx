import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { listar as listarVentas } from '../../api/ventas';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { generateVentasPdf, buildFilename } from '../../utils/pdfGenerator';
import { EstatusBadge } from '../../components/Badge';
import { PdfPreviewModal } from '../../components/PdfPreviewModal';
import { useAuth } from '../../hooks/useAuth';
import {
  getPeriodRange, EmptyState, SkeletonRows, SkeletonChart, SkeletonKpis,
  KpiCard, TableCard, Th, Td, ChartTooltip,
} from './shared';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function groupByDay(ventas) {
  const map = {};
  ventas.forEach((v) => {
    const d = v.fecha?.slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { fecha: d, ingresos: 0, ventas: 0 };
    if (v.estatus !== 'cancelada') {
      map[d].ingresos += Number(v.total ?? 0);
      map[d].ventas += 1;
    }
  });
  return Object.values(map)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({
      ...r,
      label: (() => {
        const dt = new Date(r.fecha + 'T00:00:00');
        return `${dt.getDate()} ${MESES_CORTO[dt.getMonth()]}`;
      })(),
    }));
}

export default function ReporteVentas({ period, customRange }) {
  const { user } = useAuth();
  const [pdf, setPdf] = useState(null);
  const { start, end } = getPeriodRange(period, customRange.start, customRange.end);

  const { data: ventasData, isLoading } = useQuery({
    queryKey: ['reporte-ventas', period, customRange.start, customRange.end],
    queryFn: () => listarVentas({
      fechaInicio: start.toISOString(),
      fechaFin: end.toISOString(),
      tamanioPagina: 500,
    }),
    select: (d) => d.items ?? d ?? [],
  });

  const ventas = ventasData ?? [];
  const activas = ventas.filter((v) => v.estatus !== 'cancelada');
  const totalIngresos = activas.reduce((s, v) => s + Number(v.total ?? 0), 0);
  const ticketPromedio = activas.length > 0 ? totalIngresos / activas.length : 0;
  const chartData = groupByDay(ventas);

  function openPdf() {
    const doc = generateVentasPdf({
      ventas,
      period,
      customRange,
      generatedBy: user?.nombre ?? 'Usuario',
    });
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    setPdf({ blobUrl: url, filename: buildFilename('reporte-ventas', period, customRange) });
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
          <KpiCard label="Total de ventas" value={activas.length} sub="transacciones completadas" />
          <KpiCard label="Ingreso total" value={formatCurrency(totalIngresos)} accent />
          <KpiCard label="Ticket promedio" value={formatCurrency(ticketPromedio)} sub="por venta" />
        </div>
      )}

      {/* Chart */}
      <div className="bg-surface-container-lowest border border-slate-200 rounded-lg p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-semibold text-on-surface mb-4">Ingresos por día</p>
        {isLoading ? (
          <SkeletonChart />
        ) : chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#0051d5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-on-surface">Detalle de ventas</p>
          <button
            onClick={openPdf}
            disabled={isLoading || ventas.length === 0}
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
                <Th>Folio</Th><Th>Fecha</Th>
                <Th right>Subtotal</Th><Th right>IVA</Th><Th right>Total</Th>
                <Th>Estatus</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <SkeletonRows rows={8} cols={6} />
              ) : ventas.length === 0 ? (
                <tr><td colSpan={6}><EmptyState /></td></tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <Td className="font-mono text-xs">{v.folio}</Td>
                    <Td>{formatDate(v.fecha)}</Td>
                    <Td right mono>{formatCurrency(v.subtotal)}</Td>
                    <Td right mono>{formatCurrency(v.iva)}</Td>
                    <Td right mono bold>{formatCurrency(v.total)}</Td>
                    <Td><EstatusBadge estatus={v.estatus} /></Td>
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

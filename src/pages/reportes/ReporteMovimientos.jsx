import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { listarMovimientos } from '../../api/inventario';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { generateMovimientosPdf } from '../../utils/pdfGenerator';
import { MovimientoBadge } from '../../components/Badge';
import { PdfPreviewModal } from '../../components/PdfPreviewModal';
import { useAuth } from '../../hooks/useAuth';
import {
  EmptyState, SkeletonRows, SkeletonKpis,
  KpiCard, TableCard, Th, Td, inRange,
} from './shared';

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'salida', label: 'Salidas' },
  { value: 'ajuste', label: 'Ajustes' },
  { value: 'venta', label: 'Ventas' },
];

const PAGE_SIZE = 20;

export default function ReporteMovimientos() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd,   setRangeEnd]   = useState('');
  const [page, setPage] = useState(1);
  const [pdf, setPdf]   = useState(null);

  const { data: movData, isLoading } = useQuery({
    queryKey: ['reporte-movimientos', tipo],
    queryFn: () => listarMovimientos({ tipo: tipo || undefined, tamanioPagina: 500 }),
    select: (d) => d.items ?? d ?? [],
  });

  const movimientos = useMemo(() => {
    let list = movData ?? [];
    if (rangeStart || rangeEnd) {
      const start = rangeStart ? new Date(rangeStart + 'T00:00:00') : new Date(0);
      const end   = rangeEnd   ? new Date(rangeEnd   + 'T23:59:59') : new Date();
      list = list.filter((m) => inRange(m.fecha, start, end));
    }
    return list;
  }, [movData, rangeStart, rangeEnd]);

  const totalPages = Math.max(1, Math.ceil(movimientos.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = movimientos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalCantidad = movimientos.reduce((s, m) => s + Number(m.cantidad ?? 0), 0);
  const valorTotal    = movimientos.reduce(
    (s, m) => s + Number(m.cantidad ?? 0) * Number(m.precioUnitario ?? 0), 0,
  );

  function buildPeriodLabel() {
    const parts = [];
    if (tipo) parts.push(`Tipo: ${tipo}`);
    if (rangeStart && rangeEnd) parts.push(`${rangeStart} - ${rangeEnd}`);
    else if (rangeStart) parts.push(`Desde ${rangeStart}`);
    else if (rangeEnd)   parts.push(`Hasta ${rangeEnd}`);
    return parts.length ? parts.join(' · ') : 'Todos los movimientos';
  }

  function openPdf() {
    const doc = generateMovimientosPdf({
      movimientos,
      periodLabel: buildPeriodLabel(),
      generatedBy: user?.nombre ?? 'Usuario',
    });
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    setPdf({ blobUrl: url, filename: `reporte-movimientos-${today}.pdf` });
  }

  function closePdf() {
    if (pdf?.blobUrl) URL.revokeObjectURL(pdf.blobUrl);
    setPdf(null);
  }

  function handleTipoChange(t) { setTipo(t); setPage(1); }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTipoChange(t.value)}
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                tipo === t.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={rangeStart}
            max={rangeEnd || undefined}
            onChange={(e) => { setRangeStart(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-outline-variant rounded text-xs text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <span className="text-xs text-on-surface-variant">–</span>
          <input
            type="date"
            value={rangeEnd}
            min={rangeStart || undefined}
            onChange={(e) => { setRangeEnd(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-outline-variant rounded text-xs text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          {(rangeStart || rangeEnd) && (
            <button
              onClick={() => { setRangeStart(''); setRangeEnd(''); setPage(1); }}
              className="text-xs text-on-surface-variant hover:text-error transition-colors underline"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <SkeletonKpis count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Movimientos" value={movimientos.length} sub="en el período filtrado" />
          <KpiCard label="Cantidad total" value={totalCantidad.toLocaleString('es-MX')} sub="unidades" />
          <KpiCard label="Valor total" value={formatCurrency(valorTotal)} accent />
        </div>
      )}

      {/* Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {isLoading ? '' : `${movimientos.length} movimiento${movimientos.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={openPdf}
            disabled={isLoading || movimientos.length === 0}
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
                <Th>Fecha</Th><Th>Producto</Th><Th>Tipo</Th>
                <Th right>Cantidad</Th><Th right>P. unitario</Th>
                <Th>Usuario</Th><Th>Referencia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <SkeletonRows rows={8} cols={7} />
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7}><EmptyState /></td></tr>
              ) : (
                pageRows.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <Td className="text-xs whitespace-nowrap">{formatDate(m.fecha)}</Td>
                    <Td bold>{m.producto ?? '—'}</Td>
                    <Td><MovimientoBadge tipo={m.tipo} /></Td>
                    <Td right mono>{m.cantidad}</Td>
                    <Td right mono>{m.precioUnitario ? formatCurrency(m.precioUnitario) : '—'}</Td>
                    <Td className="text-xs text-on-surface-variant">{m.usuario ?? '—'}</Td>
                    <Td className="text-xs text-on-surface-variant max-w-[120px] truncate">{m.referencia ?? '—'}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 text-xs font-medium border border-outline-variant rounded hover:bg-surface-container disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-xs text-on-surface-variant">
              Página {safePage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 text-xs font-medium border border-outline-variant rounded hover:bg-surface-container disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {pdf && <PdfPreviewModal blobUrl={pdf.blobUrl} filename={pdf.filename} onClose={closePdf} />}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { listar as listarProductos } from '../../api/productos';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateInventarioPdf } from '../../utils/pdfGenerator';
import { PdfPreviewModal } from '../../components/PdfPreviewModal';
import { useAuth } from '../../hooks/useAuth';
import {
  EmptyState, SkeletonRows, SkeletonKpis,
  KpiCard, TableCard, Th, Td, StockSemaforo,
} from './shared';

function margen(pc, pv) {
  if (!pc || pc === 0) return 0;
  return ((pv - pc) / pc) * 100;
}

export default function ReporteInventario() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [pdf, setPdf] = useState(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['reporte-inventario'],
    queryFn: () => listarProductos({ tamanioPagina: 500 }),
    select: (d) => d.items ?? d ?? [],
  });

  const activos = productos.filter((p) => p.activo !== false);
  const filtered = activos.filter(
    (p) =>
      !search ||
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  const valorTotal = activos.reduce(
    (s, p) => s + Number(p.stockActual ?? 0) * Number(p.precioCompra ?? 0), 0,
  );
  const conStockCritico = activos.filter(
    (p) => Number(p.stockActual ?? 0) <= Number(p.stockMinimo ?? 0),
  ).length;
  const conStockBajo = activos.filter((p) => {
    const sa = Number(p.stockActual ?? 0);
    const sm = Number(p.stockMinimo ?? 0);
    return sa > sm && sa <= sm * 1.5;
  }).length;

  function openPdf() {
    const doc = generateInventarioPdf({
      productos: activos,
      generatedBy: user?.nombre ?? 'Usuario',
    });
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    setPdf({ blobUrl: url, filename: `reporte-inventario-${today}.pdf` });
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
          <KpiCard label="Valor total inventario" value={formatCurrency(valorTotal)} accent />
          <KpiCard label="Stock crítico" value={conStockCritico} sub="productos con stock ≤ mínimo"
            subColor={conStockCritico > 0 ? 'text-red-600' : 'text-on-surface-variant'} />
          <KpiCard label="Stock bajo" value={conStockBajo} sub="productos cerca del mínimo"
            subColor={conStockBajo > 0 ? 'text-amber-600' : 'text-on-surface-variant'} />
        </div>
      )}

      {/* Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-outline-variant rounded text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary w-full sm:w-64"
          />
          <button
            onClick={openPdf}
            disabled={isLoading || activos.length === 0}
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
                <Th></Th><Th>Nombre</Th><Th>SKU</Th>
                <Th right>Stock actual</Th><Th right>Stock mín.</Th>
                <Th right>P. compra</Th><Th right>P. venta</Th>
                <Th right>Margen</Th><Th right>Valor inv.</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <SkeletonRows rows={8} cols={9} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState /></td></tr>
              ) : (
                filtered.map((p) => {
                  const mgn   = margen(p.precioCompra, p.precioVenta);
                  const valor = Number(p.stockActual ?? 0) * Number(p.precioCompra ?? 0);
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <Td>
                        <StockSemaforo stockActual={Number(p.stockActual ?? 0)} stockMinimo={Number(p.stockMinimo ?? 0)} />
                      </Td>
                      <Td bold>{p.nombre}</Td>
                      <Td className="font-mono text-xs text-on-surface-variant">{p.sku}</Td>
                      <Td right mono>{p.stockActual ?? 0}</Td>
                      <Td right mono>{p.stockMinimo ?? 0}</Td>
                      <Td right mono>{formatCurrency(p.precioCompra)}</Td>
                      <Td right mono>{formatCurrency(p.precioVenta)}</Td>
                      <Td right mono className={mgn >= 20 ? 'text-emerald-700' : mgn >= 10 ? 'text-amber-700' : 'text-red-700'}>
                        {mgn.toFixed(1)}%
                      </Td>
                      <Td right mono>{formatCurrency(valor)}</Td>
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

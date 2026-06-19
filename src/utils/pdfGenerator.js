import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

// ─── Design tokens ──────────────────────────────────────────────────────────────
const BLUE  = [37, 99, 235];
const DARK  = [15, 23, 42];
const GRAY  = [100, 100, 110];
const LGRAY = [248, 249, 250];
const BGRAY = [229, 231, 235];
const GREEN = [5, 150, 105];
const RED   = [220, 38, 38];
const AMBER = [217, 119, 6];
const WHITE = [255, 255, 255];

const W  = 210;        // A4 portrait width mm
const ML = 14;         // left margin
const MR = 14;         // right margin
const CW = W - ML - MR; // 182 mm usable

// ─── Shared table config ────────────────────────────────────────────────────────
const HEAD = {
  fillColor: DARK, textColor: WHITE,
  fontSize: 8, fontStyle: 'bold',
  cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
};
const BODY = {
  fontSize: 7.5, textColor: DARK,
  cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
};
const ALT = { fillColor: [248, 249, 252] };
const MG  = { left: ML, right: MR };

// ─── Drawing primitives ─────────────────────────────────────────────────────────

function drawLogo(doc, x, y) {
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(x, y, 13, 13, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text('PG', x + 6.5, y + 8.7, { align: 'center' });
}

export function drawHeader(doc, { title, period, generatedBy }) {
  drawLogo(doc, ML, 10);

  // Company name block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('ProGestion MX', ML + 16, 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Sistema de Inventario', ML + 16, 20.5);

  // Top-right: date + user
  const dateStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(`${dateStr}  |  ${generatedBy}`, W - MR, 15.5, { align: 'right' });

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text(title, ML, 37);

  // Period
  if (period) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    doc.text(period, ML, 44.5);
  }

  // Blue separator
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.7);
  doc.line(ML, 49, W - MR, 49);

  return 57; // next Y
}

export function drawFooter(doc) {
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const fy = 287;
    doc.setDrawColor(210, 210, 215);
    doc.setLineWidth(0.3);
    doc.line(ML, fy - 5, W - MR, fy - 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 165);
    doc.text('Generado por ProGestion MX', ML, fy);
    doc.text(`Pagina ${i} de ${n}`, W - MR, fy, { align: 'right' });
  }
}

export function drawKpiCards(doc, cards, y) {
  const gap  = 4;
  const cardW = (CW - gap * (cards.length - 1)) / cards.length;
  const cardH = 26;

  cards.forEach((card, i) => {
    const x = ML + i * (cardW + gap);
    doc.setFillColor(...LGRAY);
    doc.setDrawColor(...BGRAY);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(card.label.toUpperCase(), x + cardW / 2, y + 8.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(String(card.value), x + cardW / 2, y + 17.5, { align: 'center' });

    if (card.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(140, 140, 150);
      doc.text(card.sub, x + cardW / 2, y + 23, { align: 'center' });
    }
  });

  return y + cardH + 6;
}

// ─── Period / filename helpers ──────────────────────────────────────────────────

const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

export function buildPeriodLabel(period, customRange) {
  const now = new Date();
  switch (period) {
    case 'today':
      return now.toLocaleDateString('es-MX', { dateStyle: 'long' });
    case '7d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return `${s.toLocaleDateString('es-MX')} - ${now.toLocaleDateString('es-MX')}`;
    }
    case 'month': {
      const m = MESES_ES[now.getMonth()];
      return `${m.charAt(0).toUpperCase() + m.slice(1)} ${now.getFullYear()}`;
    }
    case 'year':
      return `Enero - Diciembre ${now.getFullYear()}`;
    case 'custom':
      return `${customRange?.start ?? ''} - ${customRange?.end ?? ''}`;
    default:
      return '';
  }
}

export function buildFilename(prefix, period, customRange) {
  const now = new Date();
  switch (period) {
    case 'today':
      return `${prefix}-${now.toISOString().slice(0, 10)}.pdf`;
    case '7d':
      return `${prefix}-7dias-${now.toISOString().slice(0, 10)}.pdf`;
    case 'month':
      return `${prefix}-${MESES_ES[now.getMonth()]}-${now.getFullYear()}.pdf`;
    case 'year':
      return `${prefix}-${now.getFullYear()}.pdf`;
    case 'custom':
      return `${prefix}-${customRange?.start ?? 'personalizado'}.pdf`;
    default:
      return `${prefix}-${now.toISOString().slice(0, 10)}.pdf`;
  }
}

// ─── Report generators ──────────────────────────────────────────────────────────

export function generateVentasPdf({ ventas, period, customRange, generatedBy }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const activas = ventas.filter((v) => v.estatus !== 'cancelada');
  const totalIngresos = activas.reduce((s, v) => s + Number(v.total ?? 0), 0);
  const ticketPromedio = activas.length > 0 ? totalIngresos / activas.length : 0;

  let y = drawHeader(doc, {
    title: 'Reporte de Ventas',
    period: buildPeriodLabel(period, customRange),
    generatedBy,
  });

  y = drawKpiCards(doc, [
    { label: 'Total de ventas', value: activas.length, sub: 'transacciones completadas' },
    { label: 'Ingresos totales', value: formatCurrency(totalIngresos) },
    { label: 'Ticket promedio', value: formatCurrency(ticketPromedio) },
  ], y);

  autoTable(doc, {
    startY: y,
    head: [['Folio', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Estatus']],
    body: ventas.map((v) => [
      v.folio ?? '',
      formatDate(v.fecha),
      formatCurrency(v.subtotal),
      formatCurrency(v.iva),
      formatCurrency(v.total),
      v.estatus ?? '',
    ]),
    headStyles: HEAD,
    bodyStyles: BODY,
    alternateRowStyles: ALT,
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 26 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
      5: { cellWidth: 24 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section !== 'body' || column.index !== 5) return;
      const e = cell.raw;
      cell.styles.textColor =
        e === 'completada' ? GREEN : e === 'cancelada' ? RED : AMBER;
      cell.styles.fontStyle = 'bold';
    },
    margin: MG,
  });

  drawFooter(doc);
  return doc;
}

export function generateInventarioPdf({ productos, generatedBy }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const activos = productos.filter((p) => p.activo !== false);
  const valorTotal = activos.reduce(
    (s, p) => s + Number(p.stockActual ?? 0) * Number(p.precioCompra ?? 0), 0,
  );

  let y = drawHeader(doc, {
    title: 'Inventario Actual',
    period: new Date().toLocaleDateString('es-MX', { dateStyle: 'long' }),
    generatedBy,
  });

  // Large value card
  const bigH = 30;
  doc.setFillColor(...LGRAY);
  doc.setDrawColor(...BGRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, bigH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('VALOR TOTAL DEL INVENTARIO', ML + CW / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...DARK);
  doc.text(formatCurrency(valorTotal), ML + CW / 2, y + 22, { align: 'center' });
  y += bigH + 6;

  autoTable(doc, {
    startY: y,
    head: [['SKU', 'Producto', 'Stock actual', 'Stock min.', 'P. venta', 'Margen', 'Estado']],
    body: activos.map((p) => {
      const pc = Number(p.precioCompra ?? 0);
      const pv = Number(p.precioVenta ?? 0);
      const margen = pc > 0 ? ((pv - pc) / pc * 100).toFixed(1) + '%' : '-';
      const sa = Number(p.stockActual ?? 0);
      const sm = Number(p.stockMinimo ?? 0);
      const estado = sa <= sm ? 'Critico' : sa <= sm * 1.5 ? 'Bajo' : 'OK';
      return [p.sku ?? '', p.nombre ?? '', sa, sm, formatCurrency(pv), margen, estado];
    }),
    headStyles: HEAD,
    bodyStyles: BODY,
    alternateRowStyles: ALT,
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 18 },
      6: { cellWidth: 18 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section !== 'body' || column.index !== 6) return;
      const e = cell.raw;
      cell.styles.textColor = e === 'OK' ? GREEN : e === 'Bajo' ? AMBER : RED;
      cell.styles.fontStyle = 'bold';
    },
    margin: MG,
  });

  drawFooter(doc);
  return doc;
}

export function generateTopProductosPdf({ ranking, period, customRange, generatedBy }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, {
    title: 'Productos Mas Vendidos',
    period: buildPeriodLabel(period, customRange),
    generatedBy,
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Producto', 'Unidades vendidas', 'Ingreso generado']],
    body: ranking.map((r, i) => [i + 1, r.nombre, r.unidades, formatCurrency(r.ingresos)]),
    headStyles: HEAD,
    bodyStyles: BODY,
    alternateRowStyles: ALT,
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right', cellWidth: 36 },
      3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' },
    },
    didParseCell: ({ section, row, cell }) => {
      if (section !== 'body' || row.index !== 0) return;
      cell.styles.fillColor = [254, 249, 195];
      cell.styles.textColor = [120, 80, 0];
      cell.styles.fontStyle = 'bold';
    },
    margin: MG,
  });

  drawFooter(doc);
  return doc;
}

export function generateAnualPdf({ chartData, monthsThis, year, generatedBy }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const totalThis = monthsThis.reduce((s, m) => s + m.total, 0);
  const totalPrev = chartData.reduce((s, r) => s + (r[year - 1] ?? 0), 0);
  const mejorIdx  = monthsThis.reduce(
    (best, m, i) => (m.total > monthsThis[best].total ? i : best), 0,
  );

  let y = drawHeader(doc, {
    title: `Reporte Anual ${year}`,
    period: `Enero - Diciembre ${year}`,
    generatedBy,
  });

  y = drawKpiCards(doc, [
    { label: `Total ${year}`, value: formatCurrency(totalThis) },
    { label: 'Promedio mensual', value: formatCurrency(totalThis / 12) },
    {
      label: 'Mejor mes',
      value: LABELS[mejorIdx],
      sub: formatCurrency(monthsThis[mejorIdx].total),
    },
  ], y);

  const bodyRows = chartData.map((row) => {
    const curr = row[year] ?? 0;
    const prev = row[year - 1] ?? 0;
    const pct  = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) + '%' : '-';
    return [row.label, formatCurrency(curr), formatCurrency(prev), pct];
  });
  bodyRows.push(['TOTAL', formatCurrency(totalThis), formatCurrency(totalPrev), '']);

  autoTable(doc, {
    startY: y,
    head: [['Mes', `Ingresos ${year}`, `Ingresos ${year - 1}`, 'Variacion']],
    body: bodyRows,
    headStyles: HEAD,
    bodyStyles: BODY,
    alternateRowStyles: ALT,
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: 'right', cellWidth: 48 },
      2: { halign: 'right', cellWidth: 48 },
      3: { halign: 'right', cellWidth: 30 },
    },
    didParseCell: ({ section, row, column, cell }) => {
      if (section !== 'body') return;
      // Best month — green
      if (row.index === mejorIdx) {
        cell.styles.fillColor = [209, 250, 229];
        cell.styles.textColor = [6, 78, 59];
        cell.styles.fontStyle = 'bold';
        return;
      }
      // Totals row — bold slate
      if (row.index === bodyRows.length - 1) {
        cell.styles.fillColor = [241, 245, 249];
        cell.styles.fontStyle = 'bold';
        cell.styles.textColor = DARK;
        return;
      }
      // Variation color
      if (column.index === 3) {
        const v = parseFloat(cell.raw);
        if (!isNaN(v)) cell.styles.textColor = v >= 0 ? GREEN : RED;
      }
    },
    margin: MG,
  });

  drawFooter(doc);
  return doc;
}

export function generateMovimientosPdf({ movimientos, periodLabel, generatedBy }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const tipoColors = {
    entrada: GREEN,
    salida: RED,
    ajuste: AMBER,
    venta: BLUE,
  };

  let y = drawHeader(doc, {
    title: 'Movimientos de Inventario',
    period: periodLabel,
    generatedBy,
  });

  const totalCantidad = movimientos.reduce((s, m) => s + Number(m.cantidad ?? 0), 0);
  y = drawKpiCards(doc, [
    { label: 'Total movimientos', value: movimientos.length },
    { label: 'Cantidad total', value: `${totalCantidad.toLocaleString('es-MX')} uds.` },
  ], y);

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Producto', 'Tipo', 'Cantidad', 'P. unitario', 'Usuario']],
    body: movimientos.map((m) => [
      formatDate(m.fecha),
      m.producto ?? '-',
      m.tipo ?? '',
      m.cantidad ?? 0,
      m.precioUnitario ? formatCurrency(m.precioUnitario) : '-',
      m.usuario ?? '-',
    ]),
    headStyles: HEAD,
    bodyStyles: BODY,
    alternateRowStyles: ALT,
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 58 },
      2: { cellWidth: 20 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 30 },
      5: { cellWidth: 30 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section !== 'body' || column.index !== 2) return;
      cell.styles.textColor = tipoColors[cell.raw] ?? GRAY;
      cell.styles.fontStyle = 'bold';
    },
    margin: MG,
  });

  drawFooter(doc);
  return doc;
}

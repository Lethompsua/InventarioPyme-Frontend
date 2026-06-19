/**
 * Exports an array of objects to a CSV file.
 * @param {object[]} rows - Data rows
 * @param {{ key?: string, label: string, value?: (row) => any }[]} columns - Column definitions
 * @param {string} filename - e.g. "reporte-ventas-2026-06-18.csv"
 */
export function exportCsv(rows, columns, filename) {
  const bom = '﻿'; // UTF-8 BOM for correct Excel rendering
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.value === 'function' ? c.value(row) : (row[c.key] ?? '');
          return `"${String(raw).replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([bom + header + '\n' + body], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayFilename(prefix) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react';
import { listarMovimientos, registrarEntrada, registrarAjuste } from '../api/inventario';
import { listar as listarProductos } from '../api/productos';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { MovimientoBadge } from '../components/Badge';
import { useAuth } from '../hooks/useAuth';

const TIPOS = ['', 'entrada', 'salida', 'ajuste', 'venta'];

function EntradaForm({ productos, onSubmit, loading }) {
  const [form, setForm] = useState({
    productoId: '',
    cantidad: '',
    precioUnitario: '',
    referencia: '',
    notas: '',
  });

  const f = (name) => ({
    value: form[name],
    onChange: (e) => setForm((s) => ({ ...s, [name]: e.target.value })),
    className:
      'w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.productoId || !form.cantidad || !form.precioUnitario) {
      toast.error('Producto, cantidad y precio unitario son requeridos');
      return;
    }
    onSubmit({
      productoId: form.productoId,
      cantidad: Number(form.cantidad),
      precioUnitario: Number(form.precioUnitario),
      referencia: form.referencia || undefined,
      notas: form.notas || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Producto
        </label>
        <select
          value={form.productoId}
          onChange={(e) => setForm((s) => ({ ...s, productoId: e.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
        >
          <option value="">— Seleccionar producto —</option>
          {productos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            Cantidad
          </label>
          <input type="number" min="1" placeholder="0" {...f('cantidad')} className={f('cantidad').className + ' text-right'} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            Precio Unitario (MXN)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.precioUnitario}
              onChange={(e) => setForm((s) => ({ ...s, precioUnitario: e.target.value }))}
              className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Referencia (opcional)
        </label>
        <input type="text" placeholder="Ej: Orden de compra #88" {...f('referencia')} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Notas (opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Observaciones adicionales"
          value={form.notas}
          onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary resize-none transition-colors"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : <><Plus size={14} /> Registrar Entrada</>}
        </Button>
      </div>
    </form>
  );
}

function AjusteForm({ productos, onSubmit, loading }) {
  const [form, setForm] = useState({ productoId: '', nuevoStock: '', notas: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.productoId || form.nuevoStock === '') {
      toast.error('Selecciona un producto e indica el nuevo stock');
      return;
    }
    onSubmit({
      productoId: form.productoId,
      nuevoStock: Number(form.nuevoStock),
      notas: form.notas || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Producto
        </label>
        <select
          value={form.productoId}
          onChange={(e) => setForm((s) => ({ ...s, productoId: e.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
        >
          <option value="">— Seleccionar producto —</option>
          {productos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.sku}) — Stock actual: {p.stockActual}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Nuevo Stock
        </label>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={form.nuevoStock}
          onChange={(e) => setForm((s) => ({ ...s, nuevoStock: e.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Razón del Ajuste
        </label>
        <textarea
          rows={2}
          placeholder="Motivo del ajuste de inventario"
          value={form.notas}
          onChange={(e) => setForm((s) => ({ ...s, notas: e.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary resize-none transition-colors"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={loading}>
          {loading ? 'Aplicando...' : <><SlidersHorizontal size={14} /> Aplicar Ajuste</>}
        </Button>
      </div>
    </form>
  );
}

export default function Inventario() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [pagina, setPagina] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['movimientos', pagina, filtroTipo],
    queryFn: () =>
      listarMovimientos({ pagina, tamanioPagina: 20, tipo: filtroTipo || undefined }),
    keepPreviousData: true,
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-all'],
    queryFn: () => listarProductos({ tamanioPagina: 200 }),
  });

  const productos = productosData?.items ?? [];

  const entradaMutation = useMutation({
    mutationFn: registrarEntrada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Entrada de mercancía registrada');
      setModalEntrada(false);
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al registrar entrada'),
  });

  const ajusteMutation = useMutation({
    mutationFn: registrarAjuste,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Ajuste de inventario aplicado');
      setModalAjuste(false);
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al aplicar ajuste'),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <Layout title="Movimientos de Inventario">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            Tipo:
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
            className="px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t === '' ? 'Todos los tipos' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalEntrada(true)}>
            <Plus size={14} /> Entrada de Mercancía
          </Button>
          {isAdmin && (
            <Button variant="secondary" onClick={() => setModalAjuste(true)}>
              <SlidersHorizontal size={14} /> Ajuste de Stock
            </Button>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Precio Unit.', 'Referencia', 'Usuario', 'Notas'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${['Cantidad', 'Precio Unit.'].includes(h) ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">Cargando movimientos...</td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">Sin movimientos registrados</td>
                </tr>
              ) : (
                data?.items?.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{formatDateTime(m.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-on-surface max-w-[180px] truncate">{m.producto}</td>
                    <td className="px-4 py-3">
                      <MovimientoBadge tipo={m.tipo} />
                    </td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${
                      ['salida', 'venta'].includes(m.tipo?.toLowerCase()) ? 'text-error' : 'text-emerald-700'
                    }`}>
                      {['salida', 'venta'].includes(m.tipo?.toLowerCase()) ? '-' : '+'}{m.cantidad}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-on-surface-variant">
                      {formatCurrency(m.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">{m.referencia ?? '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{m.usuario}</td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[160px] truncate">{m.notas ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-container-lowest border-t border-outline-variant px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            {data?.total ?? 0} movimientos en total
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              disabled={pagina >= totalPages}
              onClick={() => setPagina((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Entrada Modal */}
      <Modal open={modalEntrada} onClose={() => setModalEntrada(false)} title="Registrar Entrada de Mercancía">
        <EntradaForm
          productos={productos}
          onSubmit={entradaMutation.mutate}
          loading={entradaMutation.isPending}
        />
      </Modal>

      {/* Ajuste Modal */}
      <Modal open={modalAjuste} onClose={() => setModalAjuste(false)} title="Ajuste de Stock">
        <AjusteForm
          productos={productos}
          onSubmit={ajusteMutation.mutate}
          loading={ajusteMutation.isPending}
        />
      </Modal>
    </Layout>
  );
}

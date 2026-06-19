import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Search,
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { listar, crear, cancelar } from '../api/ventas';
import { listar as listarProductos } from '../api/productos';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EstatusBadge } from '../components/Badge';

const IVA = 0.16;

function ProductSearch({ productos, onAdd }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (productos ?? []).filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, productos]);

  return (
    <div className="relative">
      <div className="flex items-center border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
        <Search size={15} className="ml-3 text-on-surface-variant shrink-0" />
        <input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2.5 text-sm text-on-surface bg-transparent outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="px-3 text-on-surface-variant hover:text-primary">
            <X size={14} />
          </button>
        )}
      </div>
      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded shadow-[0_4px_12px_rgba(15,23,42,0.12)] max-h-56 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => { onAdd(p); setQuery(''); }}
                className="w-full text-left px-4 py-2.5 hover:bg-surface-container text-sm transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-medium text-on-surface">{p.nombre}</span>
                  <span className="text-xs text-on-surface-variant ml-2">{p.sku}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-on-surface tabular-nums">{formatCurrency(p.precioVenta)}</p>
                  <p className="text-xs text-on-surface-variant">Stock: {p.stockActual}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NuevaVentaModal({ open, onClose, productos, onCrear, loading }) {
  const [items, setItems] = useState([]);

  const addItem = (producto) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id);
      if (existing) {
        return prev.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
        },
      ];
    });
  };

  const updateCantidad = (productoId, value) => {
    const n = Number(value);
    if (isNaN(n) || n < 1) return;
    setItems((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: n } : i)));
  };

  const removeItem = (productoId) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const subtotal = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
  const iva = subtotal * IVA;
  const total = subtotal + iva;

  const handleSubmit = () => {
    if (!items.length) {
      toast.error('Agrega al menos un producto');
      return;
    }
    onCrear({
      detalles: items.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    });
  };

  const handleClose = () => {
    setItems([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nueva Venta" maxWidth="max-w-2xl">
      <div className="p-6 space-y-5">
        <ProductSearch productos={productos} onAdd={addItem} />

        {items.length > 0 ? (
          <div className="border border-outline-variant rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-24">Precio</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-24">Cant.</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-28">Subtotal</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {items.map((item) => (
                  <tr key={item.productoId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-2.5 font-medium text-on-surface">{item.nombre}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-on-surface-variant">{formatCurrency(item.precioUnitario)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => updateCantidad(item.productoId, e.target.value)}
                        className="w-16 text-center px-2 py-1 border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {formatCurrency(item.precioUnitario * item.cantidad)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => removeItem(item.productoId)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-outline-variant rounded text-on-surface-variant">
            <ShoppingCart size={28} className="mb-2 opacity-40" />
            <p className="text-sm">Busca productos para agregar a la venta</p>
          </div>
        )}

        {/* Totals */}
        <div className="bg-surface-container-low rounded-lg p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>IVA (16%)</span>
            <span className="tabular-nums">{formatCurrency(iva)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-on-surface border-t border-outline-variant pt-2 mt-2">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
          {loading ? 'Registrando...' : <><ShoppingCart size={14} /> Registrar Venta</>}
        </Button>
      </div>
    </Modal>
  );
}

function DetalleVentaModal({ venta, open, onClose }) {
  if (!venta) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Detalle — ${venta.folio}`}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-0.5">Folio</p>
            <p className="font-medium text-on-surface">{venta.folio}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-0.5">Fecha</p>
            <p className="font-medium text-on-surface">{formatDateTime(venta.fecha)}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-0.5">Usuario</p>
            <p className="font-medium text-on-surface">{venta.usuario}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-0.5">Estatus</p>
            <EstatusBadge estatus={venta.estatus} />
          </div>
        </div>

        <div className="border border-outline-variant rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Producto</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Cant.</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Precio</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {(venta.detalles ?? []).map((d) => (
                <tr key={d.productoId}>
                  <td className="px-4 py-2.5 text-on-surface">{d.producto}</td>
                  <td className="px-4 py-2.5 text-right text-on-surface-variant">{d.cantidad}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-on-surface-variant">{formatCurrency(d.precioUnitario)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-container-low rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span><span className="tabular-nums">{formatCurrency(venta.subtotal)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>IVA (16%)</span><span className="tabular-nums">{formatCurrency(venta.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-on-surface text-base border-t border-outline-variant pt-2 mt-1">
            <span>Total</span><span className="tabular-nums">{formatCurrency(venta.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Ventas() {
  const queryClient = useQueryClient();

  const [pagina, setPagina] = useState(1);
  const [modalNueva, setModalNueva] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });

  const { data, isLoading } = useQuery({
    queryKey: ['ventas', pagina],
    queryFn: () => listar({ pagina, tamanioPagina: 20 }),
    keepPreviousData: true,
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-all'],
    queryFn: () => listarProductos({ tamanioPagina: 200 }),
  });

  const crearMutation = useMutation({
    mutationFn: crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });
      toast.success('Venta registrada exitosamente');
      setModalNueva(false);
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al registrar venta'),
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Venta cancelada');
      setConfirmCancel({ open: false, id: null });
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al cancelar venta'),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const productos = productosData?.items ?? [];

  return (
    <Layout title="Registro de Ventas">
      {/* Toolbar */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setModalNueva(true)}>
          <Plus size={15} /> Nueva Venta
        </Button>
      </div>

      {/* Sales Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Folio', 'Fecha', 'Usuario', 'Subtotal', 'IVA', 'Total', 'Estatus', 'Acciones'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${['Subtotal','IVA','Total'].includes(h) ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">Cargando ventas...</td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">Sin ventas registradas</td>
                </tr>
              ) : (
                data?.items?.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-on-surface">{v.folio}</td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{formatDateTime(v.fecha)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{v.usuario}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-on-surface-variant">{formatCurrency(v.subtotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-on-surface-variant">{formatCurrency(v.iva)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-on-surface">{formatCurrency(v.total)}</td>
                    <td className="px-4 py-3">
                      <EstatusBadge estatus={v.estatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setVentaDetalle(v)}
                          className="p-1.5 text-on-surface-variant hover:text-secondary rounded hover:bg-surface-container transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                        {v.estatus?.toLowerCase() !== 'cancelada' && (
                          <button
                            onClick={() => setConfirmCancel({ open: true, id: v.id })}
                            className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-error-container/30 transition-colors"
                            title="Cancelar venta"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-container-lowest border-t border-outline-variant px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">{data?.total ?? 0} ventas en total</p>
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

      {/* Nueva Venta Modal */}
      <NuevaVentaModal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        productos={productos}
        onCrear={crearMutation.mutate}
        loading={crearMutation.isPending}
      />

      {/* Detalle Modal */}
      <DetalleVentaModal
        venta={ventaDetalle}
        open={!!ventaDetalle}
        onClose={() => setVentaDetalle(null)}
      />

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, id: null })}
        onConfirm={() => cancelarMutation.mutate(confirmCancel.id)}
        title="Cancelar Venta"
        message="¿Estás seguro de cancelar esta venta? El stock será repuesto automáticamente."
        confirmLabel="Cancelar Venta"
        loading={cancelarMutation.isPending}
      />
    </Layout>
  );
}

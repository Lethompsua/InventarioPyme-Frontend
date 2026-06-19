import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { listar, crear, actualizar, eliminar } from '../api/productos';
import { formatCurrency } from '../utils/formatCurrency';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StockBadge } from '../components/Badge';
import { useAuth } from '../hooks/useAuth';

const EMPTY_FORM = {
  nombre: '',
  sku: '',
  descripcion: '',
  precioCompra: '',
  precioVenta: '',
  stockMinimo: '',
  unidad: 'pza',
  categoriaId: '',
  proveedorId: '',
};

function ProductoForm({ form, onChange }) {
  const field = (name) => ({
    value: form[name],
    onChange: (e) => onChange(name, e.target.value),
    className:
      'w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors',
  });

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            SKU
          </label>
          <input type="text" placeholder="PROD-001" {...field('sku')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            ID Categoría (UUID)
          </label>
          <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field('categoriaId')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Nombre del Producto
        </label>
        <input type="text" placeholder="Nombre del producto" {...field('nombre')} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Descripción
        </label>
        <textarea
          rows={3}
          placeholder="Descripción opcional"
          {...field('descripcion')}
          className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary resize-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            Precio Compra (MXN)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...field('precioCompra')}
              className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            Precio Venta (MXN)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...field('precioVenta')}
              className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
            Stock Mínimo
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            {...field('stockMinimo')}
            className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
          Unidad
        </label>
        <select {...field('unidad')} className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors">
          {['pza', 'kg', 'lt', 'mt', 'caja', 'rollo', 'par'].map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function Productos() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState({ nombre: '', sku: '' });
  const [search, setSearch] = useState({ nombre: '', sku: '' });

  const [modal, setModal] = useState({ open: false, producto: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['productos', pagina, search],
    queryFn: () => listar({ pagina, tamanioPagina: 20, ...search }),
    keepPreviousData: true,
  });

  const onChange = useCallback((name, value) => setForm((f) => ({ ...f, [name]: value })), []);

  const createMutation = useMutation({
    mutationFn: crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto creado');
      setModal({ open: false, producto: null });
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al crear producto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => actualizar(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto actualizado');
      setModal({ open: false, producto: null });
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al actualizar producto'),
  });

  const deleteMutation = useMutation({
    mutationFn: eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto eliminado');
      setConfirmDelete({ open: false, id: null });
    },
    onError: (e) => toast.error(e.response?.data?.error ?? 'Error al eliminar'),
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, producto: null });
  };

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre,
      sku: p.sku,
      descripcion: p.descripcion ?? '',
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
      stockMinimo: p.stockMinimo,
      unidad: p.unidad,
      categoriaId: '',
      proveedorId: '',
    });
    setModal({ open: true, producto: p });
  };

  const handleSave = () => {
    const body = {
      nombre: form.nombre || undefined,
      sku: form.sku || undefined,
      descripcion: form.descripcion || undefined,
      precioCompra: form.precioCompra ? Number(form.precioCompra) : undefined,
      precioVenta: form.precioVenta ? Number(form.precioVenta) : undefined,
      stockMinimo: form.stockMinimo !== '' ? Number(form.stockMinimo) : undefined,
      unidad: form.unidad || undefined,
      categoriaId: form.categoriaId || undefined,
      proveedorId: form.proveedorId || undefined,
    };

    if (modal.producto) {
      updateMutation.mutate({ id: modal.producto.id, body });
    } else {
      if (!form.nombre || !form.sku || !form.categoriaId || !form.precioVenta) {
        toast.error('Nombre, SKU, Categoría y Precio de Venta son requeridos');
        return;
      }
      createMutation.mutate({
        ...body,
        nombre: form.nombre,
        sku: form.sku,
        categoriaId: form.categoriaId,
        precioCompra: Number(form.precioCompra) || 0,
        precioVenta: Number(form.precioVenta),
        stockMinimo: Number(form.stockMinimo) || 0,
        unidad: form.unidad,
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ nombre: busqueda.nombre, sku: busqueda.sku });
    setPagina(1);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <Layout title="Gestión de Productos">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar nombre..."
              value={busqueda.nombre}
              onChange={(e) => setBusqueda((b) => ({ ...b, nombre: e.target.value }))}
              className="pl-8 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-colors w-44"
            />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar SKU..."
              value={busqueda.sku}
              onChange={(e) => setBusqueda((b) => ({ ...b, sku: e.target.value }))}
              className="pl-8 pr-3 py-2 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-colors w-36"
            />
          </div>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus size={15} /> Nuevo Producto
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['SKU', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado', isAdmin ? 'Acciones' : ''].filter(Boolean).map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${h === 'Precio' || h === 'Stock' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    Cargando productos...
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                data?.items?.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{p.nombre}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{p.categoria}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.precioVenta)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${p.stockBajo ? 'text-error' : 'text-on-surface'}`}>
                          {p.stockActual}
                        </span>
                        <span className="text-xs text-on-surface-variant">{p.unidad}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-on-surface-variant hover:text-secondary rounded hover:bg-surface-container transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ open: true, id: p.id })}
                            className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-error-container/30 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-surface-container-lowest border-t border-outline-variant px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            Mostrando {data ? (pagina - 1) * 20 + 1 : 0}–{data ? Math.min(pagina * 20, data.total) : 0} de {data?.total ?? 0} productos
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

      {/* Create / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, producto: null })}
        title={modal.producto ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <ProductoForm form={form} onChange={onChange} />
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal({ open: false, producto: null })} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        title="Eliminar Producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </Layout>
  );
}

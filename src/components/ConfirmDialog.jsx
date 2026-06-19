import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex gap-4 items-start mb-6">
          <div className="p-2 bg-error-container rounded-lg shrink-0">
            <AlertTriangle size={20} className="text-error" />
          </div>
          <p className="text-sm text-on-surface leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

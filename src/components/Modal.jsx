import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div
        className={`bg-surface-container-lowest w-full ${maxWidth} rounded-lg border border-outline-variant shadow-[0_4px_12px_rgba(15,23,42,0.12)] flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

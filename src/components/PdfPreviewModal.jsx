import { useEffect } from 'react';
import { Download, X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function PdfPreviewModal({ blobUrl, filename, onClose }) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleDownload() {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Reporte generado correctamente');
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '92vw', maxWidth: '960px', height: '93vh' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-semibold text-slate-700 truncate">{filename}</p>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <iframe
          src={blobUrl}
          title={filename}
          className="flex-1 w-full bg-slate-100"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Lock } from 'lucide-react';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(form.email, form.password);
      login(data);
      toast.success(`Bienvenido, ${data.nombre}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Credenciales inválidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pattern-bg px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-outline-variant p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Building2 size={28} className="text-on-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">ProGestion MX</h1>
            <p className="text-sm text-on-surface-variant">Bienvenido de nuevo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-widest mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@empresa.mx"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-widest">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded bg-surface-container-lowest text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-secondary text-on-secondary rounded text-xs font-semibold tracking-widest uppercase shadow-sm hover:bg-on-secondary-fixed-variant focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-on-surface-variant">
            ¿Necesitas ayuda?{' '}
            <span className="text-secondary font-medium">Contactar soporte</span>
          </p>
        </div>
      </div>
    </div>
  );
}

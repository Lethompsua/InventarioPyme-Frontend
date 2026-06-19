import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  BarChart2,
  LogOut,
  Building2,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/inventario', label: 'Inventario', icon: Warehouse },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/reportes', label: 'Reportes', icon: BarChart2 },
];

export function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-outline-variant">
      {/* Brand */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-on-primary" />
        </div>
        <div>
          <p className="font-bold text-sm text-primary leading-tight">ProGestion MX</p>
          <p className="text-xs text-on-surface-variant">Operaciones</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold tracking-wide transition-colors ${
                isActive
                  ? 'text-secondary border-r-4 border-secondary bg-secondary-fixed/10'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-outline-variant space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <User size={14} className="text-on-primary-container" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface truncate">{user?.nombre ?? 'Usuario'}</p>
            <p className="text-xs text-on-surface-variant capitalize">{user?.rol ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  BookOpen,
  Database,
  LogOut,
  Smartphone,
  Dumbbell
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/desktop', icon: LayoutDashboard, label: 'Overview' },
    { path: '/desktop/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/desktop/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/desktop/programs', icon: BookOpen, label: 'Programs' },
    { path: '/desktop/data', icon: Database, label: 'Data' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const isActive = (path: string) => {
    if (path === '/desktop') {
      return location.pathname === '/desktop';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-[#222] flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <Dumbbell size={32} className="text-primary" />
            <div>
              <h1 className="text-2xl font-black italic text-white">VOLTLIFT</h1>
              <p className="text-[10px] text-[#666] uppercase tracking-widest font-bold">Desktop Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? 'bg-primary text-black font-bold'
                        : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm uppercase tracking-wider font-bold">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile View Link */}
        <div className="p-4 border-t border-[#222]">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <Smartphone size={20} />
            <span className="text-sm uppercase tracking-wider font-bold">Mobile View</span>
          </Link>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#222]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#666] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full bg-[#1a1a1a] hover:bg-red-900/20 text-[#888] hover:text-red-500 transition-colors border border-[#333]"
          >
            <LogOut size={16} />
            <span className="text-xs uppercase tracking-wider font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DesktopLayout;

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Briefcase, FileCheck,
  BarChart2, Calendar, Users, LogOut, Menu, X, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const studentNav = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/courses',      label: 'Courses',       icon: BookOpen },
  { to: '/roles',        label: 'Roles',         icon: Briefcase },
  { to: '/electives',   label: 'Electives',     icon: FileCheck },
  { to: '/competencies', label: 'Competencies',  icon: BarChart2 },
  { to: '/counselling',  label: 'Counselling',   icon: Calendar },
  { to: '/mentoring',    label: 'Mentoring',     icon: Users },
];

const adminNav = [
  { to: '/admin',              label: 'Overview',        icon: Shield },
  { to: '/admin/activations',  label: 'Activations',     icon: Users },
  { to: '/admin/evidence',     label: 'Evidence Queue',  icon: FileCheck },
  { to: '/admin/electives',    label: 'Elective Changes',icon: BookOpen },
  { to: '/admin/counselling',  label: 'Counselling',     icon: Calendar },
  { to: '/admin/mentoring',    label: 'Mentoring',       icon: Users },
  { to: '/admin/students',     label: 'Students',        icon: Briefcase },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = user?.role === 'ADMIN' ? adminNav : studentNav;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const NavItems = () => (
    <>
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard' || to === '/admin'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
             ${isActive
               ? 'bg-brand-500 text-white shadow-sm'
               : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-mono font-bold text-xs">XI</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">XIME Chennai</p>
              <p className="text-xs text-slate-400 mt-0.5">IT &amp; Analytics</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItems />
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 font-mono">{user?.roll_number}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
                       text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile header + drawer ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3
                           bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
              <span className="text-white font-mono font-bold text-xs">XI</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">XIME Analytics</span>
          </div>
          <button onClick={() => setOpen((v) => !v)}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile drawer overlay */}
        {open && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <aside className="relative w-64 bg-white flex flex-col shadow-xl z-50">
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto mt-2">
                <NavItems />
              </nav>
              <div className="px-3 py-4 border-t border-slate-100">
                <p className="px-3 text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
                <p className="px-3 text-xs text-slate-400 font-mono mb-2">{user?.roll_number}</p>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
                             text-slate-500 hover:bg-slate-100 transition-colors">
                  <LogOut size={16} />Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

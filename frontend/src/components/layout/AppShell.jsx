import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Briefcase, FileCheck,
  BarChart2, Calendar, Users, LogOut, Menu, X, Shield,
  Award, TrendingUp, Star, Building2, ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const studentNav = [
  { to: '/dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/courses',      label: 'Courses',           icon: BookOpen },
  { to: '/roles',        label: 'Roles',             icon: Briefcase },
  { to: '/placements',   label: 'Placements',        icon: Building2 },
  { to: '/electives',    label: 'Electives',         icon: FileCheck },
  { to: '/competencies', label: 'Competencies',      icon: BarChart2 },
  { to: '/evidence',     label: 'Evidence Gallery',  icon: Award },
  { to: '/pathway',      label: 'Career Pathway',    icon: TrendingUp },
  { to: '/compare',      label: 'Role Comparison',   icon: ArrowLeftRight },
  { to: '/peers',        label: 'Peer Benchmarking', icon: Star },
  { to: '/counselling',  label: 'Counselling',       icon: Calendar },
  { to: '/mentoring',    label: 'Mentoring',         icon: Users },
];

const adminNav = [
  { to: '/admin',                label: 'Overview',         icon: Shield },
  { to: '/admin/activations',    label: 'Activations',      icon: Users },
  { to: '/admin/evidence',       label: 'Evidence Queue',   icon: FileCheck },
  { to: '/admin/electives',      label: 'Elective Changes', icon: BookOpen },
  { to: '/admin/counselling',    label: 'Counselling',      icon: Calendar },
  { to: '/admin/mentoring',      label: 'Mentoring',        icon: Users },
  { to: '/admin/role-analytics', label: 'Role Analytics',   icon: BarChart2 },
  { to: '/admin/students',       label: 'Students',         icon: Briefcase },
];

function SidebarContent({ user, nav, onLogout, onClose }) {
  return (
    <aside className="flex flex-col w-52 bg-[#CC0000] text-white shrink-0 h-full"
      style={{ boxShadow: '3px 0 10px rgba(0,0,0,0.2)' }}>
      <div className="px-4 py-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center overflow-hidden p-1 shrink-0">
            <img src="/xime_logo.png" alt="XIME" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight">XIME Chennai</p>
            <p className="text-[10px] text-white/75 leading-tight mt-0.5">IT &amp; Analytics Domain</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            end={to === '/dashboard' || to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
               ${isActive
                 ? 'bg-white/25 text-white'
                 : 'text-white/80 hover:bg-white/15 hover:text-white'}`
            }>
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/20">
        <p className="text-[12px] font-semibold text-white truncate px-1">{user?.name}</p>
        <p className="text-[11px] text-white/60 font-mono px-1 mt-0.5">{user?.roll_number}</p>
        <button onClick={onLogout}
          className="flex items-center gap-2 w-full px-2 py-2 mt-2 rounded-lg text-[12px]
                     text-white/70 hover:bg-white/15 hover:text-white transition-colors">
          <LogOut size={14} />Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = user?.role === 'ADMIN' ? adminNav : studentNav;

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex">
        <SidebarContent user={user} nav={nav} onLogout={handleLogout} onClose={() => {}} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#CC0000] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-6 bg-white rounded flex items-center justify-center overflow-hidden p-0.5">
              <img src="/xime_logo.png" alt="XIME" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-white">XIME — IT &amp; Analytics</span>
          </div>
          <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded text-white/80 hover:bg-white/20">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {open && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="relative z-50">
              <SidebarContent user={user} nav={nav} onLogout={handleLogout} onClose={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

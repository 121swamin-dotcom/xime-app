import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Briefcase, FileCheck,
  BarChart2, Calendar, Users, LogOut, Menu, X, Shield,
  Award, TrendingUp, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const XIME_LOGO = 'data:image/png;base64,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';

const studentNav = [
  { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/courses',      label: 'Courses',          icon: BookOpen },
  { to: '/roles',        label: 'Roles',            icon: Briefcase },
  { to: '/electives',    label: 'Electives',        icon: FileCheck },
  { to: '/competencies', label: 'Competencies',     icon: BarChart2 },
  { to: '/evidence',     label: 'Evidence Gallery', icon: Award },
  { to: '/pathway',      label: 'Career Pathway',   icon: TrendingUp },
  { to: '/peers',        label: 'Peer Benchmarking',icon: Star },
  { to: '/counselling',  label: 'Counselling',      icon: Calendar },
  { to: '/mentoring',    label: 'Mentoring',        icon: Users },
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
          <div className="w-11 h-8 bg-white rounded-md flex items-center justify-center shrink-0 overflow-hidden p-0.5">
            <img src={XIME_LOGO} alt="XIME" className="w-full h-full object-contain" />
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
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SidebarContent user={user} nav={nav} onLogout={handleLogout} onClose={() => {}} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#CC0000] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-white rounded flex items-center justify-center overflow-hidden p-0.5">
              <img src={XIME_LOGO} alt="XIME" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-white">XIME — IT &amp; Analytics</span>
          </div>
          <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded text-white/80 hover:bg-white/20">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile drawer */}
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

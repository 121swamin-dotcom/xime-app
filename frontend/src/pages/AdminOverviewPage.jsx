import { useNavigate } from 'react-router-dom';
import { Users, FileCheck, BookOpen, Calendar, UserCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { adminService } from '../services/admin.service.js';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useFetch(adminService.getOverview);

  const queues = [
    { label: 'Activations',      key: 'activations',     icon: UserCheck, to: '/admin/activations', color: 'brand'   },
    { label: 'Evidence Review',  key: 'evidence',         icon: FileCheck, to: '/admin/evidence',    color: 'amber'   },
    { label: 'Elective Changes', key: 'elective_changes', icon: BookOpen,  to: '/admin/electives',   color: 'violet'  },
    { label: 'Counselling',      key: 'counselling',      icon: Calendar,  to: '/admin/counselling', color: 'emerald' },
    { label: 'Mentor Requests',  key: 'mentor_requests',  icon: Users,     to: '/admin/mentoring',   color: 'rose'    },
  ];

  const colorMap = {
    brand:   { bg: 'bg-brand-50',   text: 'text-brand-500',   badge: 'bg-brand-500'   },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-500',   badge: 'bg-amber-500'   },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-500',  badge: 'bg-violet-500'  },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', badge: 'bg-emerald-500' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-500',    badge: 'bg-rose-500'    },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-0.5">{user?.name}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {queues.map(({ label, key, icon: Icon, to, color }) => {
          const c = colorMap[color];
          const count = data?.[key] ?? '—';
          return (
            <button key={key} onClick={() => navigate(to)}
              className="card p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <Icon size={20} className={c.text} />
                </div>
                {count > 0 && (
                  <span className={`${c.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                    {count}
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800">{label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{loading ? '…' : `${count} pending`}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 group-hover:text-brand-500 transition-colors">
                View queue <ChevronRight size={12} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={() => navigate('/admin/students')}
          className="card p-4 text-left hover:border-brand-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Student Search</p>
              <p className="text-xs text-slate-400 mt-0.5">View any student's full profile</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
          </div>
        </button>
        <button onClick={() => navigate('/admin/mentoring-overview')}
          className="card p-4 text-left hover:border-brand-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Mentoring Overview</p>
              <p className="text-xs text-slate-400 mt-0.5">All mentor-student pairs and sessions</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
}

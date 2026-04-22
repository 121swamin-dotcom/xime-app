import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, ChevronRight, Users, Sparkles } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { rolesService } from '../services/catalogue.service.js';

const EMERGING = ['EM_AI_PROD_MGR','EM_DEC_SCIENTIST','EM_AI_CONSULTANT','EM_DATA_GOV_CDO'];

export default function RolesPage() {
  const navigate = useNavigate();
  const { data: categories, loading, error } = useFetch(rolesService.getCategories);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // all | emerging

  const filtered = categories?.filter((c) => {
    const matchSearch = c.description.toLowerCase().includes(search.toLowerCase());
    const matchTab    = tab === 'all' || (tab === 'emerging' && EMERGING.includes(c.category_code));
    return matchSearch && matchTab;
  });

  if (loading) return <LoadingState />;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Role Explorer"
        subtitle="13 role categories, 44+ roles. Click any category to explore competencies, TTFs and elective guidance."
      />

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[['all','All Categories'],['emerging','Emerging Roles']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${tab === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role categories…"
            className="input-field pl-9 w-64" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered?.map((cat) => {
          const isEmerging = EMERGING.includes(cat.category_code);
          return (
            <button key={cat.category_code}
              onClick={() => navigate(`/roles/${cat.category_code}`)}
              className="card p-5 text-left hover:border-brand-500 hover:shadow-md
                         transition-all duration-150 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                    ${isEmerging ? 'bg-amber-50' : 'bg-brand-50'}`}>
                    {isEmerging
                      ? <Sparkles size={16} className="text-amber-500" />
                      : <Briefcase size={16} className="text-brand-500" />}
                  </div>
                  <div className="min-w-0">
                    {isEmerging && (
                      <span className="text-xs font-medium text-amber-600 mb-0.5 block">
                        Emerging Role
                      </span>
                    )}
                    <p className="font-medium text-slate-800 leading-snug">
                      {cat.description}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {cat.roles?.length || 0} roles
                      </span>
                      <span>{cat.competencies?.length || 0} competencies</span>
                      <span>{cat.ttfs?.length || 0} TTFs</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16}
                  className="text-slate-300 group-hover:text-brand-500 shrink-0 mt-1
                             transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Companies link */}
      <button onClick={() => navigate('/roles/companies')}
        className="mt-6 w-full card p-4 text-left hover:border-brand-500 hover:shadow-md
                   transition-all duration-150 group flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-700">Placement Companies</p>
          <p className="text-sm text-slate-400 mt-0.5">
            Companies that recruited last year and the roles they offered
          </p>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="grid sm:grid-cols-2 gap-3">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

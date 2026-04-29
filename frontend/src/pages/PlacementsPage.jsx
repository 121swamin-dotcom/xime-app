import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ChevronRight } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { placementsService } from '../services/placements.service.js';
import { rolesService } from '../services/catalogue.service.js';

export default function PlacementsPage() {
  const navigate = useNavigate();
  const { data: companies, loading, error } = useFetch(placementsService.getAll);
  const { data: categories } = useFetch(rolesService.getCategories);
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = companies?.filter((co) => {
    const matchSearch = co.company_name.toLowerCase().includes(search.toLowerCase()) ||
      co.roles.some((r) => r.role_name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !filterCat || co.roles.some((r) =>
      r.role_categories.some((rc) => rc.category_code === filterCat)
    );
    return matchSearch && matchCat;
  });

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Loading placements…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Placement Companies"
        subtitle="Companies that recruited from XIME IT & Analytics domain. Updated each placement season."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role…"
            className="input-field pl-9 w-64" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="input-field w-72">
          <option value="">All Role Categories</option>
          {categories?.map((c) => (
            <option key={c.category_code} value={c.category_code}>{c.description}</option>
          ))}
        </select>
        {filterCat && (
          <button onClick={() => setFilterCat('')}
            className="text-xs text-[#CC0000] hover:underline self-center">
            Clear filter
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#CC0000]">{companies?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Companies</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#CC0000]">
            {companies?.reduce((s, c) => s + c.roles.length, 0) || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Roles Offered</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#CC0000]">
            {new Set(companies?.flatMap((c) =>
              c.roles.flatMap((r) => r.role_categories.map((rc) => rc.category_code))
            )).size || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Role Categories Covered</p>
        </div>
      </div>

      {/* Company cards */}
      <div className="space-y-3">
        {filtered?.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No companies match your filter.</p>
        )}
        {filtered?.map((co) => (
          <div key={co.company_name} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800">{co.company_name}</h3>
                <div className="space-y-2 mt-2">
                  {co.roles.map((role) => (
                    <div key={role.id} className="flex items-start gap-2 flex-wrap">
                      <span className="text-sm text-slate-600">{role.role_name}</span>
                      <div className="flex flex-wrap gap-1">
                        {role.role_categories.map((rc) => (
                          <button key={rc.category_code}
                            onClick={() => navigate(`/roles/${rc.category_code}`)}
                            className="text-xs bg-red-50 text-[#CC0000] border border-red-100
                                       px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors">
                            {rc.description}
                          </button>
                        ))}
                        {role.role_categories.length === 0 && (
                          <span className="text-xs text-slate-300 italic">Category not mapped</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

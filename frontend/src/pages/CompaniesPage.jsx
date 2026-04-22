import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Search } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { rolesService } from '../services/catalogue.service.js';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { data: companies, loading, error } = useFetch(rolesService.getCompanies);
  const [search, setSearch] = useState('');

  const filtered = companies?.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.role_name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by company name
  const grouped = filtered?.reduce((acc, row) => {
    if (!acc[row.company_name]) acc[row.company_name] = [];
    acc[row.company_name].push(row);
    return acc;
  }, {});

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/roles')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700
                   mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Role Explorer
      </button>

      <PageHeader
        title="Placement Companies"
        subtitle="Companies that recruited from XIME's IT & Analytics domain last year."
      />

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies or roles…"
          className="input-field pl-9 max-w-sm" />
      </div>

      <div className="space-y-3">
        {Object.entries(grouped || {}).map(([company, rows]) => (
          <div key={company} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building2 size={15} className="text-slate-500" />
              </div>
              <h2 className="font-semibold text-slate-800">{company}</h2>
            </div>
            <div className="space-y-2 pl-10">
              {rows.map((row) => (
                <div key={row.id} className="text-sm">
                  <p className="text-slate-700 font-medium">{row.role_name}</p>
                  {row.role_categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {row.role_categories.map((rc) => (
                        <button key={rc.category_code}
                          onClick={() => navigate(`/roles/${rc.category_code}`)}
                          className="text-xs bg-brand-50 text-brand-600 border border-brand-100
                                     px-2 py-0.5 rounded-full hover:bg-brand-100 transition-colors">
                          {rc.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

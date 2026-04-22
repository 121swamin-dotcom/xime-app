import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Brain, Wrench, BookOpen, Users, Sparkles } from 'lucide-react';
import { Badge } from '../components/shared/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { rolesService } from '../services/catalogue.service.js';

const EMERGING = ['EM_AI_PROD_MGR','EM_DEC_SCIENTIST','EM_AI_CONSULTANT','EM_DATA_GOV_CDO'];

export default function RoleCategoryPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: cat, loading, error } = useFetch(() => rolesService.getCategory(code), [code]);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;
  if (!cat)    return null;

  const isEmerging = EMERGING.includes(cat.category_code);
  const mandatory   = cat.courses?.filter((c) => c.type === 'M') || [];
  const recommended = cat.courses?.filter((c) => c.type === 'R') || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/roles')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700
                   mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Role Explorer
      </button>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
            ${isEmerging ? 'bg-amber-50' : 'bg-brand-50'}`}>
            {isEmerging
              ? <Sparkles size={22} className="text-amber-500" />
              : <Briefcase size={22} className="text-brand-500" />}
          </div>
          <div>
            {isEmerging && (
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 block">
                Emerging Role Category
              </span>
            )}
            <h1 className="text-xl font-semibold text-slate-800">{cat.description}</h1>
            <p className="text-sm text-slate-400 font-mono mt-1">{cat.category_code}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Specific Roles */}
        <Section icon={<Users size={16} />} title={`Roles (${cat.roles?.length || 0})`}>
          <div className="flex flex-wrap gap-2">
            {cat.roles?.map((r) => (
              <span key={r.role_code}
                className="text-sm bg-brand-50 text-brand-700 border border-brand-100
                           px-3 py-1 rounded-full">
                {r.role_name}
              </span>
            ))}
          </div>
        </Section>

        {/* Competencies */}
        <Section icon={<Brain size={16} />} title={`Competencies (${cat.competencies?.length || 0})`}>
          <ul className="space-y-1.5">
            {cat.competencies?.map((c) => (
              <li key={c.competency_code} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="font-mono text-xs text-slate-400 mt-0.5 shrink-0 w-14">
                  {c.competency_code}
                </span>
                {c.description}
              </li>
            ))}
          </ul>
        </Section>

        {/* TTFs */}
        <Section icon={<Wrench size={16} />} title={`Tools & Frameworks (${cat.ttfs?.length || 0})`}>
          <div className="flex flex-wrap gap-2">
            {cat.ttfs?.map((t) => (
              <span key={t.ttf_code}
                className="text-sm bg-slate-50 border border-slate-200 text-slate-600
                           px-3 py-1 rounded-full">
                {t.description}
              </span>
            ))}
          </div>
        </Section>

        {/* Elective Guidance */}
        <Section icon={<BookOpen size={16} />} title="Elective Guidance">
          {mandatory.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Mandatory</p>
              <div className="space-y-1.5">
                {mandatory.map((c) => (
                  <button key={c.course_code}
                    onClick={() => navigate(`/courses/${c.course_code}`)}
                    className="flex items-center gap-2 text-sm hover:text-brand-500 transition-colors w-full text-left">
                    <Badge type="M" />
                    <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
                    <span className="text-slate-600">{c.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {recommended.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Recommended</p>
              <div className="space-y-1.5">
                {recommended.map((c) => (
                  <button key={c.course_code}
                    onClick={() => navigate(`/courses/${c.course_code}`)}
                    className="flex items-center gap-2 text-sm hover:text-brand-500 transition-colors w-full text-left">
                    <Badge type="R" />
                    <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
                    <span className="text-slate-600">{c.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-500">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

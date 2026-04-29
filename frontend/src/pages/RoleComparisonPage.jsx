import { useState } from 'react';
import { ArrowLeftRight, Brain, Wrench, BookOpen } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { rolesService } from '../services/catalogue.service.js';
import { analyticsService } from '../services/analytics.service.js';

export default function RoleComparisonPage() {
  const { data: categories } = useFetch(rolesService.getCategories);
  const [catA, setCatA] = useState('');
  const [catB, setCatB] = useState('');

  const { data: dataA } = useFetch(
    () => catA ? rolesService.getCategory(catA) : Promise.resolve({ data: null }),
    [catA]
  );
  const { data: dataB } = useFetch(
    () => catB ? rolesService.getCategory(catB) : Promise.resolve({ data: null }),
    [catB]
  );

  const { data: pathway } = useFetch(analyticsService.getCareerPathway);

  // Get student's ratings for a competency/TTF
  function myCompRating(code) {
    if (!pathway?.competencies) return 0;
    return pathway.competencies.find((c) => c.competency_code === code)?.rating || 0;
  }
  function myTTFRating(code) {
    if (!pathway?.ttfs) return 0;
    return pathway.ttfs.find((t) => t.ttf_code === code)?.rating || 0;
  }

  const DREYFUS = ['—','Novice','Adv Beginner','Competent','Proficient','Expert'];
  const ratingColor = (r) => r >= 4 ? 'text-green-600' : r >= 3 ? 'text-amber-600' : r > 0 ? 'text-red-500' : 'text-slate-300';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Role Comparison"
        subtitle="Compare two role categories side by side — competencies, TTFs, and electives."
      />

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <label className="label">Role Category A</label>
          <select value={catA} onChange={(e) => setCatA(e.target.value)} className="input-field">
            <option value="">Select…</option>
            {categories?.filter((c) => c.category_code !== catB).map((c) => (
              <option key={c.category_code} value={c.category_code}>{c.description}</option>
            ))}
          </select>
        </div>
        <div className="card p-4">
          <label className="label">Role Category B</label>
          <select value={catB} onChange={(e) => setCatB(e.target.value)} className="input-field">
            <option value="">Select…</option>
            {categories?.filter((c) => c.category_code !== catA).map((c) => (
              <option key={c.category_code} value={c.category_code}>{c.description}</option>
            ))}
          </select>
        </div>
      </div>

      {(!catA || !catB) && (
        <div className="card p-12 text-center text-slate-400">
          <ArrowLeftRight size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">Select two role categories above to compare</p>
        </div>
      )}

      {catA && catB && dataA && dataB && (
        <div className="space-y-5">

          {/* Competencies comparison */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Brain size={15} className="text-[#CC0000]" />
              <h3 className="text-sm font-semibold text-slate-700">Competencies</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {/* Column A */}
              <div className="p-4">
                <p className="text-xs font-bold text-[#CC0000] uppercase mb-3">{dataA?.description}</p>
                {dataA?.competencies?.map((c) => {
                  const r = myCompRating(c.competency_code);
                  return (
                    <div key={c.competency_code} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-600 flex-1 mr-2">{c.description}</span>
                      <span className={`text-xs font-semibold shrink-0 ${ratingColor(r)}`}>
                        {r > 0 ? DREYFUS[Math.round(r)] : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Column B */}
              <div className="p-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">{dataB?.description}</p>
                {dataB?.competencies?.map((c) => {
                  const r = myCompRating(c.competency_code);
                  return (
                    <div key={c.competency_code} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-600 flex-1 mr-2">{c.description}</span>
                      <span className={`text-xs font-semibold shrink-0 ${ratingColor(r)}`}>
                        {r > 0 ? DREYFUS[Math.round(r)] : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TTFs comparison */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Wrench size={15} className="text-[#CC0000]" />
              <h3 className="text-sm font-semibold text-slate-700">Tools & Frameworks</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-4">
                <p className="text-xs font-bold text-[#CC0000] uppercase mb-3">{dataA?.description}</p>
                {dataA?.ttfs?.map((t) => {
                  const r = myTTFRating(t.ttf_code);
                  return (
                    <div key={t.ttf_code} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-600 flex-1 mr-2">{t.description}</span>
                      <span className={`text-xs font-semibold shrink-0 ${ratingColor(r)}`}>
                        {r > 0 ? DREYFUS[Math.round(r)] : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">{dataB?.description}</p>
                {dataB?.ttfs?.map((t) => {
                  const r = myTTFRating(t.ttf_code);
                  return (
                    <div key={t.ttf_code} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-600 flex-1 mr-2">{t.description}</span>
                      <span className={`text-xs font-semibold shrink-0 ${ratingColor(r)}`}>
                        {r > 0 ? DREYFUS[Math.round(r)] : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Electives comparison */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <BookOpen size={15} className="text-[#CC0000]" />
              <h3 className="text-sm font-semibold text-slate-700">Elective Guidance</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-4">
                <p className="text-xs font-bold text-[#CC0000] uppercase mb-3">{dataA?.description}</p>
                {dataA?.courses?.map((c) => (
                  <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <Badge type={c.type} />
                    <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
                    <span className="text-xs text-slate-600">{c.description}</span>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">{dataB?.description}</p>
                {dataB?.courses?.map((c) => (
                  <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <Badge type={c.type} />
                    <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
                    <span className="text-xs text-slate-600">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

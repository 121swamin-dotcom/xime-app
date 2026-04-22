import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Badge, TermBadge } from '../components/shared/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { coursesService } from '../services/catalogue.service.js';

const TERM_LABELS = { 3: 'Term 3 — Core', 4: 'Term 4', 5: 'Term 5', 6: 'Term 6' };
const TERM_ORDER  = [3, 4, 5, 6];

export default function CoursesPage() {
  const navigate = useNavigate();
  const { data: courses, loading, error } = useFetch(coursesService.getAll);
  const [search, setSearch] = useState('');

  const filtered = courses?.filter((c) =>
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.course_code.toLowerCase().includes(search.toLowerCase())
  );

  const byTerm = TERM_ORDER.reduce((acc, t) => {
    acc[t] = filtered?.filter((c) => c.term_code === t) || [];
    return acc;
  }, {});

  if (loading) return <LoadingState />;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Course Catalogue"
        subtitle="14 courses across Terms 3–6. T3 is core for all students."
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="input-field pl-9 max-w-sm"
        />
      </div>

      {/* Courses grouped by term */}
      {TERM_ORDER.map((term) => (
        byTerm[term]?.length > 0 && (
          <div key={term} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TermBadge termCode={term} />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {TERM_LABELS[term]}
              </h2>
              {term === 3 && (
                <span className="text-xs text-slate-400 ml-1">(view only — no elective registration)</span>
              )}
            </div>

            <div className="grid gap-3">
              {byTerm[term].map((course) => (
                <button
                  key={course.course_code}
                  onClick={() => navigate(`/courses/${course.course_code}`)}
                  className="card p-4 text-left hover:border-brand-500 hover:shadow-md
                             transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center
                                      justify-center shrink-0 mt-0.5">
                        <BookOpen size={16} className="text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {course.course_code}
                          </span>
                          {term === 3 && <Badge type="CORE" />}
                        </div>
                        <p className="font-medium text-slate-800 mt-0.5 leading-snug">
                          {course.description}
                        </p>
                        {/* TTF pills */}
                        {course.ttfs?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {course.ttfs.map((t) => (
                              <span key={t.ttf_code}
                                className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {t.description.split('(')[0].trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16}
                      className="text-slate-300 group-hover:text-brand-500 shrink-0 mt-1
                                 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
      {[1,2,3,4].map((i) => (
        <div key={i} className="card p-4 mb-3 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/3 mt-2" />
        </div>
      ))}
    </div>
  );
}

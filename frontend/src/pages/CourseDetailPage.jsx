import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, Wrench, GitBranch, Briefcase } from 'lucide-react';
import { Badge, TermBadge } from '../components/shared/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { coursesService } from '../services/catalogue.service.js';

export default function CourseDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: course, loading, error } = useFetch(() => coursesService.getOne(code), [code]);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;
  if (!course) return null;

  const outcomes = [course.co1, course.co2, course.co3, course.co4, course.co5, course.co6]
    .filter(Boolean);

  const mandatory    = course.role_mappings?.filter((r) => r.type === 'M') || [];
  const recommended  = course.role_mappings?.filter((r) => r.type === 'R') || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/courses')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700
                   mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Catalogue
      </button>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center
                          justify-center shrink-0">
            <BookOpen size={22} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm font-semibold text-slate-400">
                {course.course_code}
              </span>
              <TermBadge termCode={course.term_code} />
              {course.term_code === 3 && (
                <span className="text-xs text-slate-400 italic">Core — view only</span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-slate-800 leading-snug">
              {course.description}
            </h1>
            {course.course_objectives && (
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                {course.course_objectives}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Course Outcomes */}
        {outcomes.length > 0 && (
          <Section icon={<Target size={16} />} title="Course Outcomes">
            <ol className="space-y-2">
              {outcomes.map((co, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                  <span className="font-mono text-xs font-bold text-brand-500 mt-0.5 shrink-0">
                    CO{i + 1}
                  </span>
                  {co}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Tools / TTFs */}
        {course.ttfs?.length > 0 && (
          <Section icon={<Wrench size={16} />} title="Tools & Frameworks">
            <div className="flex flex-wrap gap-2">
              {course.ttfs.map((t) => (
                <span key={t.ttf_code}
                  className="text-sm bg-slate-50 border border-slate-200 text-slate-600
                             px-3 py-1 rounded-full">
                  {t.description}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Prerequisites */}
        {course.prerequisites?.length > 0 && (
          <Section icon={<GitBranch size={16} />} title="Prerequisites">
            <div className="space-y-1.5">
              {course.prerequisites.map((p) => (
                <button key={p.course_code}
                  onClick={() => navigate(`/courses/${p.course_code}`)}
                  className="flex items-center gap-2 text-sm text-brand-500
                             hover:underline">
                  <span className="font-mono text-xs">{p.course_code}</span>
                  {p.description}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Role Category Relevance */}
        {(mandatory.length > 0 || recommended.length > 0) && (
          <Section icon={<Briefcase size={16} />} title="Role Category Relevance">
            {mandatory.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Mandatory for</p>
                <div className="space-y-1">
                  {mandatory.map((r) => (
                    <div key={r.category_code} className="flex items-center gap-2">
                      <Badge type="M" />
                      <span className="text-sm text-slate-600">{r.category_description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recommended.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Recommended for</p>
                <div className="space-y-1">
                  {recommended.map((r) => (
                    <div key={r.category_code} className="flex items-center gap-2">
                      <Badge type="R" />
                      <span className="text-sm text-slate-600">{r.category_description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Design Principle */}
        {course.design_principle && (
          <Section icon={<Target size={16} />} title="Design Principle">
            <p className="text-sm text-slate-600 leading-relaxed">{course.design_principle}</p>
          </Section>
        )}

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

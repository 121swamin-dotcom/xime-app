import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { RequireAuth, RequireAdmin } from './components/layout/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

// Auth pages
import LoginPage            from './pages/LoginPage.jsx';
import ActivatePage         from './pages/ActivatePage.jsx';
import ForgotPasswordPage   from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage    from './pages/ResetPasswordPage.jsx';

import PlacementsPage       from './pages/PlacementsPage.jsx';
import RoleComparisonPage   from './pages/RoleComparisonPage.jsx';

// Student pages
import DashboardPage        from './pages/DashboardPage.jsx';
import CoursesPage          from './pages/CoursesPage.jsx';
import CourseDetailPage     from './pages/CourseDetailPage.jsx';
import RolesPage            from './pages/RolesPage.jsx';
import RoleCategoryPage     from './pages/RoleCategoryPage.jsx';
import CompaniesPage        from './pages/CompaniesPage.jsx';
import ElectivesPage        from './pages/ElectivesPage.jsx';
import CompetenciesPage     from './pages/CompetenciesPage.jsx';
import CounsellingPage      from './pages/CounsellingPage.jsx';
import MentoringPage        from './pages/MentoringPage.jsx';
import EvidenceGalleryPage  from './pages/EvidenceGalleryPage.jsx';
import CareerPathwayPage    from './pages/CareerPathwayPage.jsx';
import PeerBenchmarkingPage from './pages/PeerBenchmarkingPage.jsx';

// Admin pages
import AdminOverviewPage    from './pages/AdminOverviewPage.jsx';
import AdminRoleAnalyticsPage from './pages/AdminRoleAnalyticsPage.jsx';
import {
  AdminActivationsPage, AdminEvidencePage, AdminElectiveChangesPage,
  AdminCounsellingPage, AdminMentoringPage,
  AdminStudentsPage, AdminStudentProfilePage,
} from './pages/AdminQueues.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/activate"        element={<ActivatePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ── Student ─────────────────────────────────────────────── */}
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/courses"      element={<CoursesPage />} />
            <Route path="/courses/:code" element={<CourseDetailPage />} />
            <Route path="/roles"        element={<RolesPage />} />
            <Route path="/roles/companies" element={<CompaniesPage />} />
            <Route path="/roles/:code"  element={<RoleCategoryPage />} />
            <Route path="/placements"   element={<PlacementsPage />} />
            <Route path="/electives"    element={<ElectivesPage />} />
            <Route path="/competencies" element={<CompetenciesPage />} />
            <Route path="/evidence"     element={<EvidenceGalleryPage />} />
            <Route path="/pathway"      element={<CareerPathwayPage />} />
            <Route path="/compare"      element={<RoleComparisonPage />} />
            <Route path="/peers"        element={<PeerBenchmarkingPage />} />
            <Route path="/counselling"  element={<CounsellingPage />} />
            <Route path="/mentoring"    element={<MentoringPage />} />
          </Route>

          {/* ── Admin ───────────────────────────────────────────────── */}
          <Route element={<RequireAdmin><AppShell /></RequireAdmin>}>
            <Route path="/admin"                    element={<AdminOverviewPage />} />
            <Route path="/admin/activations"        element={<AdminActivationsPage />} />
            <Route path="/admin/evidence"           element={<AdminEvidencePage />} />
            <Route path="/admin/electives"          element={<AdminElectiveChangesPage />} />
            <Route path="/admin/counselling"        element={<AdminCounsellingPage />} />
            <Route path="/admin/mentoring"          element={<AdminMentoringPage />} />
            <Route path="/admin/mentoring-overview" element={<AdminMentoringPage />} />
            <Route path="/admin/role-analytics"     element={<AdminRoleAnalyticsPage />} />
            <Route path="/admin/students"           element={<AdminStudentsPage />} />
            <Route path="/admin/students/:id"       element={<AdminStudentProfilePage />} />
          </Route>

          {/* ── Fallback ────────────────────────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

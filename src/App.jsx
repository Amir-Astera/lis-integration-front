import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useDashboardApp } from './hooks/useDashboardApp';
import { useReagents } from './hooks/useReagents';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import EquipmentPage from './pages/EquipmentPage';
import LoginPage from './pages/LoginPage';
import ReagentsPage from './pages/ReagentsPage';
import RegistryPage from './pages/RegistryPage';
import ReportsPage from './pages/ReportsPage';
import WarehousePage from './pages/WarehousePage';
import WorklistsPage from './pages/WorklistsPage';

function App() {
  const app = useDashboardApp();
  const reagents = useReagents(app.token, app.isAdmin, () => app.handleLogout());
  const defaultAuthorizedPath = app.isAdmin ? '/admin' : '/dashboard';

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            authForm={app.authForm}
            defaultPath={defaultAuthorizedPath}
            loading={app.loading}
            loginError={app.loginError}
            successMessage={app.successMessage}
            onChange={app.handleAuthFormChange}
            onSubmit={app.handleLogin}
            token={app.token}
          />
        }
      />

      <Route element={<ProtectedRoute token={app.token} />}>
        <Route
          element={
            <AppLayout
              currentUser={app.currentUser}
              isAdmin={app.isAdmin}
              bootstrapping={app.bootstrapping}
              globalError={app.globalError}
              successMessage={app.successMessage}
              onLogout={app.handleLogout}
            />
          }
        >
          <Route path="/dashboard" element={
            <DashboardPage 
              currentUser={app.currentUser} 
              uploads={app.uploads} 
              overview={app.operationalOverview}
              referralRegistrationSummary={app.referralRegistrationSummary}
              workplaceProcessedView={app.workplaceProcessedView}
              materialProcessedView={app.materialProcessedView}
              workplaceDetailReport={app.workplaceDetailReport}
            />
          } />
          <Route path="/registry" element={<RegistryPage overview={app.operationalOverview} />} />
          <Route path="/worklists" element={<WorklistsPage overview={app.operationalOverview} />} />
          <Route path="/equipment" element={<EquipmentPage reagents={reagents} />} />
          <Route path="/warehouse" element={<WarehousePage reagents={reagents} />} />
          <Route path="/reagents" element={<ReagentsPage reagents={reagents} isAdmin={app.isAdmin} />} />
          <Route path="/reports" element={<ReportsPage uploads={app.uploads} onRefresh={app.refreshUploads} />} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/uploads" element={<Navigate to="/reports" replace />} />

          <Route element={<AdminRoute isAdmin={app.isAdmin} />}>
            <Route
              path="/admin"
              element={
                <AdminPage
                  authorities={app.authorities}
                  fileMap={app.fileMap}
                  onCreateUser={app.handleCreateUser}
                  onFileChange={app.handleFileChange}
                  onRefresh={app.refreshAdminData}
                  onSourceModeChange={app.handleSourceModeChange}
                  onToggleAuthority={app.toggleAuthority}
                  onUpload={app.handleUpload}
                  reportKinds={app.reportKinds}
                  sourceMode={app.sourceMode}
                  userForm={app.userForm}
                  usersData={app.usersData}
                  setUserForm={app.setUserForm}
                />
              }
            />
          </Route>

          <Route path="/" element={<Navigate to={defaultAuthorizedPath} replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={app.token ? defaultAuthorizedPath : '/login'} replace />} />
    </Routes>
  );
}

export default App;

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';

function AppLayout({ currentUser, isAdmin, bootstrapping, globalError, successMessage, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Панель управления', path: '/dashboard' },
    { label: 'Регистратура', path: '/registry' },
    { label: 'Рабочие листы', path: '/worklists' },
    { label: 'Оборудование', path: '/equipment' },
    { label: 'Склад', path: '/warehouse' },
    { label: 'Реагенты', path: '/reagents' },
    { label: 'Отчеты', path: '/reports' },
    ...(isAdmin ? [{ label: 'Админ-панель', path: '/admin' }] : []),
  ];

  return (
    <div className="app-shell">
      <AppHeader
        currentPath={location.pathname}
        currentUser={currentUser}
        items={navigationItems}
        onChange={(path) => navigate(path, { replace: path === location.pathname })}
        onLogout={onLogout}
      />

      <main className="main-container">
        {bootstrapping ? <div className="info-banner">Загрузка данных с backend...</div> : null}
        {globalError ? <div className="error-banner">{globalError}</div> : null}
        {successMessage ? <div className="success-banner">{successMessage}</div> : null}

        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;

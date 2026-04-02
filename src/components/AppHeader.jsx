import { getUserRoleLabels } from '../lib/authz';

function AppHeader({ currentPath, currentUser, items, onChange, onLogout }) {
  const roleLabels = getUserRoleLabels(currentUser);
  const primaryRole = roleLabels[0] || 'Пользователь';
  const roleTitle = primaryRole === 'Руководитель' ? 'Руководитель лаборатории' : primaryRole;

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-mark" />
          LIMS Damumed
        </div>
        <nav className="nav-links">
          {items.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-link${currentPath === item.path ? ' active' : ''}`}
              onClick={() => onChange(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="header-right">
        <div className="user-meta">
          <span>{currentUser?.department || 'г. Астана'}</span>
          <span className="divider">|</span>
          <span>{roleTitle}</span>
          <span className="divider">|</span>
          <button type="button" className="inline-link nav-logout" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

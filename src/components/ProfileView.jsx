import { getUserRoleLabels } from '../lib/authz';

function ProfileView({ currentUser, isAdmin }) {
  const roleLabels = getUserRoleLabels(currentUser);

  return (
    <div className="two-column-grid">
      <section className="surface-card">
        <div className="card-title-row">
          <h2>Профиль пользователя</h2>
          <span className="status-badge">Авторизован</span>
        </div>
        <div className="muted-list">
          <div className="muted-list-item"><strong>Имя:</strong> {currentUser?.name}</div>
          <div className="muted-list-item"><strong>Email:</strong> {currentUser?.email || '—'}</div>
          <div className="muted-list-item"><strong>Логин:</strong> {currentUser?.login}</div>
          <div className="muted-list-item"><strong>Телефон:</strong> {currentUser?.phone || '—'}</div>
        </div>
      </section>

      <section className="surface-card">
        <div className="card-title-row">
          <h2>Доступы</h2>
          <span className="status-badge">{isAdmin ? 'Администратор' : 'Пользовательский доступ'}</span>
        </div>
        <div className="badge-row">
          {roleLabels.map((label) => (
            <span key={label} className="role-badge">{label}</span>
          ))}
        </div>
        <div className="info-banner" style={{ marginTop: 16 }}>
          По ТЗ используются роли «Администратор», «Руководитель» и «Аналитик». Все пользователи без роли администратора после входа перенаправляются на основной дашборд.
        </div>
      </section>
    </div>
  );
}

export default ProfileView;

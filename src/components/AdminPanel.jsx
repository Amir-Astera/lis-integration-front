import { getAuthorityDisplayName, getUserRoleLabels } from '../lib/authz';

function AdminPanel({
  authorities,
  fileMap,
  onCreateUser,
  onFileChange,
  onRefresh,
  onSourceModeChange,
  onToggleAuthority,
  onUpload,
  reportKinds,
  sourceMode,
  userForm,
  usersData,
  setUserForm,
}) {
  return (
    <div className="two-column-grid">
      <section className="surface-card">
        <div className="card-title-row">
          <h2>Создание аккаунтов</h2>
          <span className="status-badge">Admin only</span>
        </div>
        <form className="form-stack" onSubmit={onCreateUser}>
          <div className="form-grid">
            <div className="field-group">
              <label>Имя</label>
              <input value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label>Фамилия</label>
              <input value={userForm.surname} onChange={(event) => setUserForm((prev) => ({ ...prev, surname: event.target.value }))} />
            </div>
            <div className="field-group">
              <label>Логин</label>
              <input value={userForm.login} onChange={(event) => setUserForm((prev) => ({ ...prev, login: event.target.value }))} />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" value={userForm.email} onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label>Телефон</label>
              <input value={userForm.phone} onChange={(event) => setUserForm((prev) => ({ ...prev, phone: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label>Пароль</label>
              <input type="password" value={userForm.password} onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))} required />
            </div>
          </div>

          <div className="field-group">
            <label>Роли</label>
            <div className="badge-row">
              {authorities.map((authority) => (
                <button
                  key={authority.id}
                  type="button"
                  className={`tab-button${userForm.authorityIds.includes(authority.id) ? ' active' : ''}`}
                  onClick={() => onToggleAuthority(authority.id)}
                >
                  {getAuthorityDisplayName(authority)}
                </button>
              ))}
            </div>
          </div>

          <div className="actions-row">
            <button type="submit" className="primary-button">Создать аккаунт</button>
          </div>
        </form>
      </section>

      <section className="surface-card">
        <div className="card-title-row">
          <h2>Пользователи и ручная загрузка отчетов</h2>
          <button type="button" className="secondary-button" onClick={onRefresh}>Обновить</button>
        </div>

        <div className="field-group" style={{ marginBottom: 20 }}>
          <label>Режим источника</label>
          <select value={sourceMode} onChange={onSourceModeChange}>
            <option value="MANUAL">MANUAL</option>
            <option value="DAMUMED_API">DAMUMED_API</option>
          </select>
        </div>

        <div className="table-wrap" style={{ marginBottom: 20 }}>
          <table className="table-grid">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Роли</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email || '—'}</td>
                  <td>{user.phone || '—'}</td>
                  <td>{getUserRoleLabels(user).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-kind-grid">
          {reportKinds.map((reportKind) => (
            <div key={reportKind.code} className="report-card">
              <h3>{reportKind.displayName}</h3>
              <div className="helper-text">{reportKind.code}</div>
              <input
                className="file-input"
                type="file"
                accept=".xls,.xlsx"
                onChange={(event) => onFileChange(reportKind.code, event.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="primary-button"
                onClick={() => onUpload(reportKind.code)}
                disabled={!fileMap[reportKind.code]}
              >
                Загрузить отчет
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;

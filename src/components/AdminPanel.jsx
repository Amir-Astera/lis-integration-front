import { useState } from 'react';
import { getAuthorityDisplayName, getUserRoleLabels } from '../lib/authz';
import { normalizeUpload } from '../services/dashboard';

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  NORMALIZING: 'Нормализация...',
  NORMALIZED: 'Нормализован',
  FAILED: 'Ошибка',
  SUPERSEDED: 'Заменён',
};

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  NORMALIZING: '#3b82f6',
  NORMALIZED: '#10b981',
  FAILED: '#ef4444',
  SUPERSEDED: '#94a3b8',
};

const KIND_LABELS = {
  WORKPLACE_COMPLETED_STUDIES: 'Рабочие места',
  REFERRAL_REGISTRATION_JOURNAL: 'Журнал регистрации',
  REFERRAL_COUNT_BY_MATERIAL: 'Направления по материалу',
  OPERATIONAL_OVERVIEW: 'Операционный обзор',
};

function NormalizationBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}

function ReportUploadCard({ reportKind, file, onFileChange, onUpload, uploading }) {
  return (
    <div className="report-card">
      <h3>{KIND_LABELS[reportKind.code] || reportKind.displayName}</h3>
      <div className="helper-text" style={{ marginBottom: 8 }}>{reportKind.code}</div>
      <input
        className="file-input"
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => onFileChange(reportKind.code, e.target.files?.[0] || null)}
      />
      <button
        type="button"
        className="primary-button"
        onClick={() => onUpload(reportKind.code)}
        disabled={!file || uploading}
        style={{ marginTop: 8 }}
      >
        {uploading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </div>
  );
}

function UploadHistoryTable({ uploads, token, onNormalized }) {
  const [normalizingIds, setNormalizingIds] = useState({});
  const [errors, setErrors] = useState({});

  const sorted = [...(uploads || [])].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );

  async function handleNormalize(uploadId) {
    setNormalizingIds((p) => ({ ...p, [uploadId]: true }));
    setErrors((p) => ({ ...p, [uploadId]: null }));
    try {
      await normalizeUpload(token, uploadId);
      if (onNormalized) onNormalized();
    } catch (err) {
      setErrors((p) => ({ ...p, [uploadId]: err?.message || 'Ошибка нормализации' }));
    } finally {
      setNormalizingIds((p) => ({ ...p, [uploadId]: false }));
    }
  }

  if (!sorted.length) {
    return <div className="helper-text">Загрузок пока нет.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table-grid" style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th>Дата загрузки</th>
            <th>Тип отчета</th>
            <th>Файл</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((upload) => (
            <tr key={upload.id}>
              <td style={{ whiteSpace: 'nowrap' }}>
                {upload.uploadedAt
                  ? new Date(upload.uploadedAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </td>
              <td>{KIND_LABELS[upload.reportKind] || upload.reportKind}</td>
              <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {upload.fileName || upload.originalFileName || '—'}
              </td>
              <td>
                <NormalizationBadge status={upload.normalizationStatus} />
                {errors[upload.id] && (
                  <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{errors[upload.id]}</div>
                )}
              </td>
              <td>
                {upload.normalizationStatus !== 'NORMALIZED' && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    disabled={normalizingIds[upload.id]}
                    onClick={() => handleNormalize(upload.id)}
                  >
                    {normalizingIds[upload.id] ? 'Идет...' : 'Нормализовать'}
                  </button>
                )}
                {upload.normalizationStatus === 'NORMALIZED' && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: 12, padding: '4px 10px', opacity: 0.7 }}
                    disabled={normalizingIds[upload.id]}
                    onClick={() => handleNormalize(upload.id)}
                    title="Повторно нормализовать (пересчитать данные)"
                  >
                    {normalizingIds[upload.id] ? 'Идет...' : 'Пересчитать'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPanel({
  authorities,
  fileMap,
  onCreateUser,
  onFileChange,
  onRefresh,
  onSourceModeChange,
  onUpload,
  reportKinds,
  sourceMode,
  userForm,
  usersData,
  setUserForm,
  uploads,
  token,
}) {
  const [uploadingKind, setUploadingKind] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');

  async function handleUploadWithStatus(reportKind) {
    setUploadingKind(reportKind);
    try {
      await onUpload(reportKind);
    } finally {
      setUploadingKind(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="surface-card" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'reports', label: 'Загрузка отчетов' },
            { key: 'uploads', label: 'История загрузок' },
            { key: 'users', label: 'Пользователи' },
            { key: 'settings', label: 'Настройки' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button type="button" className="secondary-button" onClick={onRefresh}>
            Обновить
          </button>
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="surface-card">
          <div className="card-title-row" style={{ marginBottom: 16 }}>
            <h2>Ручная загрузка отчетов Damumed</h2>
            <span className="status-badge">Admin only</span>
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 20,
            background: '#3b82f610', border: '1px solid #3b82f630', fontSize: 13, lineHeight: 1.5,
          }}>
            <strong>Как это работает:</strong> Загрузите Excel-файл отчёта из Damumed. Период определяется автоматически из содержимого файла.
            При повторной загрузке того же типа отчёта — <strong>предыдущие данные заменяются</strong> новыми (не дублируются).
            Нормализация выполняется автоматически при загрузке.
          </div>
          <div className="report-kind-grid">
            {reportKinds.map((rk) => (
              <ReportUploadCard
                key={rk.code}
                reportKind={rk}
                file={fileMap[rk.code]}
                onFileChange={onFileChange}
                onUpload={handleUploadWithStatus}
                uploading={uploadingKind === rk.code}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'uploads' && (
        <div className="surface-card">
          <div className="card-title-row" style={{ marginBottom: 16 }}>
            <h2>История загрузок отчетов</h2>
            <span className="helper-text">{uploads?.length || 0} загрузок</span>
          </div>
          <p className="helper-text" style={{ marginBottom: 16 }}>
            «Нормализовать» — обработать файл и извлечь данные. «Пересчитать» — повторно нормализовать уже обработанный файл (например, после исправления парсера).
          </p>
          <UploadHistoryTable uploads={uploads} token={token} onNormalized={onRefresh} />
        </div>
      )}

      {activeTab === 'users' && (
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
                  <input
                    value={userForm.name}
                    onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Фамилия</label>
                  <input
                    value={userForm.surname}
                    onChange={(e) => setUserForm((p) => ({ ...p, surname: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>Логин</label>
                  <input
                    value={userForm.login}
                    onChange={(e) => setUserForm((p) => ({ ...p, login: e.target.value }))}
                  />
                </div>
                <div className="field-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Телефон</label>
                  <input
                    value={userForm.phone}
                    onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Пароль</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Роли</label>
                <div className="badge-row">
                  {authorities.map((auth) => (
                    <button
                      key={auth.id}
                      type="button"
                      className={`tab-button${userForm.authorityIds.includes(auth.id) ? ' active' : ''}`}
                      onClick={() =>
                        setUserForm((p) => ({
                          ...p,
                          authorityIds: p.authorityIds.includes(auth.id)
                            ? p.authorityIds.filter((x) => x !== auth.id)
                            : [...p.authorityIds, auth.id],
                        }))
                      }
                    >
                      {getAuthorityDisplayName(auth)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="actions-row">
                <button type="submit" className="primary-button">
                  Создать аккаунт
                </button>
              </div>
            </form>
          </section>

          <section className="surface-card">
            <div className="card-title-row">
              <h2>Список пользователей</h2>
            </div>
            <div className="table-wrap">
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
          </section>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="surface-card" style={{ maxWidth: 480 }}>
          <div className="card-title-row" style={{ marginBottom: 16 }}>
            <h2>Настройки системы</h2>
          </div>
          <div className="field-group">
            <label>Режим источника данных</label>
            <select value={sourceMode} onChange={onSourceModeChange}>
              <option value="MANUAL">MANUAL — ручная загрузка файлов</option>
              <option value="DAMUMED_API">DAMUMED_API — интеграция с Damumed</option>
            </select>
            <div className="helper-text" style={{ marginTop: 4 }}>
              {sourceMode === 'MANUAL'
                ? 'Данные загружаются вручную через раздел «Загрузка отчетов».'
                : 'Данные автоматически синхронизируются с Damumed API.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

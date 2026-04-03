import { useCallback, useEffect, useState } from 'react';
import {
  autoPopulateAnalyzerReagentLinks,
  createAnalyzerReagentLink,
  deleteAnalyzerReagentLink,
  fetchAnalyzerReagentLinks,
  fetchReagentInventory,
  toggleAnalyzerReagentLink,
} from '../../services/reagents';

const USAGE_ROLES = [
  { value: 'MAIN', label: 'Основной реагент' },
  { value: 'DILUENT', label: 'Разбавитель' },
  { value: 'WASH', label: 'Промывочный раствор' },
  { value: 'CALIBRATOR', label: 'Калибратор' },
  { value: 'CONTROL', label: 'Контрольный материал' },
  { value: 'OTHER', label: 'Прочее' },
];

const ROLE_COLORS = {
  MAIN: '#2563eb',
  DILUENT: '#7c3aed',
  WASH: '#059669',
  CALIBRATOR: '#d97706',
  CONTROL: '#dc2626',
  OTHER: '#6b7280',
};

const STATUS_LABELS = {
  IN_STOCK: 'В наличии',
  LOW_STOCK: 'Мало',
  OUT_OF_STOCK: 'Нет',
  CRITICAL: 'Критично',
  EXPIRED: 'Истёк срок',
  ORDERED: 'Заказан',
};

function AnalyzerReagentLinksPanel({ token, analyzers, isAdmin }) {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState('');
  const [links, setLinks] = useState([]);
  const [reagentInventory, setReagentInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addForm, setAddForm] = useState({
    reagentInventoryId: '',
    usageRole: 'MAIN',
    estimatedDailyMl: '',
    estimatedDailyUnits: '',
    notes: '',
  });

  const loadLinks = useCallback(async (analyzerId) => {
    if (!analyzerId || !token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchAnalyzerReagentLinks(token, analyzerId);
      setLinks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Ошибка загрузки привязок: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadInventory = useCallback(async (analyzerId) => {
    if (!token) return;
    try {
      const data = await fetchReagentInventory(token, analyzerId || null);
      setReagentInventory(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (selectedAnalyzerId) {
      loadLinks(selectedAnalyzerId);
      loadInventory(selectedAnalyzerId);
    } else {
      loadInventory(null);
    }
  }, [selectedAnalyzerId, loadLinks, loadInventory]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAnalyzerReagentLink(token, selectedAnalyzerId, {
        reagentInventoryId: addForm.reagentInventoryId,
        usageRole: addForm.usageRole,
        estimatedDailyMl: addForm.estimatedDailyMl ? parseFloat(addForm.estimatedDailyMl) : null,
        estimatedDailyUnits: addForm.estimatedDailyUnits ? parseInt(addForm.estimatedDailyUnits) : null,
        notes: addForm.notes || null,
      });
      setSuccess('Привязка добавлена.');
      setShowAddForm(false);
      setAddForm({ reagentInventoryId: '', usageRole: 'MAIN', estimatedDailyMl: '', estimatedDailyUnits: '', notes: '' });
      await loadLinks(selectedAnalyzerId);
    } catch (e) {
      setError('Ошибка добавления: ' + (e.message || ''));
    }
  }

  async function handleDelete(linkId) {
    if (!confirm('Удалить привязку реагента?')) return;
    setError('');
    try {
      await deleteAnalyzerReagentLink(token, selectedAnalyzerId, linkId);
      setSuccess('Привязка удалена.');
      await loadLinks(selectedAnalyzerId);
    } catch (e) {
      setError('Ошибка удаления: ' + (e.message || ''));
    }
  }

  async function handleToggle(linkId) {
    setError('');
    try {
      await toggleAnalyzerReagentLink(token, selectedAnalyzerId, linkId);
      await loadLinks(selectedAnalyzerId);
    } catch (e) {
      setError('Ошибка: ' + (e.message || ''));
    }
  }

  async function handleAutoPopulate() {
    if (!selectedAnalyzerId) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await autoPopulateAnalyzerReagentLinks(token, selectedAnalyzerId);
      setSuccess(`Автозаполнение выполнено. Создано привязок: ${result.linksCreated ?? 0}`);
      await loadLinks(selectedAnalyzerId);
    } catch (e) {
      setError('Ошибка автозаполнения: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }

  const selectedAnalyzer = analyzers.find(a => a.id === selectedAnalyzerId);
  const activeLinks = links.filter(l => l.link?.isActive !== false);
  const inactiveLinks = links.filter(l => l.link?.isActive === false);

  return (
    <div>
      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div className="success-banner" style={{ marginBottom: 12 }}>{success}</div>}

      <div className="panel" style={{ marginBottom: 16 }}>
        <h2>Привязка реагентов к анализаторам</h2>
        <p className="text-medium" style={{ marginBottom: 16 }}>
          Цепочка: <strong>Услуга → Анализатор → Реагент</strong>.
          Укажите какие реагенты используются на каждом анализаторе, их роль и ожидаемый суточный расход.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedAnalyzerId}
            onChange={e => { setSelectedAnalyzerId(e.target.value); setShowAddForm(false); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', minWidth: 240 }}
          >
            <option value="">— Выберите анализатор —</option>
            {analyzers.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </select>
          {selectedAnalyzerId && isAdmin && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAutoPopulate}
                disabled={loading}
              >
                Автозаполнение из инвентаря
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                + Добавить реагент
              </button>
            </>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2>Добавить привязку реагента</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Реагент из инвентаря *</label>
              <select
                value={addForm.reagentInventoryId}
                onChange={e => setAddForm(p => ({ ...p, reagentInventoryId: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}
              >
                <option value="">— Выберите реагент —</option>
                {reagentInventory.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.reagentName} {r.lotNumber ? `(лот: ${r.lotNumber})` : ''} — {STATUS_LABELS[r.status] || r.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Роль реагента</label>
              <select
                value={addForm.usageRole}
                onChange={e => setAddForm(p => ({ ...p, usageRole: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}
              >
                {USAGE_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Суточный расход, мл</label>
              <input
                type="number"
                step="0.01"
                value={addForm.estimatedDailyMl}
                onChange={e => setAddForm(p => ({ ...p, estimatedDailyMl: e.target.value }))}
                placeholder="напр. 120.5"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Суточный расход, ед.</label>
              <input
                type="number"
                value={addForm.estimatedDailyUnits}
                onChange={e => setAddForm(p => ({ ...p, estimatedDailyUnits: e.target.value }))}
                placeholder="напр. 50"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Примечание</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="необязательно"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {selectedAnalyzerId && (
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>
              {selectedAnalyzer?.name || selectedAnalyzerId}
              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8, fontSize: 14 }}>
                — реагенты ({activeLinks.length} активных)
              </span>
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => loadLinks(selectedAnalyzerId)}
              disabled={loading}
            >
              Обновить
            </button>
          </div>

          {loading ? (
            <div className="text-medium" style={{ padding: 24, textAlign: 'center' }}>Загрузка…</div>
          ) : links.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>Нет привязанных реагентов</div>
              <div className="text-small">
                Нажмите «Автозаполнение из инвентаря» чтобы автоматически добавить реагенты,
                уже назначенные этому анализатору в складском учёте.
              </div>
            </div>
          ) : (
            <>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Реагент</th>
                    <th>Роль</th>
                    <th>Лот / Статус</th>
                    <th>Остаток</th>
                    <th>Суточный расход</th>
                    <th>Статус</th>
                    {isAdmin && <th style={{ width: 100 }}>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {activeLinks.map(item => (
                    <tr key={item.link.id}>
                      <td><strong>{item.reagentName}</strong></td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: (ROLE_COLORS[item.link.usageRole] || '#6b7280') + '20',
                          color: ROLE_COLORS[item.link.usageRole] || '#6b7280',
                        }}>
                          {USAGE_ROLES.find(r => r.value === item.link.usageRole)?.label || item.link.usageRole}
                        </span>
                      </td>
                      <td>
                        <div>{item.reagentLotNumber || '—'}</div>
                        <div className="text-small" style={{ color: item.reagentStatus === 'CRITICAL' || item.reagentStatus === 'OUT_OF_STOCK' ? '#dc2626' : 'var(--text-tertiary)' }}>
                          {STATUS_LABELS[item.reagentStatus] || item.reagentStatus || '—'}
                        </div>
                      </td>
                      <td>
                        {item.totalVolumeMl != null ? `${item.totalVolumeMl.toFixed(1)} мл` :
                          item.totalUnits != null ? `${item.totalUnits} ${item.unitType}` : '—'}
                      </td>
                      <td>
                        {item.link.estimatedDailyMl != null ? `${item.link.estimatedDailyMl} мл/сут` :
                          item.link.estimatedDailyUnits != null ? `${item.link.estimatedDailyUnits} ед/сут` : '—'}
                      </td>
                      <td>
                        <span style={{ color: '#059669', fontWeight: 500 }}>Активен</span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ fontSize: 11, padding: '2px 6px' }}
                              onClick={() => handleToggle(item.link.id)}
                            >
                              Откл.
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ fontSize: 11, padding: '2px 6px' }}
                              onClick={() => handleDelete(item.link.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {inactiveLinks.length > 0 && inactiveLinks.map(item => (
                    <tr key={item.link.id} style={{ opacity: 0.5 }}>
                      <td><s>{item.reagentName}</s></td>
                      <td>{USAGE_ROLES.find(r => r.value === item.link.usageRole)?.label || item.link.usageRole}</td>
                      <td>{item.reagentLotNumber || '—'}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Неактивен</span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ fontSize: 11, padding: '2px 6px' }}
                              onClick={() => handleToggle(item.link.id)}
                            >
                              Вкл.
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ fontSize: 11, padding: '2px 6px' }}
                              onClick={() => handleDelete(item.link.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {!selectedAnalyzerId && (
        <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Выберите анализатор</div>
          <div className="text-small">
            Выберите анализатор из списка выше чтобы просмотреть или настроить привязанные реагенты.
            Цепочка: Услуга → Анализатор → Реагент позволяет автоматически рассчитывать расход.
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyzerReagentLinksPanel;

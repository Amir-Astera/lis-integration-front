import { useState } from 'react';

function ReagentReportsPanel({
  analyzers, reports, loading, isAdmin,
  onGenerate, onRefresh,
}) {
  const [form, setForm] = useState({
    analyzerId: '',
    periodStart: '',
    periodEnd: '',
  });
  const [expandedId, setExpandedId] = useState(null);

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('ru-KZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatKzt(val) {
    if (val == null) return '—';
    return val.toLocaleString('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onGenerate({
      analyzerId: form.analyzerId,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
    });
  }

  function parseJson(val) {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return null; }
  }

  function renderConsumptionSection(label, data) {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Реагент</th>
              <th>Тест-режим</th>
              <th>Тестов</th>
              <th>Объём (мл)</th>
              <th>Стоимость (тг)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>{item.reagentName}</td>
                <td className="text-secondary">{item.testMode || '—'}</td>
                <td>{item.testCount ?? '—'}</td>
                <td>{item.totalVolumeMl != null ? item.totalVolumeMl.toFixed(3) : '—'}</td>
                <td>{item.totalCostKzt != null ? formatKzt(item.totalCostKzt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.totalCostKzt != null && (
          <div style={{ textAlign: 'right', fontWeight: 600, marginTop: 6 }}>
            Итого: {formatKzt(data.totalCostKzt)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isAdmin && (
        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>Сгенерировать отчёт расхода</h2>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field-group">
                <label>Анализатор *</label>
                <select
                  required
                  value={form.analyzerId}
                  onChange={(e) => setForm((p) => ({ ...p, analyzerId: e.target.value }))}
                >
                  <option value="">— выберите анализатор —</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Период с *</label>
                <input
                  type="date"
                  required
                  value={form.periodStart}
                  onChange={(e) => setForm((p) => ({ ...p, periodStart: e.target.value }))}
                />
              </div>
              <div className="field-group">
                <label>Период по *</label>
                <input
                  type="date"
                  required
                  value={form.periodEnd}
                  onChange={(e) => setForm((p) => ({ ...p, periodEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="actions-row">
              <button
                type="submit"
                className="primary-button"
                disabled={loading || !form.analyzerId || !form.periodStart || !form.periodEnd}
              >
                {loading ? 'Генерация...' : 'Сгенерировать отчёт'}
              </button>
              <span className="text-medium" style={{ lineHeight: '36px' }}>
                Повторная генерация за тот же период обновит существующий отчёт.
              </span>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading split-end space-bottom">
          <div>
            <h2>Отчёты расхода реагентов</h2>
            <div className="text-medium">{reports.length} записей</div>
          </div>
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
            Обновить
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="text-medium">Нет сгенерированных отчётов.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map((report) => {
              const analyzer = analyzers.find((a) => a.id === report.analyzerId);
              const isExpanded = expandedId === report.id;
              const legitimate = parseJson(report.legitimateConsumptionJson);
              const unauthorized = parseJson(report.unauthorizedConsumptionJson);
              const service = parseJson(report.serviceConsumptionJson);

              return (
                <div
                  key={report.id}
                  style={{
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: isExpanded ? '#eff6ff' : '#fafafa',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        {analyzer?.name || report.analyzerId}
                      </span>
                      <span className="text-secondary" style={{ marginLeft: 12 }}>
                        {report.periodStart} — {report.periodEnd}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {report.totalCostKzt != null && (
                        <span style={{ fontWeight: 600, color: 'var(--blue-primary, #2563eb)' }}>
                          {formatKzt(report.totalCostKzt)}
                        </span>
                      )}
                      <span className="text-secondary" style={{ fontSize: 12 }}>
                        {formatDate(report.generatedAt)}
                      </span>
                      <span style={{ fontSize: 18, color: '#6b7280' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        <div className="panel" style={{ margin: 0 }}>
                          <div className="text-medium">Легитимных тестов</div>
                          <div style={{ fontSize: 22, fontWeight: 700 }}>
                            {legitimate?.totalTestCount ?? '—'}
                          </div>
                        </div>
                        <div className="panel" style={{ margin: 0 }}>
                          <div className="text-medium">Несанкционированных</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>
                            {unauthorized?.totalTestCount ?? '—'}
                          </div>
                        </div>
                        <div className="panel" style={{ margin: 0 }}>
                          <div className="text-medium">Сервисных</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#f97316' }}>
                            {service?.totalTestCount ?? '—'}
                          </div>
                        </div>
                        <div className="panel" style={{ margin: 0 }}>
                          <div className="text-medium">Общая стоимость</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-primary, #2563eb)' }}>
                            {report.totalCostKzt != null ? formatKzt(report.totalCostKzt) : '—'}
                          </div>
                        </div>
                      </div>

                      {renderConsumptionSection('Легитимное потребление (по ЛИС)', legitimate)}
                      {renderConsumptionSection('Несанкционированное потребление', unauthorized)}
                      {renderConsumptionSection('Сервисное потребление', service)}

                      {report.generatedBy && (
                        <div className="text-medium" style={{ marginTop: 8 }}>
                          Сгенерировал: {report.generatedBy}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReagentReportsPanel;

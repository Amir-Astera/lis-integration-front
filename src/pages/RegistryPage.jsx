import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchReferralRegistrationSummary } from '../services/dashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const COMPLETED_STATUSES = ['результат отправлен', 'выполнено', 'завершено'];

function isCompleted(status) {
  return COMPLETED_STATUSES.some((s) => status?.toLowerCase().includes(s));
}

function KpiCard({ title, value, sub, color, icon }) {
  return (
    <div
      className="panel"
      style={{
        borderTop: `3px solid ${color || 'var(--blue-primary)'}`,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</h2>
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: color || 'var(--text-primary)',
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value?.toLocaleString('ru-RU')}</strong>
        </div>
      ))}
    </div>
  );
}

function StatusPieChart({ data }) {
  if (!data?.length) return <div className="helper-text">Нет данных по статусам</div>;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={50}
          >
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [val?.toLocaleString('ru-RU'), 'Кол-во']}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ flex: 1, minWidth: 160 }}>
        {data.map((entry, index) => (
          <div
            key={entry.status}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: COLORS[index % COLORS.length],
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{entry.status}</span>
            <strong>{entry.count?.toLocaleString('ru-RU')}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              ({total ? Math.round((entry.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentBarChart({ data }) {
  if (!data?.length) return <div className="helper-text">Нет данных по отделениям</div>;

  const chartData = data.slice(0, 15).map((d) => ({
    name: d.department.length > 24 ? d.department.slice(0, 22) + '…' : d.department,
    fullName: d.department,
    Выполнено: d.completed,
    'В работе': d.inProgress,
    Ожидает: d.pending,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Выполнено" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="В работе" stackId="a" fill="#3b82f6" />
        <Bar dataKey="Ожидает" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DailyLineChart({ data }) {
  if (!data?.length) return null;

  const chartData = data.map((d) => ({
    date: d.date?.slice(5),
    Зарегистрировано: d.registered,
    Выполнено: d.completed,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Зарегистрировано" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Выполнено" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopServicesTable({ data }) {
  if (!data?.length) return <div className="helper-text">Нет данных по услугам</div>;

  return (
    <div className="table-wrap">
      <table className="table-grid" style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Услуга</th>
            <th style={{ textAlign: 'right' }}>Всего</th>
            <th style={{ textAlign: 'right' }}>Выполнено</th>
            <th style={{ textAlign: 'right' }}>Ожидает</th>
            <th style={{ textAlign: 'right' }}>% выполнения</th>
          </tr>
        </thead>
        <tbody>
          {data.map((svc, i) => {
            const pct = svc.total ? Math.round((svc.completed / svc.total) * 100) : 0;
            return (
              <tr key={svc.service}>
                <td style={{ color: 'var(--text-secondary)', width: 32 }}>{i + 1}</td>
                <td>{svc.service}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{svc.total?.toLocaleString('ru-RU')}</td>
                <td style={{ textAlign: 'right', color: '#10b981' }}>{svc.completed?.toLocaleString('ru-RU')}</td>
                <td style={{ textAlign: 'right', color: '#f59e0b' }}>{svc.pending?.toLocaleString('ru-RU')}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: 48,
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FundingSourceChart({ data }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="fundingSource" cx="50%" cy="50%" outerRadius={80}>
            {data.map((entry, i) => (
              <Cell key={entry.fundingSource} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [val?.toLocaleString('ru-RU'), 'Кол-во']}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div>
        {data.map((entry, i) => (
          <div key={entry.fundingSource} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{entry.fundingSource}</span>
            <strong>{entry.count?.toLocaleString('ru-RU')}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              ({total ? Math.round((entry.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistryPage({ overview, token, initialSummary }) {
  const [summary, setSummary] = useState(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary);
    }
  }, [initialSummary]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReferralRegistrationSummary(token);
      setSummary(data);
    } catch (err) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!initialSummary) {
      loadData();
    }
  }, []);

  const s = summary?.summary;
  const completionRate = s && s.researchCount
    ? Math.round((s.sentResultsCount / s.researchCount) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Услуги</h1>
          <div className="text-medium header-subtitle">
            Журнал регистрации лабораторных услуг
            {summary?.periodLabel && (
              <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>
                · {summary.periodLabel}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="secondary-button" onClick={loadData} disabled={loading}>
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          {error}
          {error.includes('No REFERRAL') && ' — загрузите отчет «Журнал регистрации» через Админ-панель.'}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="surface-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Данные недоступны. Загрузите отчет «Журнал регистрации лабораторных направлений» в Админ-панели.
        </div>
      )}

      {summary && (
        <>
          <div className="kpi-row" style={{ marginBottom: 20 }}>
            <KpiCard
              title="Всего услуг"
              value={s?.researchCount?.toLocaleString('ru-RU')}
              sub="уникальных записей"
              color="#3b82f6"
              icon="📋"
            />
            <KpiCard
              title="Выполнено"
              value={s?.sentResultsCount?.toLocaleString('ru-RU')}
              sub={`${completionRate}% от общего числа`}
              color="#10b981"
              icon="✅"
            />
            <KpiCard
              title="Ожидает"
              value={s?.pendingCount?.toLocaleString('ru-RU')}
              sub="все статусы кроме «Результат отправлен»"
              color="#f59e0b"
              icon="⏳"
            />
            <KpiCard
              title="Пациентов"
              value={s?.patientCount?.toLocaleString('ru-RU')}
              sub="уникальных"
              color="#8b5cf6"
              icon="👤"
            />
            <KpiCard
              title="Отделений"
              value={s?.departmentCount?.toLocaleString('ru-RU')}
              sub="источников направлений"
              color="#06b6d4"
              icon="🏥"
            />
            {s?.emergencyCount > 0 && (
              <KpiCard
                title="Экстренных"
                value={s?.emergencyCount?.toLocaleString('ru-RU')}
                sub="срочных направлений"
                color="#ef4444"
                icon="🚨"
              />
            )}
          </div>

          <div className="surface-card" style={{ padding: '8px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'overview', label: 'Обзор' },
                { key: 'departments', label: 'По отделениям' },
                { key: 'services', label: 'По услугам' },
                { key: 'statuses', label: 'Статусы' },
                ...(summary.fundingSourceStats?.length ? [{ key: 'funding', label: 'Финансирование' }] : []),
                ...(summary.dailyRegistrationStats?.length ? [{ key: 'daily', label: 'По дням' }] : []),
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
            </div>
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
                <div className="panel">
                  <div className="panel-heading split-start" style={{ marginBottom: 16 }}>
                    <div>
                      <h2>Статусы направлений</h2>
                      <div className="text-medium">Распределение по статусам выполнения</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{completionRate}%</div>
                      <div className="text-medium">выполнения</div>
                    </div>
                  </div>
                  <StatusPieChart data={summary.statusStats} />
                </div>

                <div className="panel">
                  <div className="panel-heading split-start" style={{ marginBottom: 16 }}>
                    <div>
                      <h2>Топ отделений</h2>
                      <div className="text-medium">Стек: выполнено / в работе / ожидает</div>
                    </div>
                  </div>
                  <DepartmentBarChart data={summary.departmentStats} />
                </div>
              </div>

              {summary.serviceStats?.length > 0 && (
                <div className="panel">
                  <div className="panel-heading" style={{ marginBottom: 12 }}>
                    <h2>Топ-10 услуг по объёму</h2>
                  </div>
                  <TopServicesTable data={summary.serviceStats?.slice(0, 10)} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="surface-card">
              <div className="card-title-row" style={{ marginBottom: 16 }}>
                <h2>Аналитика по отделениям</h2>
                <span className="helper-text">{summary.departmentStats?.length} отделений</span>
              </div>
              <DepartmentBarChart data={summary.departmentStats} />
              <div style={{ marginTop: 24 }}>
                <div className="table-wrap">
                  <table className="table-grid" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Отделение</th>
                        <th style={{ textAlign: 'right' }}>Всего</th>
                        <th style={{ textAlign: 'right' }}>Выполнено</th>
                        <th style={{ textAlign: 'right' }}>В работе</th>
                        <th style={{ textAlign: 'right' }}>Ожидает</th>
                        <th style={{ textAlign: 'right' }}>% выполнения</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.departmentStats?.map((dept) => {
                        const pct = dept.total ? Math.round((dept.completed / dept.total) * 100) : 0;
                        return (
                          <tr key={dept.department}>
                            <td>{dept.department}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{dept.total?.toLocaleString('ru-RU')}</td>
                            <td style={{ textAlign: 'right', color: '#10b981' }}>{dept.completed?.toLocaleString('ru-RU')}</td>
                            <td style={{ textAlign: 'right', color: '#3b82f6' }}>{dept.inProgress?.toLocaleString('ru-RU')}</td>
                            <td style={{ textAlign: 'right', color: '#f59e0b' }}>{dept.pending?.toLocaleString('ru-RU')}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span
                                style={{
                                  color: pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b',
                                  fontWeight: 600,
                                }}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="surface-card">
              <div className="card-title-row" style={{ marginBottom: 16 }}>
                <h2>Аналитика по услугам</h2>
                <span className="helper-text">Топ-30 по объёму</span>
              </div>
              <TopServicesTable data={summary.serviceStats} />
            </div>
          )}

          {activeTab === 'statuses' && (
            <div className="surface-card">
              <div className="card-title-row" style={{ marginBottom: 20 }}>
                <h2>Распределение по статусам</h2>
              </div>
              <StatusPieChart data={summary.statusStats} />
              <div className="table-wrap" style={{ marginTop: 24 }}>
                <table className="table-grid" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Статус</th>
                      <th style={{ textAlign: 'right' }}>Количество</th>
                      <th style={{ textAlign: 'right' }}>Доля</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.statusStats?.map((st, i) => {
                      const total = summary.statusStats.reduce((s, d) => s + d.count, 0);
                      const pct = total ? Math.round((st.count / total) * 100) : 0;
                      return (
                        <tr key={st.status}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: COLORS[i % COLORS.length],
                                  flexShrink: 0,
                                }}
                              />
                              {st.status}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{st.count?.toLocaleString('ru-RU')}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'funding' && (
            <div className="surface-card">
              <div className="card-title-row" style={{ marginBottom: 20 }}>
                <h2>Источники финансирования</h2>
              </div>
              <FundingSourceChart data={summary.fundingSourceStats} />
            </div>
          )}

          {activeTab === 'daily' && summary.dailyRegistrationStats?.length > 0 && (
            <div className="surface-card">
              <div className="card-title-row" style={{ marginBottom: 16 }}>
                <h2>Регистрация по дням</h2>
                <span className="helper-text">{summary.dailyRegistrationStats.length} дней</span>
              </div>
              <DailyLineChart data={summary.dailyRegistrationStats} />
            </div>
          )}
        </>
      )}
    </>
  );
}

export default RegistryPage;

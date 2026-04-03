import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { fetchLogAnalytics } from '../../services/reagents';

const PERIOD_OPTIONS = [
  { value: 'DAY', label: 'День' },
  { value: 'WEEK', label: 'Неделя' },
  { value: 'MONTH', label: 'Месяц' },
];

const TABS = [
  { id: 'overview', label: 'Сводка' },
  { id: 'services', label: 'Услуги анализатора' },
  { id: 'violations', label: 'Расхождения' },
  { id: 'reagents', label: 'Реагенты' },
  { id: 'records', label: 'Журнал' },
];

// Типы расхождений — перевод на профессиональный язык
const VIOLATION_COLORS = {
  NO_LIS_ORDER: '#d94056',
  SUSPICIOUS: '#e0891a',
  ERROR: '#6b7280',
  XML_RESULT: '#7c3aed',
};

const VIOLATION_LABELS = {
  NO_LIS_ORDER: 'Без направления ЛИС',
  SUSPICIOUS: 'Подозрительный результат',
  ERROR: 'Ошибка анализатора',
  XML_RESULT: 'Результат без ЛИС-регистрации',
};

const VIOLATION_DESC = {
  NO_LIS_ORDER: 'Проба выполнена без зарегистрированного направления в ЛИС',
  SUSPICIOUS: 'Анализатор зафиксировал отсутствие направления при выполнении пробы',
  ERROR: 'При выполнении пробы возникла ошибка анализатора',
  XML_RESULT: 'Результат зафиксирован в errors.xml — есть данные, но нет подтверждения ЛИС',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// Категории услуг из Damumed — для пояснения таблицы
const DAMUMED_CATEGORY_INFO = {
  'Гематология': { color: '#3b82f6', desc: 'Общий анализ крови (ОАК), лейкоциты, гемоглобин, тромбоциты' },
  'Биохимия': { color: '#10b981', desc: 'Глюкоза, белок, ферменты, холестерин, электролиты' },
  'Иммунология': { color: '#8b5cf6', desc: 'Гормоны, антитела, иммуноферментный анализ' },
  'Коагуляция': { color: '#f59e0b', desc: 'Свёртываемость крови, протромбин, МНО' },
  'Мочи': { color: '#06b6d4', desc: 'Общий анализ мочи' },
};

function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: decimals });
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '16px 20px',
      flex: '1 1 160px',
      minWidth: 150,
    }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--text-main)', lineHeight: 1.1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
    </h2>
  );
}

function Panel({ children, style }) {
  return (
    <div className="panel" style={style}>
      {children}
    </div>
  );
}

function ViolationBadge({ type }) {
  const label = VIOLATION_LABELS[type] || type;
  const color = VIOLATION_COLORS[type] || '#6b7280';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      background: color + '18', color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ color: 'var(--text-secondary)', padding: '28px 0', textAlign: 'center', fontSize: 14 }}>
      {text || 'Нет данных за выбранный период'}
    </div>
  );
}

function InfoBox({ children, color = '#3b82f6' }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, marginBottom: 14,
      background: color + '10', border: `1px solid ${color}30`,
      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

export default function LogAnalyticsPanel({ token, analyzers }) {
  const [period, setPeriod] = useState('WEEK');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [recordsFilter, setRecordsFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        period,
        analyzerId: selectedAnalyzerId || null,
      };
      if (useCustomRange && dateFrom) params.dateFrom = dateFrom;
      if (useCustomRange && dateTo) params.dateTo = dateTo;
      const data = await fetchLogAnalytics(token, params);
      setAnalytics(data);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, [token, period, selectedAnalyzerId, useCustomRange, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const byDayData = (analytics?.byDay || []).map((d) => ({
    date: fmtDate(d.summaryDate),
    'Регулярные пробы': d.legitimateCount,
    'Расхождения': d.anomalyCount,
    'Сервисные/промывки': d.washTestCount ?? 0,
  }));

  const byAnalyzerAnomalyData = (analytics?.byAnalyzer || []).map((a) => ({
    name: a.analyzerName || a.analyzerId || '—',
    'Расхождения': a.anomalyCount,
    'Регулярные': a.legitimateCount,
    Всего: a.totalSamples || 0,
  }));

  const topServicesData = (analytics?.legitimateServices || []).slice(0, 12).map((s) => ({
    name: s.serviceName?.length > 35 ? s.serviceName.slice(0, 35) + '…' : s.serviceName,
    Кол: s.count,
  }));

  const violationPieData = (analytics?.byAnalyzer || [])
    .filter((a) => a.anomalyCount > 0)
    .map((a, i) => ({
      name: a.analyzerName || a.analyzerId || '—',
      value: a.anomalyCount,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const reagentData = (analytics?.topReagents || []).slice(0, 10).map((r) => ({
    name: r.reagentName?.length > 30 ? r.reagentName.slice(0, 30) + '…' : r.reagentName,
    Кол: parseFloat(r.totalQuantity?.toFixed(3) || 0),
    unit: r.unitType,
  }));

  const legitReagentData = (analytics?.topReagentsLegitimate || []).slice(0, 10).map((r) => ({
    name: r.reagentName?.length > 30 ? r.reagentName.slice(0, 30) + '…' : r.reagentName,
    Кол: parseFloat(r.totalQuantity?.toFixed(3) || 0),
    unit: r.unitType,
  }));

  const filteredRecords = (analytics?.records || []).filter((r) =>
    recordsFilter === 'all' ? true : r.anomalyType === recordsFilter
  );

  // Группировка Damumed статистики по категориям
  const damumedByCategory = {};
  (analytics?.damumedServiceStats || []).forEach((svc) => {
    const cat = svc.category || 'Прочее';
    if (!damumedByCategory[cat]) damumedByCategory[cat] = { count: 0, total: 0, services: [] };
    damumedByCategory[cat].count += 1;
    damumedByCategory[cat].total += svc.completedCount;
    damumedByCategory[cat].services.push(svc);
  });

  const hasData = analytics != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Controls */}
      <Panel style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setPeriod(opt.value); setUseCustomRange(false); }}
              style={{
                padding: '6px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                border: (!useCustomRange && period === opt.value) ? '2px solid var(--blue-primary)' : '2px solid var(--border-subtle)',
                background: (!useCustomRange && period === opt.value) ? 'var(--blue-primary)' : 'transparent',
                color: (!useCustomRange && period === opt.value) ? '#fff' : 'var(--text-main)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseCustomRange(true)}
            style={{
              padding: '6px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              border: useCustomRange ? '2px solid var(--blue-primary)' : '2px solid var(--border-subtle)',
              background: useCustomRange ? 'var(--blue-primary)' : 'transparent',
              color: useCustomRange ? '#fff' : 'var(--text-main)',
              transition: 'all 0.15s',
            }}
          >
            Период
          </button>
        </div>

        {useCustomRange && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>с</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 13, background: 'var(--bg-panel)', color: 'var(--text-main)' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>по</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 13, background: 'var(--bg-panel)', color: 'var(--text-main)' }}
            />
          </div>
        )}

        <select
          value={selectedAnalyzerId}
          onChange={(e) => setSelectedAnalyzerId(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 13, background: 'var(--bg-panel)', color: 'var(--text-main)' }}
        >
          <option value="">Все анализаторы</option>
          {(analyzers || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <button
          type="button"
          onClick={load}
          style={{
            padding: '6px 16px', borderRadius: 8, border: 'none',
            background: 'var(--blue-primary)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          Обновить
        </button>

        {loading && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Загрузка…</span>}
        {error && <span style={{ color: 'var(--status-critical)', fontSize: 12 }}>{error}</span>}
      </Panel>

      {hasData && (
        <>
          {/* KPI Summary */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard
              icon="🧪"
              label="Всего проб (анализатор)"
              value={fmt(analytics.totalSamples)}
              sub="зарегистрировано анализатором"
              color="var(--text-main)"
            />
            <KpiCard
              icon="✅"
              label="Регулярные пробы"
              value={fmt(analytics.totalLegitimate)}
              sub="с направлением ЛИС"
              color="#10b981"
            />
            <KpiCard
              icon={analytics.totalAnomalies > 0 ? "⚠️" : "✅"}
              label="Расхождения"
              value={fmt(analytics.totalAnomalies)}
              sub={analytics.totalAnomalies > 0 ? "требуют разбора" : "нет расхождений"}
              color={analytics.totalAnomalies > 0 ? '#ef4444' : '#10b981'}
            />
            <KpiCard
              icon="👥"
              label="Пациентов (уник.)"
              value={fmt(analytics.uniquePatients)}
              sub="по штрих-кодам"
              color="#3b82f6"
            />
            <KpiCard
              icon="📊"
              label="Услуг на пациента"
              value={fmt(analytics.avgServicesPerPatient, 1)}
              sub="среднее"
              color="#8b5cf6"
            />
            <KpiCard
              icon="🔬"
              label="Видов услуг"
              value={fmt(analytics.legitimateServices?.length ?? 0)}
              sub="по регулярным пробам"
              color="#06b6d4"
            />
            <KpiCard
              icon="🧹"
              label="Сервисные пробы"
              value={fmt(analytics.totalWashTests)}
              sub="промывки / контроль"
              color="#94a3b8"
            />
            {(analytics.damumedTotalCompleted || 0) > 0 && (
              <KpiCard
                icon="📑"
                label="Выполнено по ЛИС"
                value={fmt(analytics.damumedTotalCompleted)}
                sub="по отчёту Damumed"
                color="#f59e0b"
              />
            )}
          </div>

          {/* Navigation tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border-subtle)', paddingBottom: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 18px', border: 'none', borderRadius: '8px 8px 0 0',
                  background: activeTab === t.id ? 'var(--bg-panel)' : 'transparent',
                  color: activeTab === t.id ? 'var(--blue-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === t.id ? 700 : 500,
                  fontSize: 13, cursor: 'pointer',
                  borderBottom: activeTab === t.id ? '2px solid var(--blue-primary)' : '2px solid transparent',
                  marginBottom: -2,
                  position: 'relative',
                }}
              >
                {t.id === 'violations' && analytics.totalAnomalies > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 4,
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {analytics.totalAnomalies}
                  </span>
                )}
                {t.label}
              </button>
            ))}
          </div>

          {/* =================== OVERVIEW =================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {analytics.totalAnomalies > 0 && (
                <div style={{
                  padding: '14px 18px', borderRadius: 10,
                  background: '#ef444410', border: '2px solid #ef444440',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 15 }}>
                      Обнаружено расхождений: {analytics.totalAnomalies}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Пробы выполнены анализатором без регистрации в ЛИС или с нарушениями. Перейдите в раздел «Расхождения» для детального разбора.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('violations')}
                    style={{
                      marginLeft: 'auto', padding: '7px 16px', borderRadius: 8,
                      background: '#ef4444', color: '#fff', border: 'none',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Открыть →
                  </button>
                </div>
              )}

              <Panel>
                <SectionTitle>📈 Динамика по дням</SectionTitle>
                {byDayData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={byDayData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorViol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="Регулярные пробы" stroke="#10b981" strokeWidth={2} fill="url(#colorRegular)" />
                      <Area type="monotone" dataKey="Расхождения" stroke="#ef4444" strokeWidth={2} fill="url(#colorViol)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {violationPieData.length > 0 && (
                  <Panel style={{ flex: '1 1 340px' }}>
                    <SectionTitle>🔬 Расхождения по анализаторам</SectionTitle>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={violationPieData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {violationPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Расхождений']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Panel>
                )}

                <Panel style={{ flex: '1 1 340px' }}>
                  <SectionTitle>📋 Сводка по анализаторам</SectionTitle>
                  {byAnalyzerAnomalyData.length === 0 ? <EmptyState /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byAnalyzerAnomalyData} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Регулярные" fill="#10b981" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Расхождения" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Panel>
              </div>

              {(analytics.byAnalyzer || []).length > 0 && (
                <Panel>
                  <SectionTitle>📊 Детальная сводка по анализаторам</SectionTitle>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                          {['Анализатор', 'Всего проб', 'Регулярные', 'Расхождения', 'Сервисные', '% расхождений'].map((h) => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.byAnalyzer.map((a, i) => {
                          const pct = a.totalSamples > 0 ? (a.anomalyCount / a.totalSamples * 100) : 0;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.analyzerName || a.analyzerId}</td>
                              <td style={{ padding: '8px 12px' }}>{fmt(a.totalSamples)}</td>
                              <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: 600 }}>{fmt(a.legitimateCount)}</td>
                              <td style={{ padding: '8px 12px', color: a.anomalyCount > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{fmt(a.anomalyCount)}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{fmt(a.washTestCount)}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 20 ? '#ef4444' : pct > 10 ? '#f59e0b' : '#10b981', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: pct > 20 ? '#ef4444' : 'var(--text-main)' }}>{pct.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* =================== SERVICES =================== */}
          {activeTab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <Panel>
                <SectionTitle>🏆 Топ услуг по количеству (регулярные пробы)</SectionTitle>
                {topServicesData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topServicesData} layout="vertical" margin={{ top: 4, right: 16, left: 200, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={210} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Кол" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel>
                <SectionTitle>📋 Все выполненные услуги (по данным анализатора)</SectionTitle>
                <InfoBox>
                  Данные из журнала анализатора — только пробы с зарегистрированным направлением ЛИС.
                  Столбец «Реагенты» показывает расчётный расход по нормам.
                </InfoBox>
                {(analytics.legitimateServices || []).length === 0 ? <EmptyState /> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                          {['Услуга', 'Анализатор', 'Кол-во', 'Уник. пациентов', 'Расч. расход реагентов'].map((h) => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.legitimateServices.map((svc, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '8px 12px', maxWidth: 300 }}>{svc.serviceName}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{svc.analyzerName || '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#3b82f6' }}>{fmt(svc.count)}</td>
                            <td style={{ padding: '8px 12px', color: '#8b5cf6', fontWeight: 600 }}>{fmt(svc.uniquePatients)}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {(svc.reagents || []).length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {svc.reagents.slice(0, 3).map((r, j) => (
                                    <span key={j} style={{
                                      padding: '2px 7px', borderRadius: 4, fontSize: 11,
                                      background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f630',
                                    }}>
                                      {r.reagentName?.split(' ')[0]} {r.totalQuantity?.toFixed(2)} {r.unitType}
                                    </span>
                                  ))}
                                  {svc.reagents.length > 3 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+{svc.reagents.length - 3}</span>}
                                </div>
                              ) : <span style={{ color: 'var(--text-tertiary)' }}>нет норм</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              {/* Damumed LIS данные */}
              {(analytics.damumedServiceStats || []).length > 0 && (
                <Panel>
                  <SectionTitle>📑 Фактически выполненные услуги по данным ЛИС (Damumed)</SectionTitle>
                  <InfoBox color="#f59e0b">
                    <strong>Что это такое?</strong> Это сравнительная таблица: столбец «Выполнено (факт ЛИС)» — данные из последнего
                    загруженного отчёта Damumed «Рабочее место: выполненные исследования»,
                    а столбец «По логам (анализатор)» — количество проб за выбранный период
                    ({analytics.periodFrom ? new Date(analytics.periodFrom).toLocaleDateString('ru-RU') : '—'} — {analytics.periodTo ? new Date(analytics.periodTo).toLocaleDateString('ru-RU') : '—'}) из журнала анализатора.
                    <br /><br />
                    <strong>Почему важно?</strong> Сравнивая эти данные, можно выявить расхождения:
                    если анализатор показывает меньше проб, чем ЛИС — значит часть услуг могла быть выставлена без реального выполнения.
                  </InfoBox>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ padding: '8px 16px', borderRadius: 8, background: '#f59e0b18', border: '1px solid #f59e0b40', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Всего выполнено (ЛИС): </span>
                      <strong style={{ color: '#f59e0b' }}>{fmt(analytics.damumedTotalCompleted)}</strong>
                    </div>
                    <div style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f618', border: '1px solid #3b82f630', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Видов услуг: </span>
                      <strong style={{ color: '#3b82f6' }}>{analytics.damumedServiceStats.length}</strong>
                    </div>
                    {(analytics.totalAnalyzerServiceCount || 0) > 0 && (
                      <div style={{ padding: '8px 16px', borderRadius: 8, background: '#8b5cf618', border: '1px solid #8b5cf630', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>По логам ({analytics.periodFrom ? new Date(analytics.periodFrom).toLocaleDateString('ru-RU') : '?'} — {analytics.periodTo ? new Date(analytics.periodTo).toLocaleDateString('ru-RU') : '?'}): </span>
                        <strong style={{ color: '#8b5cf6' }}>{fmt(analytics.totalAnalyzerServiceCount)}</strong>
                        {(analytics.damumedTotalCompleted || 0) > 0 && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                            ({((analytics.totalAnalyzerServiceCount / analytics.damumedTotalCompleted) * 100).toFixed(1)}% от ЛИС)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Сводка по категориям */}
                  {Object.keys(damumedByCategory).length > 0 && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      {Object.entries(damumedByCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, info]) => {
                        const catInfo = DAMUMED_CATEGORY_INFO[cat];
                        return (
                          <div key={cat} style={{
                            padding: '10px 14px', borderRadius: 8, flex: '1 1 180px',
                            background: (catInfo?.color || '#6b7280') + '10',
                            border: `1px solid ${(catInfo?.color || '#6b7280')}30`,
                          }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: catInfo?.color || '#6b7280' }}>{cat}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{fmt(info.total)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {info.count} видов услуг
                            </div>
                            {catInfo?.desc && (
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>{catInfo.desc}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>#</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Код/Название услуги</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Категория</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Выполнено (факт ЛИС)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>
                            По логам
                            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-tertiary)', marginTop: 2 }}>
                              {analytics.periodFrom ? new Date(analytics.periodFrom).toLocaleDateString('ru-RU') : '?'} — {analytics.periodTo ? new Date(analytics.periodTo).toLocaleDateString('ru-RU') : '?'}
                            </div>
                          </th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>Разница</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.damumedServiceStats.slice(0, 50).map((svc, i) => {
                          const catInfo = svc.category ? DAMUMED_CATEGORY_INFO[svc.category] : null;
                          const diff = (svc.analyzerCount || 0) - svc.completedCount;
                          const diffColor = diff === 0 ? '#10b981' : diff > 0 ? '#3b82f6' : '#ef4444';
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>{i + 1}</td>
                              <td style={{ padding: '8px 12px', maxWidth: 360, fontWeight: 500 }}>{svc.serviceName}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {svc.category ? (
                                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: (catInfo?.color || '#6b7280') + '18', color: catInfo?.color || '#6b7280', border: `1px solid ${(catInfo?.color || '#6b7280')}30` }}>
                                    {svc.category}
                                  </span>
                                ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>числовой код</span>}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#f59e0b' }}>{fmt(svc.completedCount)}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#8b5cf6' }}>
                                {svc.analyzerCount > 0 ? fmt(svc.analyzerCount) : <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>—</span>}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: diffColor }}>
                                {svc.analyzerCount > 0 ? (diff > 0 ? `+${fmt(diff)}` : fmt(diff)) : <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--border-subtle)', fontWeight: 700 }}>
                          <td colSpan={3} style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Итого</td>
                          <td style={{ padding: '8px 12px', color: '#f59e0b' }}>{fmt(analytics.damumedTotalCompleted)}</td>
                          <td style={{ padding: '8px 12px', color: '#8b5cf6' }}>{fmt(analytics.totalAnalyzerServiceCount)}</td>
                          <td style={{ padding: '8px 12px', color: (analytics.totalAnalyzerServiceCount || 0) - (analytics.damumedTotalCompleted || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
                            {(() => {
                              const totalDiff = (analytics.totalAnalyzerServiceCount || 0) - (analytics.damumedTotalCompleted || 0);
                              return totalDiff > 0 ? `+${fmt(totalDiff)}` : fmt(totalDiff);
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    {analytics.damumedServiceStats.length > 50 && (
                      <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                        Показано 50 из {analytics.damumedServiceStats.length}
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* =================== VIOLATIONS =================== */}
          {activeTab === 'violations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <InfoBox color="#ef4444">
                <strong>Расхождения</strong> — это пробы, зафиксированные анализатором, но не подтверждённые или отсутствующие
                в ЛИС. Каждый такой случай означает, что реагент был израсходован, но либо направление не оформлено,
                либо результат не прошёл через ЛИС. Требует объяснения от лаборатории.
              </InfoBox>

              {/* Типы расхождений */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(VIOLATION_LABELS).map(([type, label]) => {
                  const count = (analytics.records || []).filter(r => r.anomalyType === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} style={{
                      padding: '12px 16px', borderRadius: 10, flex: '1 1 200px',
                      background: VIOLATION_COLORS[type] + '10',
                      border: `2px solid ${VIOLATION_COLORS[type]}40`,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: VIOLATION_COLORS[type] }}>{label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 4px' }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{VIOLATION_DESC[type]}</div>
                    </div>
                  );
                })}
              </div>

              <Panel>
                <SectionTitle>📅 Расхождения по дням</SectionTitle>
                {byDayData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byDayData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Расхождения" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Сервисные/промывки" fill="#94a3b8" opacity={0.5} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              {(analytics.anomalyServices || []).length > 0 && (
                <Panel>
                  <SectionTitle>🔍 Услуги с расхождениями</SectionTitle>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                          {['Услуга', 'Анализатор', 'Кол-во расхожд.', 'Расч. потеря реагентов'].map((h) => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.anomalyServices.map((svc, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '8px 12px', maxWidth: 300 }}>{svc.serviceName}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{svc.analyzerName || '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ef4444' }}>{fmt(svc.anomalyCount)}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {(svc.reagents || []).length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {svc.reagents.map((r, j) => (
                                    <span key={j} style={{
                                      padding: '2px 7px', borderRadius: 4, fontSize: 11,
                                      background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430',
                                    }}>
                                      {r.reagentName} {r.totalQuantity?.toFixed(3)} {r.unitType}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ color: 'var(--text-tertiary)' }}>нет норм</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {/* Детальный журнал расхождений */}
              <Panel>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <SectionTitle>📝 Детальный журнал расхождений ({analytics.records?.length ?? 0} записей)</SectionTitle>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'SUSPICIOUS', label: 'Подозрит.' },
                      { id: 'NO_LIS_ORDER', label: 'Без ЛИС' },
                      { id: 'ERROR', label: 'Ошибки' },
                      { id: 'XML_RESULT', label: 'XML' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setRecordsFilter(f.id)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: recordsFilter === f.id ? '2px solid var(--blue-primary)' : '1px solid var(--border-subtle)',
                          background: recordsFilter === f.id ? 'var(--blue-primary)' : 'transparent',
                          color: recordsFilter === f.id ? '#fff' : 'var(--text-main)',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRecords.length === 0 ? (
                  <EmptyState text="Расхождений не найдено за выбранный период" />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                          {['Дата и время', 'Тип расхождения', 'Штрих-код пробы', 'Услуга', 'Анализатор / устройство', 'Параметры (WBC/RBC/HGB/PLT)', 'Причина'].map((h) => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.slice(0, 200).map((rec) => {
                          const isExpanded = expandedRecord === rec.id;
                          const hasParams = rec.wbcValue || rec.rbcValue || rec.hgbValue || rec.pltValue;
                          return (
                            <tr
                              key={rec.id}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isExpanded ? VIOLATION_COLORS[rec.anomalyType] + '08' : undefined,
                                cursor: 'pointer',
                              }}
                              onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}
                            >
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                {fmtDateTime(rec.anomalyTimestamp)}
                              </td>
                              <td style={{ padding: '7px 10px' }}><ViolationBadge type={rec.anomalyType} /></td>
                              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>
                                {rec.barcode
                                  ? <span style={{ color: 'var(--text-main)' }}>{rec.barcode}</span>
                                  : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>отсутствует</span>}
                              </td>
                              <td style={{ padding: '7px 10px', maxWidth: 200 }}>
                                {rec.serviceName
                                  ? <span style={{ fontWeight: 500 }}>{rec.serviceName}</span>
                                  : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>не определена</span>}
                              </td>
                              <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
                                <div>{rec.deviceSystemName || '—'}</div>
                                {rec.analyzerId && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{rec.analyzerId}</div>}
                              </td>
                              <td style={{ padding: '7px 10px' }}>
                                {hasParams ? (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {rec.wbcValue != null && <span style={{ padding: '1px 6px', borderRadius: 3, background: '#3b82f618', color: '#3b82f6', fontSize: 10, fontFamily: 'monospace' }}>WBC {rec.wbcValue.toFixed(2)}</span>}
                                    {rec.rbcValue != null && <span style={{ padding: '1px 6px', borderRadius: 3, background: '#10b98118', color: '#10b981', fontSize: 10, fontFamily: 'monospace' }}>RBC {rec.rbcValue.toFixed(2)}</span>}
                                    {rec.hgbValue != null && <span style={{ padding: '1px 6px', borderRadius: 3, background: '#f59e0b18', color: '#f59e0b', fontSize: 10, fontFamily: 'monospace' }}>HGB {rec.hgbValue.toFixed(0)}</span>}
                                    {rec.pltValue != null && <span style={{ padding: '1px 6px', borderRadius: 3, background: '#8b5cf618', color: '#8b5cf6', fontSize: 10, fontFamily: 'monospace' }}>PLT {rec.pltValue.toFixed(0)}</span>}
                                  </div>
                                ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>—</span>}
                              </td>
                              <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                                {rec.classificationReason || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredRecords.length > 200 && (
                      <div style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: 12 }}>
                        Показаны первые 200 из {filteredRecords.length} записей
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* =================== REAGENTS =================== */}
          {activeTab === 'reagents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <InfoBox>
                Расход реагентов рассчитывается на основе норм расхода, привязанных к анализатору и виду услуги.
                Если норма не настроена — расход не может быть рассчитан. Обратитесь к администратору системы
                для настройки норм в разделе «Реагенты → Нормы».
              </InfoBox>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Panel>
                  <SectionTitle>✅ Расход реагентов — регулярные пробы</SectionTitle>
                  {legitReagentData.length === 0 ? (
                    <EmptyState text="Нет данных. Возможно, нормы расхода не настроены для данного анализатора." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={legitReagentData} layout="vertical" margin={{ top: 4, right: 16, left: 140, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n, p) => [`${v} ${p.payload.unit}`, 'Расход']} />
                        <Bar dataKey="Кол" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Panel>

                <Panel>
                  <SectionTitle>⚠️ Расход реагентов — пробы с расхождениями</SectionTitle>
                  {reagentData.length === 0 ? (
                    <EmptyState text="Нет данных. Возможно, нормы расхода не настроены или расхождений не обнаружено." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={reagentData} layout="vertical" margin={{ top: 4, right: 16, left: 140, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n, p) => [`${v} ${p.payload.unit}`, 'Потеря']} />
                        <Bar dataKey="Кол" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Panel>
              </div>

              {(analytics.topReagentsLegitimate || []).length > 0 && (
                <Panel>
                  <SectionTitle>📦 Детальный расход — регулярные пробы</SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {analytics.topReagentsLegitimate.map((r, i) => (
                      <div key={i} style={{
                        border: '1px solid var(--border-subtle)', borderRadius: 10,
                        padding: '12px 16px', minWidth: 180, flex: '1 1 180px', background: 'var(--bg-panel)',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>{r.reagentName}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{r.totalQuantity?.toFixed(3)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.unitType}</div>
                        {r.analyzerName && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{r.analyzerName}</div>}
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {(analytics.topReagents || []).length > 0 && (
                <Panel>
                  <SectionTitle>🔴 Потери реагентов — расхождения (расчётный убыток)</SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {analytics.topReagents.map((r, i) => (
                      <div key={i} style={{
                        border: '1px solid #ef444430', borderRadius: 10,
                        padding: '12px 16px', minWidth: 180, flex: '1 1 180px', background: '#ef444408',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>{r.reagentName}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{r.totalQuantity?.toFixed(3)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.unitType}</div>
                        {r.analyzerName && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{r.analyzerName}</div>}
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* =================== RECORDS =================== */}
          {activeTab === 'records' && (
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <SectionTitle>📝 Полный журнал расхождений ({analytics.records?.length ?? 0} записей)</SectionTitle>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'SUSPICIOUS', label: 'Подозрит.' },
                    { id: 'NO_LIS_ORDER', label: 'Без ЛИС' },
                    { id: 'ERROR', label: 'Ошибки' },
                    { id: 'XML_RESULT', label: 'XML' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRecordsFilter(f.id)}
                      style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: recordsFilter === f.id ? '2px solid var(--blue-primary)' : '1px solid var(--border-subtle)',
                        background: recordsFilter === f.id ? 'var(--blue-primary)' : 'transparent',
                        color: recordsFilter === f.id ? '#fff' : 'var(--text-main)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <EmptyState text="Расхождений не найдено за выбранный период" />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                        {['Дата и время', 'Тип расхождения', 'Штрих-код', 'Услуга', 'Устройство', 'Параметры', 'Причина'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.slice(0, 500).map((rec) => {
                        const hasParams = rec.wbcValue || rec.rbcValue || rec.hgbValue || rec.pltValue;
                        return (
                          <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{fmtDateTime(rec.anomalyTimestamp)}</td>
                            <td style={{ padding: '7px 10px' }}><ViolationBadge type={rec.anomalyType} /></td>
                            <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>
                              {rec.barcode || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>—</span>}
                            </td>
                            <td style={{ padding: '7px 10px', maxWidth: 200 }}>
                              {rec.serviceName || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                            </td>
                            <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
                              {rec.deviceSystemName || '—'}
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              {hasParams ? (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {rec.wbcValue != null && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#3b82f6' }}>WBC {rec.wbcValue.toFixed(2)}</span>}
                                  {rec.rbcValue != null && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#10b981' }}>RBC {rec.rbcValue.toFixed(2)}</span>}
                                  {rec.hgbValue != null && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#f59e0b' }}>HGB {rec.hgbValue.toFixed(0)}</span>}
                                  {rec.pltValue != null && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8b5cf6' }}>PLT {rec.pltValue.toFixed(0)}</span>}
                                </div>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rec.classificationReason || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredRecords.length > 500 && (
                    <div style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      Показаны первые 500 из {filteredRecords.length} записей
                    </div>
                  )}
                </div>
              )}
            </Panel>
          )}
        </>
      )}

      {!hasData && !loading && !error && (
        <Panel style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center', fontSize: 14 }}>
          Нет данных. Загрузите Applogs или errors.xml через раздел загрузки логов.
        </Panel>
      )}
    </div>
  );
}

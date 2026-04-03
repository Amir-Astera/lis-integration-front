import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getUserRoleLabels } from '../lib/authz';
import { fetchDashboardFull } from '../services/dashboard';

// ── Constants ──────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { key: 'day',   label: 'День' },
  { key: 'week',  label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('ru-RU');
}

function fmtMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(n);
}

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

// ── Small reusable UI components ────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((e, i) => (
        <div key={i} style={{ color: e.color }}>{e.name}: <strong>{typeof e.value === 'number' ? fmt(e.value) : e.value}</strong></div>
      ))}
    </div>
  );
}

function KpiCard({ icon, title, value, sub, color = BLUE, trend }) {
  return (
    <div className="panel" style={{ borderTop: `3px solid ${color}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            {title}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
        </div>
        {trend != null && (
          <div style={{
            fontSize: 11, fontWeight: 600, padding: '3px 7px', borderRadius: 4,
            background: trend >= 0 ? GREEN + '22' : RED + '22',
            color: trend >= 0 ? GREEN : RED,
          }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{children}</h2>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function EmptyState({ icon = '📭', text = 'Нет данных', hint }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 500 }}>{text}</div>
      {hint && <div style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ── Chart components ─────────────────────────────────────────────────────────

function DailyAreaChart({ data }) {
  if (!data?.length) return <EmptyState icon="📈" text="Нет данных по дням" hint="Загрузите журнал регистрации направлений (Админ-панель → Загрузка отчетов)" />;
  const chartData = data.map(d => ({
    date: (d.date || '').slice(5).replace('-', '.'),
    Услуги: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BLUE} stopOpacity={0.3} />
            <stop offset="95%" stopColor={BLUE} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="Услуги" stroke={BLUE} fill="url(#colorServices)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function WorkplacesBarChart({ data }) {
  if (!data?.length) return <EmptyState icon="🏥" text="Нет данных по рабочим местам" hint="Загрузите отчет «Рабочие места»" />;
  const chartData = data.slice(0, 10).map(w => ({
    name: (w.name || '').length > 20 ? (w.name || '').slice(0, 18) + '…' : w.name,
    fullName: w.name,
    Выполнено: Math.round(w.numericValue ?? 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 32, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="Выполнено" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={18}>
          {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TatBarChart({ data }) {
  if (!data?.length) return <EmptyState icon="⏱" text="Нет данных ТАТ" hint="Для расчёта ТАТ загрузите «Журнал регистрации направлений» (Админ-панель → Загрузка отчетов → Журнал регистрации)" />;
  const chartData = [...data].sort((a, b) => (b.averageMinutes || 0) - (a.averageMinutes || 0)).slice(0, 10).map(t => ({
    name: (t.service || '').length > 22 ? (t.service || '').slice(0, 20) + '…' : t.service,
    fullName: t.service,
    'ТАТ (мин)': t.averageMinutes || 0,
    Случаев: t.count || 0,
    label: t.averageDurationText,
  }));
  const maxVal = Math.max(...chartData.map(d => d['ТАТ (мин)']));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 56, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis type="category" dataKey="name" width={175} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="ТАТ (мин)" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {chartData.map((entry, i) => {
            const ratio = maxVal > 0 ? entry['ТАТ (мин)'] / maxVal : 0;
            const hue = Math.round(120 - ratio * 120);
            return <Cell key={i} fill={`hsl(${hue},70%,48%)`} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DepartmentLoadChart({ data }) {
  if (!data?.length) return null;
  const chartData = data.slice(0, 8).map(d => ({
    name: (d.name || '').length > 18 ? (d.name || '').slice(0, 16) + '…' : d.name,
    Нагрузка: Math.round(d.value || 0),
    fullName: d.name,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="Нагрузка" radius={[4, 4, 0, 0]} maxBarSize={32} unit="%">
          {chartData.map((entry, i) => {
            const v = entry.Нагрузка;
            return <Cell key={i} fill={v >= 80 ? RED : v >= 60 ? AMBER : GREEN} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CompletionRingChart({ sent, total }) {
  const p = pct(sent, total);
  const data = [{ value: p }, { value: 100 - p }];
  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} strokeWidth={0}>
            <Cell fill={p >= 80 ? GREEN : p >= 50 ? BLUE : AMBER} />
            <Cell fill="var(--border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: p >= 80 ? GREEN : p >= 50 ? BLUE : AMBER }}>{p}%</span>
        <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>выполнено</span>
      </div>
    </div>
  );
}

function StockAlertsTable({ items }) {
  if (!items?.length) return <EmptyState icon="📦" text="Нет данных по складу" />;
  return (
    <div className="table-wrap">
      <table className="table-grid" style={{ fontSize: 12 }}>
        <thead><tr><th>Наименование</th><th>Анализатор</th><th>Остаток</th><th>Срок</th></tr></thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.critical && <span style={{ color: RED, fontSize: 10 }}>●</span>}
                  {item.name}
                </div>
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{item.analyzer || '—'}</td>
              <td style={{ fontWeight: 600, color: item.critical ? RED : 'inherit' }}>{item.balanceText}</td>
              <td>
                <span style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  background: item.expiryText === 'истек' ? RED + '22' : item.expiryText === 'скоро' ? AMBER + '22' : GREEN + '22',
                  color: item.expiryText === 'истек' ? RED : item.expiryText === 'скоро' ? AMBER : GREEN,
                }}>
                  {item.expiryText || '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UploadStatusRow({ uploads }) {
  if (!uploads) return null;
  const { totalUploads, normalizedUploads, latestUploadedAt } = uploads;
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
      <span>Загрузок: <strong style={{ color: 'var(--text-primary)' }}>{totalUploads}</strong></span>
      <span>Нормализовано: <strong style={{ color: GREEN }}>{normalizedUploads}</strong></span>
      {latestUploadedAt && (
        <span>Последнее: <strong style={{ color: 'var(--text-primary)' }}>
          {new Date(latestUploadedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </strong></span>
      )}
    </div>
  );
}

function WorkplaceDetailRow({ workplaceDetailReport }) {
  const [expanded, setExpanded] = useState(new Set());
  const data = workplaceDetailReport;
  if (!data?.workplaces?.length) return null;

  const toggle = (name) => setExpanded(prev => {
    const s = new Set(prev);
    s.has(name) ? s.delete(name) : s.add(name);
    return s;
  });

  const totalAll = data.workplaces.reduce((s, w) => s + (w.totalCompleted || 0), 0);

  return (
    <div className="surface-card" style={{ marginTop: 0 }}>
      <SectionTitle sub={`Итого выполнено: ${fmt(Math.round(totalAll))}`}>
        Детализация по рабочим местам
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.workplaces.map(w => (
          <div key={w.workplaceName}>
            <div
              onClick={() => toggle(w.workplaceName)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                cursor: 'pointer', border: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: expanded.has(w.workplaceName) ? 'rotate(90deg)' : 'none' }}>▶</span>
                <strong style={{ fontSize: 13 }}>{w.workplaceName}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(w.totalCompleted, totalAll)}%`, height: '100%', background: BLUE, borderRadius: 2 }} />
                </div>
                <span style={{ background: BLUE, color: 'white', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, minWidth: 52, textAlign: 'center' }}>
                  {fmt(Math.round(w.totalCompleted))}
                </span>
              </div>
            </div>
            {expanded.has(w.workplaceName) && (
              <div style={{ marginLeft: 24, marginTop: 4, marginBottom: 4 }}>
                <div className="table-wrap">
                  <table className="table-grid" style={{ fontSize: 12 }}>
                    <thead><tr><th>Услуга</th><th style={{ textAlign: 'right' }}>Выполнено</th></tr></thead>
                    <tbody>
                      {(w.services || []).map(svc => (
                        <tr key={svc.serviceName}>
                          <td>{svc.serviceName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(Math.round(svc.totalCompleted))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main DashboardView ───────────────────────────────────────────────────────

function DashboardView({
  token,
  currentUser,
  uploads,
  overview: overviewLegacy,
  referralRegistrationSummary,
  workplaceProcessedView,
  materialProcessedView,
  workplaceDetailReport,
}) {
  const roleLabels = getUserRoleLabels(currentUser);
  const [period, setPeriod] = useState('month');
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  const loadDash = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchDashboardFull(token, forceRefresh);
      setDashData(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadDash(); }, [loadDash]);

  const periodData = useMemo(() => dashData?.[period] || null, [dashData, period]);

  // KPIs with fallback to legacy referralRegistrationSummary
  const kpi = useMemo(() => {
    if (periodData) return periodData;
    const s = referralRegistrationSummary?.summary;
    if (s) return { researchCount: s.researchCount, patientCount: s.patientCount, departmentCount: s.departmentCount, sentResultsCount: s.sentResultsCount, materialsCount: s.materialsCount, serviceCostTotal: 0 };
    return null;
  }, [periodData, referralRegistrationSummary]);

  const workplacesData = useMemo(() => {
    if (periodData?.workplaceItems?.length) {
      return periodData.workplaceItems.map(w => ({ name: w.name, numericValue: w.numericValue ?? 0 }));
    }
    if (workplaceProcessedView?.workplaces) {
      return workplaceProcessedView.workplaces
        .sort((a, b) => b.summary.completedValueTotal - a.summary.completedValueTotal)
        .map(w => ({ name: w.workplace, numericValue: w.summary.completedValueTotal }));
    }
    return [];
  }, [periodData, workplaceProcessedView]);

  const dailyStats = useMemo(() => periodData?.dailyStats || dashData?.dailyStats || [], [periodData, dashData]);
  const tatData = useMemo(() => periodData?.tatByService || [], [periodData]);
  const deptLoads = useMemo(() => dashData?.departmentLoads || [], [dashData]);
  const stockAlerts = useMemo(() => dashData?.stockAlerts || [], [dashData]);
  const analyzerStatuses = useMemo(() => dashData?.analyzerStatuses || [], [dashData]);

  const completionPct = kpi ? pct(kpi.sentResultsCount, kpi.researchCount) : 0;
  const uploadsInfo = dashData?.uploads;

  const sections = [
    { key: 'overview', label: 'Обзор' },
    { key: 'workplaces', label: 'Рабочие места' },
    { key: 'tat', label: 'Время выполнения' },
    { key: 'workload', label: 'Нагрузка' },
    ...(stockAlerts.length ? [{ key: 'stock', label: 'Склад' }] : []),
    ...(workplaceDetailReport?.workplaces?.length ? [{ key: 'detail', label: 'Детализация' }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Header ── */}
      <div className="page-header" style={{ paddingBottom: 12 }}>
        <div>
          <h1>Сводка лаборатории</h1>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {roleLabels.join(', ') || 'Пользователь'}
            {lastRefresh && <span style={{ marginLeft: 10 }}>· Обновлено: {lastRefresh.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="period-segmented">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`period-btn${period === opt.key ? ' active' : ''}`}
                onClick={() => setPeriod(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => loadDash(true)}
            disabled={loading}
            style={{ fontSize: 12 }}
          >
            {loading ? '⟳ Загрузка…' : '⟳ Обновить'}
          </button>
        </div>
      </div>

      {/* ── Upload info bar ── */}
      {uploadsInfo && (
        <div style={{ padding: '8px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <UploadStatusRow uploads={uploadsInfo} />
        </div>
      )}

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard icon="🔬" title="Услуг зарегистрировано" value={fmt(kpi?.researchCount)} sub={`За ${PERIOD_OPTIONS.find(o => o.key === period)?.label.toLowerCase()}`} color={BLUE} />
        <KpiCard icon="✅" title="Результатов отправлено" value={fmt(kpi?.sentResultsCount)} sub={`${completionPct}% от общего`} color={GREEN} />
        <KpiCard icon="⏳" title="Ожидает выполнения" value={fmt((kpi?.researchCount || 0) - (kpi?.sentResultsCount || 0))} sub="направлений" color={AMBER} />
        <KpiCard icon="👤" title="Пациентов" value={fmt(kpi?.patientCount)} sub="уникальных" color="#8b5cf6" />
        <KpiCard icon="🏥" title="Отделений" value={fmt(kpi?.departmentCount)} sub="источников" color="#06b6d4" />
        {kpi?.serviceCostTotal > 0 && (
          <KpiCard icon="💰" title="Сумма услуг" value={fmtMoney(kpi.serviceCostTotal)} sub="за период" color="#f97316" />
        )}
        {dashData?.samplesTotal > 0 && (
          <KpiCard icon="🧪" title="Записей в базе" value={fmt(dashData.samplesTotal)} sub="всего фактов" color="#64748b" />
        )}
      </div>

      {/* ── Completion ring + daily chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <SectionTitle>Выполнение услуг</SectionTitle>
          <CompletionRingChart sent={kpi?.sentResultsCount || 0} total={kpi?.researchCount || 1} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{fmt(kpi?.sentResultsCount)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Выполнено</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: AMBER }}>{fmt((kpi?.researchCount || 0) - (kpi?.sentResultsCount || 0))}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ожидает</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <SectionTitle sub="Количество услуг по дням">Динамика регистраций</SectionTitle>
          <DailyAreaChart data={dailyStats} />
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div className="surface-card" style={{ padding: '8px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sections.map(s => (
            <button
              key={s.key}
              type="button"
              className={`tab-button${activeSection === s.key ? ' active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview section ── */}
      {activeSection === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="surface-card">
            <SectionTitle sub="Топ-10 по объёму выполненных исследований">Рабочие места</SectionTitle>
            <WorkplacesBarChart data={workplacesData} />
          </div>
          <div className="surface-card">
            <SectionTitle sub="Среднее время от регистрации до результата">ТАТ (топ-10 долгих)</SectionTitle>
            <TatBarChart data={tatData} />
          </div>
          {deptLoads.length > 0 && (
            <div className="surface-card">
              <SectionTitle sub="% от максимальной нагрузки по рабочим местам">Нагрузка по отделениям</SectionTitle>
              <DepartmentLoadChart data={deptLoads} />
            </div>
          )}
          {stockAlerts.length > 0 && (
            <div className="surface-card">
              <SectionTitle sub="Критичные остатки реагентов">Склад — сигналы</SectionTitle>
              <StockAlertsTable items={stockAlerts} />
            </div>
          )}
        </div>
      )}

      {/* ── Workplaces section ── */}
      {activeSection === 'workplaces' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="surface-card">
            <SectionTitle sub={`Всего: ${fmt(workplacesData.reduce((s, w) => s + (w.numericValue || 0), 0))}`}>
              Выполнено по рабочим местам
            </SectionTitle>
            <WorkplacesBarChart data={workplacesData} />
          </div>
          <div className="surface-card">
            <SectionTitle>Таблица</SectionTitle>
            <div className="table-wrap">
              <table className="table-grid" style={{ fontSize: 12 }}>
                <thead><tr><th>#</th><th>Рабочее место</th><th style={{ textAlign: 'right' }}>Выполнено</th></tr></thead>
                <tbody>
                  {workplacesData.map((w, i) => (
                    <tr key={w.name}>
                      <td style={{ color: 'var(--text-secondary)', width: 28 }}>{i + 1}</td>
                      <td>{w.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(Math.round(w.numericValue || 0))}</td>
                    </tr>
                  ))}
                  {workplacesData.length > 0 && (
                    <tr style={{ fontWeight: 700, background: 'var(--bg-elevated)' }}>
                      <td colSpan={2}>Итого</td>
                      <td style={{ textAlign: 'right' }}>{fmt(Math.round(workplacesData.reduce((s, w) => s + (w.numericValue || 0), 0)))}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAT section ── */}
      {activeSection === 'tat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="surface-card">
            <SectionTitle sub="Среднее время от регистрации до отправки результата">Время выполнения (ТАТ) по услугам</SectionTitle>
            <TatBarChart data={tatData} />
          </div>
          <div className="surface-card">
            <SectionTitle>Детализация</SectionTitle>
            {tatData.length ? (
              <div className="table-wrap">
                <table className="table-grid" style={{ fontSize: 12 }}>
                  <thead><tr><th>Услуга</th><th style={{ textAlign: 'right' }}>Среднее</th><th style={{ textAlign: 'right' }}>Случаев</th></tr></thead>
                  <tbody>
                    {tatData.map(t => (
                      <tr key={t.service}>
                        <td>{t.service}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.averageDurationText}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{t.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState icon="⏱" text="Нет данных ТАТ" hint="Данные берутся из журнала регистрации" />}
          </div>
        </div>
      )}

      {/* ── Workload section ── */}
      {activeSection === 'workload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="surface-card">
            <SectionTitle sub="Относительная нагрузка в % от максимума">Нагрузка по отделениям</SectionTitle>
            <DepartmentLoadChart data={deptLoads} />
          </div>
          {analyzerStatuses.length > 0 && (
            <div className="surface-card">
              <SectionTitle sub="Статусы анализаторов из отчетов">Оборудование</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analyzerStatuses.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                      {a.secondaryText && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.secondaryText}</div>}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                      background: a.status === 'В работе' ? GREEN + '22' : AMBER + '22',
                      color: a.status === 'В работе' ? GREEN : AMBER,
                    }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dailyStats.length > 0 && (
            <div className="surface-card" style={{ gridColumn: 'span 2' }}>
              <SectionTitle sub="Все дни периода">Динамика по дням — полный вид</SectionTitle>
              <DailyAreaChart data={dailyStats} />
            </div>
          )}
        </div>
      )}

      {/* ── Stock section ── */}
      {activeSection === 'stock' && (
        <div className="surface-card">
          <SectionTitle sub="Данные из реагентного склада">Склад — остатки и сигналы</SectionTitle>
          <StockAlertsTable items={stockAlerts} />
        </div>
      )}

      {/* ── Detail section ── */}
      {activeSection === 'detail' && (
        <WorkplaceDetailRow workplaceDetailReport={workplaceDetailReport} />
      )}

      {/* ── Materials table (always visible at bottom of overview) ── */}
      {activeSection === 'overview' && materialProcessedView?.materials?.length > 0 && (
        <>
          <Divider label="Материалы по услугам" />
          <div className="surface-card">
            <SectionTitle sub="Из отчета «Направления по материалу»">Биоматериалы</SectionTitle>
            <div className="table-wrap">
              <table className="table-grid" style={{ fontSize: 12 }}>
                <thead><tr><th>Материал</th><th style={{ textAlign: 'right' }}>Кол-во</th></tr></thead>
                <tbody>
                  {materialProcessedView.materials.sort((a, b) => b.rowTotal - a.rowTotal).map(m => (
                    <tr key={m.material}><td>{m.material}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(Math.round(m.rowTotal))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!dashData && !loading && (
        <div className="surface-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Нет данных дашборда</div>
          <div style={{ fontSize: 13 }}>Загрузите и нормализуйте отчеты через <strong>Админ-панель</strong></div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;

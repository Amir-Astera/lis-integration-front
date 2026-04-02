import { getUserRoleLabels } from '../lib/authz';
import { useMemo, useState } from 'react';
import DailyOrdersChart from './DailyOrdersChart';
import WorkplaceDetailReport from './WorkplaceDetailReport';

function DashboardView({ currentUser, uploads, overview, referralRegistrationSummary, workplaceProcessedView, materialProcessedView, workplaceDetailReport }) {
  const roleLabels = getUserRoleLabels(currentUser);
  const uploadsList = uploads || [];
  const dashboard = overview?.dashboard;
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dashboardData, setDashboardData] = useState({
    kpi: null,
    tat: [],
    workplaces: [],
    analyzers: [],
    warehouse: [],
    dailyStats: [],
    departmentLoads: []
  });
  const [loading, setLoading] = useState(true);
  
  const periodOptions = useMemo(() => ([
    { key: 'day', label: 'День' },
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
  ]), []);
  
  // Используем данные из workplaceProcessedView для рабочих мест
  const workplaces = useMemo(() => {
    if (!workplaceProcessedView?.workplaces) return [];
    const sorted = [...workplaceProcessedView.workplaces]
      .sort((a, b) => b.summary.completedValueTotal - a.summary.completedValueTotal)
      .slice(0, 8)
      .map(w => ({
        name: w.workplace,
        numericValue: w.summary.completedValueTotal,
        secondaryText: `Выполнено исследований: ${Math.round(w.summary.completedValueTotal)}`,
        status: 'Активно'
      }));
    return sorted;
  }, [workplaceProcessedView]);
  
  // Используем данные из materialProcessedView для материалов
  const materials = useMemo(() => {
    if (!materialProcessedView?.materials) return [];
    return materialProcessedView.materials
      .sort((a, b) => b.rowTotal - a.rowTotal)
      .map(m => ({
        name: m.material,
        amount: m.rowTotal
      }));
  }, [materialProcessedView]);
  
  // Используем данные из referralRegistrationSummary для сводных KPI
  const summaryData = useMemo(() => {
    return referralRegistrationSummary?.summary || dashboardData?.kpi;
  }, [referralRegistrationSummary, dashboardData?.kpi]);
  
  // График всегда показывает данные за месяц
  const dailyStats = dashboardData?.dailyStats || [];
  const tatByService = dashboardData?.tat || [];
  const maxTatMinutes = useMemo(() => {
    if (!tatByService || tatByService.length === 0) return 1;
    return Math.max(...tatByService.map(i => i.averageMinutes));
  }, [tatByService]);
  const dailyMaxCount = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) return 1;
    return Math.max(...dailyStats.map(d => d.count));
  }, [dailyStats]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Сводка лаборатории</h1>
          <div className="text-medium header-subtitle">Роли: {roleLabels.join(', ') || 'Пользователь'}</div>
        </div>
        <div className="header-controls">
          <div className="period-segmented">
            {periodOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`period-btn ${selectedPeriod === option.key ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {overview?.generatedAt && (
            <div className="generated-at">Обновлено: {new Date(overview.generatedAt).toLocaleString('ru-KZ')}</div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row kpi-flex">
          <div className="panel accent-block">
            <h2>Количество исследований</h2>
            <div className="kpi-value">
              <span className="text-large">{summaryData?.researchCount ?? 0}</span>
              <span className="text-small">{referralRegistrationSummary?.summary?.label || 'За месяц'}</span>
            </div>
          </div>

          <div className="panel">
            <h2>Количество пациентов</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{summaryData?.patientCount ?? 0}</span>
              <span className="text-small">уникальных</span>
            </div>
          </div>

          <div className="panel">
            <h2>Количество отделений</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{summaryData?.departmentCount ?? 0}</span>
              <span className="text-small">по рабочим местам</span>
            </div>
          </div>

          <div className="panel">
            <h2>Отправленные результаты</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{summaryData?.sentResultsCount ?? 0}</span>
              <span className="text-small">{referralRegistrationSummary?.summary?.label || 'За месяц'}</span>
            </div>
          </div>

          <div className="panel">
            <h2>Количество материалов</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{summaryData?.materialsCount ?? 0}</span>
              <span className="text-small">включая «Нет данных»</span>
            </div>
          </div>
        </div>

        <div className="panel mod-tat">
          <div className="panel-heading split-start">
            <div>
              <h2>Аналитика ТАТ (Время выполнения)</h2>
              <div className="text-medium">{overview?.sourceReportName ? `По услугам из: ${overview.sourceReportName}` : 'По услугам из журнала направлений'}</div>
            </div>
            <div className="text-large panel-heading-value">{tatByService[0]?.averageDurationText || '0м'}</div>
          </div>

          <div className="tat-chart-container">
            {tatByService.length > 0 ? tatByService.map((item) => {
              const percentage = maxTatMinutes > 0 ? (item.averageMinutes / maxTatMinutes) : 0;
              const opacity = 0.3 + (percentage * 0.7);
              return (
                <div className="tat-bar-row" key={item.service}>
                  <div className="tat-label" title={item.service}>{item.service}</div>
                  <div className="tat-track">
                    <div
                      className="tat-fill"
                      style={{
                        width: `${Math.max(5, percentage * 100)}%`,
                        backgroundColor: `rgba(30, 88, 182, ${opacity})`,
                      }}
                    >
                      {item.averageDurationText || `${item.averageMinutes}м`}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="tat-empty-state">
                <div className="text-medium">Нет данных о времени выполнения</div>
                <div className="text-small">Загрузите отчеты с данными о выполненных исследованиях</div>
              </div>
            )}
          </div>
        </div>

        <div className="panel mod-eq">
          <div className="panel-heading split-end align-end space-bottom">
            <h2>Рабочие места</h2>
            <div className="text-medium">Выполнено исследований: {workplaces.reduce((sum, w) => sum + (w.numericValue || 0), 0) ?? 0}</div>
          </div>

          <div className="eq-list">
            {workplaces.map((item) => (
              <div className="eq-item" key={item.name}>
                <div className="eq-details">
                  <span className="eq-name">{item.name}</span>
                </div>
                <div className="eq-status running">{Math.round(item.numericValue ?? 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel mod-reagents">
          <div className="panel-heading">
            <h2>Материалы, заказанные по услугам</h2>
            <div className="text-medium">из Реестр заказов</div>
          </div>
          <table className="data-table materials-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Количество</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{Math.round(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel mod-qc">
          <div className="panel-heading split-end align-end">
            <div>
              <h2>Заказы по дням</h2>
              <div className="text-medium">Количество заказанных услуг за последние 14 дней</div>
            </div>
          </div>

          <DailyOrdersChart data={dailyStats} />
        </div>

        <WorkplaceDetailReport data={workplaceDetailReport} />
      </div>
    </>
  );
}

export default DashboardView;

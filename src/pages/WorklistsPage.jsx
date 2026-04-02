 function WorklistsPage({ overview }) {
  const worklists = overview?.worklists;
  const queue = worklists?.queue || [];
  const departmentLoads = worklists?.departmentLoads || [];
  const slaItems = worklists?.slaItems || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Рабочие листы</h1>
          <div className="text-medium header-subtitle">Производственная очередь лабораторных отделов</div>
        </div>
        <div className="integration-status">
          <div className="status-dot sync" />
          Рабочие листы синхронизированы с заданиями смены
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row">
          <div className="panel accent-block">
            <h2>Активные листы</h2>
            <div className="kpi-value">
              <span className="text-large">{worklists?.activeSheets ?? 0}</span>
              <span className="text-small">открыто в смене</span>
            </div>
          </div>
          <div className="panel">
            <h2>Ожидают запуска</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{worklists?.waitingSheets ?? 0}</span>
              <span className="text-small">по отделам</span>
            </div>
          </div>
          <div className="panel">
            <h2>В работе</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{worklists?.inProgressSheets ?? 0}</span>
              <span className="text-small">аналитических потоков</span>
            </div>
          </div>
          <div className="panel">
            <h2>Завершено</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{worklists?.completedSheets ?? 0}</span>
              <span className="text-small">загрузок</span>
            </div>
          </div>
        </div>

        <div className="panel mod-tat">
          <div className="panel-heading split-start">
            <div>
              <h2>Очередь исследований</h2>
              <div className="text-medium">Приоритет и текущее состояние рабочих листов</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Лист</th>
                <th>Отдел</th>
                <th>Ответственный</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={`${item.primaryText}-${item.secondaryText || ''}`}>
                  <td>{item.primaryText}</td>
                  <td className="text-secondary">{item.secondaryText || '—'}</td>
                  <td>{item.code || '—'}</td>
                  <td className={item.status === 'Задержка' ? 'tag-critical' : undefined}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel mod-eq">
          <div className="panel-heading split-end space-bottom">
            <h2>Нагрузка по отделам</h2>
            <button type="button" className="inline-link">Матрица</button>
          </div>
          <div className="tat-chart-container">
            {departmentLoads.map((item, index) => (
              <div className="tat-bar-row" key={item.name}>
                <div className="tat-label">{item.name}</div>
                <div className="tat-track"><div className={`tat-fill dept-${(index % 4) + 1}`} style={{ width: `${Math.max(5, item.value)}%` }}>{Math.round(item.value)}%</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel mod-reagents">
          <h2>Контроль SLA по листам</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Цель</th>
                <th>Факт</th>
                <th>Отклонение</th>
              </tr>
            </thead>
            <tbody>
              {slaItems.map((item) => (
                <tr key={item.category}>
                  <td>{item.category}</td>
                  <td className="text-secondary">{item.targetText}</td>
                  <td>{item.actualText}</td>
                  <td className={item.critical ? 'tag-critical' : undefined}>{item.deviationText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel mod-qc">
          <div className="panel-heading split-end">
            <div>
              <h2>Контроль производительности</h2>
              <div className="text-medium">Динамика прохождения листов через смену</div>
            </div>
            <div className="text-medium">Почасово</div>
          </div>
          <div className="qc-graph-placeholder">
            <div className="qc-point" style={{ left: '12%', top: '58%' }} />
            <div className="qc-point" style={{ left: '30%', top: '44%' }} />
            <div className="qc-point" style={{ left: '48%', top: '41%' }} />
            <div className="qc-point" style={{ left: '67%', top: '39%' }} />
            <div className="qc-point warning" style={{ left: '86%', top: '32%' }} />
            <div className="qc-label qc-label-top">Активно: {worklists?.activeSheets ?? 0}</div>
            <div className="qc-label qc-label-bottom">В работе: {worklists?.inProgressSheets ?? 0}</div>
          </div>
        </div>
      </div>
    </>
  );
}

 export default WorklistsPage;

const ANALYZER_TYPES = {
  BIOCHEMISTRY: 'Биохимия',
  HEMATOLOGY: 'Гематология',
  COAGULATION: 'Коагулология',
  IMMUNOLOGY: 'Иммунология',
  URINALYSIS: 'ОАМ',
  MICROBIOLOGY: 'Микробиология',
  POCT: 'POCT',
  OTHER: 'Прочее',
};

function EquipmentPage({ reagents }) {
  const analyzers = reagents?.analyzers || [];
  const activeAnalyzers = analyzers.filter((a) => a.isActive);
  const inactiveAnalyzers = analyzers.filter((a) => !a.isActive);
  const logUploads = reagents?.logUploads || [];

  const analyzerLogCounts = analyzers.reduce((acc, a) => {
    acc[a.id] = logUploads.filter((u) => u.analyzerId === a.id && u.parseStatus === 'PARSED').length;
    return acc;
  }, {});

  const maxLogs = Math.max(1, ...Object.values(analyzerLogCounts));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Оборудование</h1>
          <div className="text-medium header-subtitle">Мониторинг анализаторов в системе</div>
        </div>
        <div className="integration-status">
          <div className="status-dot sync" />
          {analyzers.length} анализаторов зарегистрировано
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row">
          <div className="panel accent-block">
            <h2>Активных</h2>
            <div className="kpi-value">
              <span className="text-large">{activeAnalyzers.length}</span>
              <span className="text-small">анализаторов в работе</span>
            </div>
          </div>
          <div className="panel">
            <h2>Неактивных</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{inactiveAnalyzers.length}</span>
              <span className="text-small">выведены из работы</span>
            </div>
          </div>
          <div className="panel">
            <h2>Загрузок логов</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{logUploads.length}</span>
              <span className="text-small">файлов обработано</span>
            </div>
          </div>
          <div className="panel">
            <h2>Всего анализаторов</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{analyzers.length}</span>
              <span className="text-small">в базе системы</span>
            </div>
          </div>
        </div>

        <div className="panel mod-tat">
          <div className="panel-heading split-start">
            <div>
              <h2>Парк оборудования</h2>
              <div className="text-medium">Анализаторы из базы системы</div>
            </div>
          </div>
          {analyzers.length === 0 ? (
            <div className="text-medium">Нет данных. Добавьте анализаторы в разделе «Реагенты → Анализаторы и нормы».</div>
          ) : (
            <div className="eq-list">
              {analyzers.map((a) => (
                <div key={a.id} className="eq-item">
                  <div className="eq-details">
                    <span className="eq-name">{a.name}</span>
                    <span className="text-small">
                      {ANALYZER_TYPES[a.type] || a.type} • {a.workplaceName}
                      {a.serialNumber ? ` • S/N: ${a.serialNumber}` : ''}
                    </span>
                  </div>
                  <div className={`eq-status ${a.isActive ? 'running' : 'maintenance'}`}>
                    {a.isActive ? 'Активен' : 'Неактивен'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {analyzers.length > 0 && (
          <div className="panel mod-eq">
            <div className="panel-heading split-end space-bottom">
              <h2>Активность по логам</h2>
              <span className="text-medium">Разобранных файлов</span>
            </div>
            <div className="tat-chart-container">
              {analyzers.slice(0, 8).map((a, idx) => {
                const count = analyzerLogCounts[a.id] || 0;
                const pct = maxLogs > 0 ? Math.round((count / maxLogs) * 100) : 0;
                const cls = ['dept-1', 'dept-2', 'dept-3', 'dept-4'][idx % 4];
                return (
                  <div key={a.id} className="tat-bar-row">
                    <div className="tat-label" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div className="tat-track">
                      <div className={`tat-fill ${cls}`} style={{ width: `${Math.max(pct, 4)}%` }}>
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default EquipmentPage;

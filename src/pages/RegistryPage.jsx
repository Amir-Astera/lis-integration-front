 function RegistryPage({ overview }) {
  const registry = overview?.registry;
  const queue = registry?.queue || [];
  const routing = registry?.routing || [];
  const zones = queue.slice(0, 4);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Регистратура</h1>
          <div className="text-medium header-subtitle">Прием, маркировка и маршрутизация поступивших проб</div>
        </div>
        <div className="integration-status">
          <div className="status-dot sync" />
          Поток регистрации работает стабильно
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row">
          <div className="panel accent-block">
            <h2>Новые поступления</h2>
            <div className="kpi-value">
              <span className="text-large">{registry?.newArrivals ?? 0}</span>
              <span className="text-small">по backend-реестру</span>
            </div>
          </div>
          <div className="panel">
            <h2>Ожидают приема</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{registry?.pendingRegistration ?? 0}</span>
              <span className="text-small">в очереди</span>
            </div>
          </div>
          <div className="panel">
            <h2>Ошибки маркировки</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{registry?.labelingErrors ?? 0}</span>
              <span className="text-small">требуют проверки</span>
            </div>
          </div>
          <div className="panel">
            <h2>Среднее время приема</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{registry?.averageAcceptanceMinutes ?? 0}м</span>
              <span className="text-small">на направление</span>
            </div>
          </div>
        </div>

        <div className="panel mod-tat">
          <div className="panel-heading split-start">
            <div>
              <h2>Очередь регистрации</h2>
              <div className="text-medium">Направления, ожидающие обработки оператором</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Объект</th>
                <th>Источник</th>
                <th>Код</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={`${item.primaryText}-${item.code || ''}`}>
                  <td>{item.primaryText}</td>
                  <td className="text-secondary">{item.secondaryText || '—'}</td>
                  <td>{item.code || '—'}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel mod-eq">
          <div className="panel-heading split-end space-bottom">
            <h2>Зоны приема</h2>
            <button type="button" className="inline-link">Схема</button>
          </div>
          <div className="eq-list">
            {zones.map((item, index) => (
              <div className="eq-item" key={`${item.primaryText}-${index}`}>
                <div className="eq-details">
                  <span className="eq-name">Окно №{index + 1}</span>
                  <span className="text-small">{item.secondaryText || item.primaryText}</span>
                </div>
                <div className={`eq-status ${index === 2 ? 'maintenance' : 'running'}`}>{index === 2 ? 'Пауза' : 'Активно'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel mod-reagents">
          <h2>Маршрутизация проб</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Направление</th>
                <th>Отдел</th>
                <th>Код</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {routing.map((item) => (
                <tr key={`${item.primaryText}-${item.code || ''}`}>
                  <td>{item.primaryText}</td>
                  <td className="text-secondary">{item.secondaryText || '—'}</td>
                  <td>{item.code || '—'}</td>
                  <td className={item.status === 'Срочно' ? 'tag-critical' : undefined}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel mod-qc">
          <div className="panel-heading split-end">
            <div>
              <h2>Ошибки и исключения</h2>
              <div className="text-medium">Контроль нестандартных регистрационных кейсов</div>
            </div>
            <div className="text-medium">За смену</div>
          </div>
          <div className="qc-graph-placeholder">
            <div className="qc-point" style={{ left: '12%', top: '42%' }} />
            <div className="qc-point" style={{ left: '28%', top: '50%' }} />
            <div className="qc-point" style={{ left: '47%', top: '38%' }} />
            <div className="qc-point" style={{ left: '68%', top: '46%' }} />
            <div className="qc-point warning" style={{ left: '88%', top: '28%' }} />
            <div className="qc-label qc-label-top">Ошибок: {registry?.labelingErrors ?? 0}</div>
            <div className="qc-label qc-label-bottom">Среднее время: {registry?.averageAcceptanceMinutes ?? 0}м</div>
          </div>
        </div>
      </div>
    </>
  );
}

 export default RegistryPage;

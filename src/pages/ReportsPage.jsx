function ReportsPage({ uploads, onRefresh }) {
  const uploadList = uploads || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Отчеты</h1>
          <div className="text-medium header-subtitle">Реестр загруженных файлов и витрина интеграции с backend</div>
        </div>
        <div className="integration-status">
          <div className="status-dot sync" />
          Загружено файлов: {uploadList.length}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row">
          <div className="panel accent-block">
            <h2>Всего файлов</h2>
            <div className="kpi-value">
              <span className="text-large">{uploadList.length}</span>
              <span className="text-small">в реестре backend</span>
            </div>
          </div>
          <div className="panel">
            <h2>Типов отчетов</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{new Set(uploadList.map((item) => item.reportKind)).size}</span>
              <span className="text-small">уникальных кодов</span>
            </div>
          </div>
          <div className="panel">
            <h2>Последняя загрузка</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{uploadList[0]?.format || '—'}</span>
              <span className="text-small">формат</span>
            </div>
          </div>
          <div className="panel">
            <h2>Обновление реестра</h2>
            <div className="kpi-value">
              <button type="button" className="inline-link" onClick={onRefresh}>Обновить</button>
            </div>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 12' }}>
          <div className="panel-heading split-end space-bottom">
            <div>
              <h2>Реестр загруженных отчетов</h2>
              <div className="text-medium">Данные читаются из backend без моков</div>
            </div>
            <button type="button" className="inline-link" onClick={onRefresh}>Повторно загрузить</button>
          </div>
          {uploadList.length === 0 ? (
            <div className="text-medium">Пока нет загруженных отчетов.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Отчет</th>
                  <th>Код</th>
                  <th>Файл</th>
                  <th>Формат</th>
                  <th>Размер</th>
                  <th>Источник</th>
                </tr>
              </thead>
              <tbody>
                {uploadList.map((upload) => (
                  <tr key={upload.id}>
                    <td>{upload.reportDisplayName || '—'}</td>
                    <td className="text-secondary">{upload.reportKind || '—'}</td>
                    <td>{upload.originalFileName || '—'}</td>
                    <td>{upload.format || '—'}</td>
                    <td>{upload.sizeBytes || 0} байт</td>
                    <td>{upload.sourceMode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default ReportsPage;

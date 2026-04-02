const STATUS_LABELS = {
  IN_STOCK: 'Норма',
  LOW: 'Мало',
  CRITICAL: 'Критично',
  OUT_OF_STOCK: 'Нет',
  EXPIRED: 'Истёк',
};

function statusColor(status) {
  if (status === 'CRITICAL' || status === 'OUT_OF_STOCK' || status === 'EXPIRED') return 'var(--red, #ef4444)';
  if (status === 'LOW') return 'var(--orange, #f97316)';
  return 'var(--green, #22c55e)';
}

function expirySoon(expiresAt) {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt) - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function WarehousePage({ reagents }) {
  const inventory = reagents?.reagentInventory || [];
  const consumables = reagents?.consumableInventory || [];
  const analyzers = reagents?.analyzers || [];

  const criticalCount = inventory.filter(
    (i) => i.status === 'CRITICAL' || i.status === 'OUT_OF_STOCK' || i.status === 'EXPIRED',
  ).length;
  const expiringCount = [
    ...inventory.map((i) => ({ expiresAt: i.expiryDateSealed })),
    ...consumables.map((i) => ({ expiresAt: i.expiryDate })),
  ].filter((i) => expirySoon(i.expiresAt)).length;
  const totalActive = inventory.filter((i) => i.status === 'IN_STOCK' || i.status === 'LOW').length
    + consumables.length;

  const topItems = [...inventory]
    .sort((a, b) => {
      const order = { EXPIRED: 0, OUT_OF_STOCK: 1, CRITICAL: 2, LOW: 3, ACTIVE: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    })
    .slice(0, 10);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Склад</h1>
          <div className="text-medium header-subtitle">Контроль реагентов, расходников и сроков годности</div>
        </div>
        <div className="integration-status">
          <div className={`status-dot ${criticalCount > 0 ? 'error' : 'sync'}`} />
          {criticalCount > 0 ? `${criticalCount} позиций требуют внимания` : 'Склад в норме'}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-row">
          <div className={`panel ${criticalCount > 0 ? 'accent-block' : ''}`}>
            <h2>Критические остатки</h2>
            <div className="kpi-value">
              <span className="text-large">{criticalCount}</span>
              <span className="text-small">позиций требуют заказа</span>
            </div>
          </div>
          <div className="panel">
            <h2>На складе</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{totalActive}</span>
              <span className="text-small">активных позиций</span>
            </div>
          </div>
          <div className="panel">
            <h2>Истекают скоро</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: expiringCount > 0 ? 'var(--orange, #f97316)' : 'var(--blue-primary)' }}>
                {expiringCount}
              </span>
              <span className="text-small">в ближайшие 7 дней</span>
            </div>
          </div>
          <div className="panel">
            <h2>Расходников</h2>
            <div className="kpi-value">
              <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{consumables.length}</span>
              <span className="text-small">позиций</span>
            </div>
          </div>
        </div>

        <div className="panel mod-tat">
          <h2>Контроль реагентов и расходников</h2>
          {topItems.length === 0 ? (
            <div className="text-medium">Нет данных. Перейдите в раздел «Реагенты» для добавления позиций.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Анализатор</th>
                  <th>Остаток (мл)</th>
                  <th>Срок годности</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => {
                  const analyzer = analyzers.find((a) => a.id === item.analyzerId);
                  const expiring = expirySoon(item.expiryDateSealed);
                  return (
                    <tr key={item.id}>
                      <td>{item.reagentName}</td>
                      <td className="text-secondary">{analyzer?.name || '—'}</td>
                      <td style={{ color: item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK' ? '#ef4444' : undefined }}>
                        {item.totalVolumeMl != null ? `${item.totalVolumeMl} мл` : '—'}
                      </td>
                      <td style={{ color: expiring ? '#f97316' : undefined }}>
                        {item.expiryDateSealed ? item.expiryDateSealed.slice(0, 10) : '—'}
                        {expiring && ' ⚠'}
                      </td>
                      <td style={{ color: statusColor(item.status), fontWeight: 600, fontSize: 12 }}>
                        {STATUS_LABELS[item.status] || item.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel mod-reagents">
          <h2>Расходники</h2>
          {consumables.length === 0 ? (
            <div className="text-medium">Расходники не добавлены.</div>
          ) : (
            <div className="eq-list">
              {consumables.slice(0, 6).map((item) => (
                <div key={item.id} className="eq-item">
                  <div className="eq-details">
                    <span className="eq-name">{item.name}</span>
                    <span className="text-small">
                      {item.quantityRemaining != null ? `${item.quantityRemaining} шт` : '—'}
                      {item.expiryDate ? ` • до ${item.expiryDate.slice(0, 10)}` : ''}
                    </span>
                  </div>
                  <div style={{ color: statusColor(item.status || 'IN_STOCK'), fontWeight: 600, fontSize: 12 }}>
                    {STATUS_LABELS[item.status || 'IN_STOCK']}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default WarehousePage;

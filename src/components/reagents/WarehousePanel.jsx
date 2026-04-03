import { useCallback, useEffect, useState } from 'react';
import {
  createWarehouseMovement,
  deleteWarehouseMovement,
  fetchReagentInventory,
  fetchConsumableInventory,
  fetchWarehouseMovements,
  fetchWarehouseSummary,
} from '../../services/reagents';

const MOVEMENT_TYPES = [
  { value: 'RECEIPT', label: 'Приход' },
  { value: 'WRITE_OFF', label: 'Списание' },
  { value: 'ADJUSTMENT', label: 'Корректировка' },
  { value: 'RETURN', label: 'Возврат' },
  { value: 'TRANSFER', label: 'Перемещение' },
  { value: 'INVENTORY_CORRECTION', label: 'Инвентаризация' },
];

const MOVEMENT_COLORS = {
  RECEIPT: '#22c55e',
  WRITE_OFF: '#ef4444',
  ADJUSTMENT: '#f59e0b',
  RETURN: '#3b82f6',
  TRANSFER: '#8b5cf6',
  INVENTORY_CORRECTION: '#6b7280',
};

const ITEM_TYPES = [
  { value: 'REAGENT', label: 'Реагент' },
  { value: 'CONSUMABLE', label: 'Расходник' },
];

const emptyForm = {
  movementType: 'RECEIPT',
  itemType: 'REAGENT',
  reagentId: '',
  consumableId: '',
  analyzerId: '',
  quantity: '',
  unitType: 'UNITS',
  unitPriceTenge: '',
  lotNumber: '',
  expiryDate: '',
  supplier: '',
  invoiceNumber: '',
  reason: '',
  notes: '',
  movementDate: new Date().toISOString().slice(0, 10),
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-KZ');
}

function MovementTypeBadge({ type }) {
  const label = MOVEMENT_TYPES.find((t) => t.value === type)?.label || type;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: MOVEMENT_COLORS[type] + '22',
        color: MOVEMENT_COLORS[type],
        border: `1px solid ${MOVEMENT_COLORS[type]}44`,
      }}
    >
      {label}
    </span>
  );
}

export default function WarehousePanel({ token, isAdmin }) {
  const [activeTab, setActiveTab] = useState('movements');
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [reagents, setReagents] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [summaryData, movementsData, reagentsData, consumablesData] = await Promise.allSettled([
        fetchWarehouseSummary(token),
        fetchWarehouseMovements(token, { from: fromDate, to: toDate }),
        fetchReagentInventory(token),
        fetchConsumableInventory(token),
      ]);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (movementsData.status === 'fulfilled') setMovements(movementsData.value || []);
      if (reagentsData.status === 'fulfilled') setReagents(reagentsData.value || []);
      if (consumablesData.status === 'fulfilled') setConsumables(consumablesData.value || []);
    } catch {
      setError('Ошибка загрузки данных склада');
    } finally {
      setLoading(false);
    }
  }, [token, fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        movementType: form.movementType,
        itemType: form.itemType,
        reagentId: form.itemType === 'REAGENT' ? form.reagentId || undefined : undefined,
        consumableId: form.itemType === 'CONSUMABLE' ? form.consumableId || undefined : undefined,
        analyzerId: form.analyzerId || undefined,
        quantity: parseFloat(form.quantity),
        unitType: form.unitType,
        unitPriceTenge: form.unitPriceTenge ? parseFloat(form.unitPriceTenge) : undefined,
        lotNumber: form.lotNumber || undefined,
        expiryDate: form.expiryDate || undefined,
        supplier: form.supplier || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
        movementDate: form.movementDate,
      };
      await createWarehouseMovement(token, payload);
      setSuccess('Движение записано');
      setShowForm(false);
      setForm(emptyForm);
      await loadData();
    } catch {
      setError('Ошибка при записи движения');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить запись движения?')) return;
    try {
      await deleteWarehouseMovement(token, id);
      setMovements((prev) => prev.filter((m) => m.id !== id));
      setSuccess('Запись удалена');
    } catch {
      setError('Ошибка при удалении');
    }
  }

  const lowStockItems = summary?.lowStockItems || [];
  const expiryItems = summary?.expiryWarningItems || [];
  const recentMovements = summary?.recentMovements || [];

  return (
    <div className="warehouse-panel">
      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div className="success-banner" style={{ marginBottom: 12 }}>{success}</div>}

      {/* KPI Cards */}
      <div className="kpi-row kpi-flex" style={{ marginBottom: 20 }}>
        <div className="panel accent-block">
          <h2>Приход за месяц</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: '#22c55e' }}>
              {summary?.totalReceiptsThisMonth?.toFixed(1) ?? '—'}
            </span>
            <span className="text-small">единиц</span>
          </div>
        </div>
        <div className="panel">
          <h2>Списано за месяц</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: '#ef4444' }}>
              {summary?.totalWriteOffsThisMonth?.toFixed(1) ?? '—'}
            </span>
            <span className="text-small">единиц</span>
          </div>
        </div>
        <div className="panel">
          <h2>Низкий запас</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: lowStockItems.length > 0 ? '#f59e0b' : 'var(--blue-primary)' }}>
              {lowStockItems.length}
            </span>
            <span className="text-small">позиций</span>
          </div>
        </div>
        <div className="panel">
          <h2>Срок истекает</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: expiryItems.length > 0 ? '#ef4444' : 'var(--blue-primary)' }}>
              {expiryItems.length}
            </span>
            <span className="text-small">позиций</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {[
          { id: 'movements', label: 'Движения' },
          { id: 'alerts', label: `⚠ Оповещения (${lowStockItems.length + expiryItems.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'movements' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
              С:
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="form-input"
                style={{ width: 140 }}
              />
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
              По:
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="form-input"
                style={{ width: 140 }}
              />
            </label>
            {loading && <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Загрузка…</span>}
            <div style={{ flex: 1 }} />
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Добавить движение
              </button>
            )}
          </div>

          {showForm && (
            <div className="modal-overlay" onClick={() => setShowForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <div className="modal-header">
                  <h3>Новое движение склада</h3>
                  <button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="form-grid">
                  <div className="form-row">
                    <label>Тип движения *
                      <select
                        value={form.movementType}
                        onChange={(e) => setForm((p) => ({ ...p, movementType: e.target.value }))}
                        className="form-input"
                        required
                      >
                        {MOVEMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>Тип позиции *
                      <select
                        value={form.itemType}
                        onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value, reagentId: '', consumableId: '' }))}
                        className="form-input"
                        required
                      >
                        {ITEM_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-row">
                    {form.itemType === 'REAGENT' ? (
                      <label>Реагент *
                        <select
                          value={form.reagentId}
                          onChange={(e) => setForm((p) => ({ ...p, reagentId: e.target.value }))}
                          className="form-input"
                          required
                        >
                          <option value="">Выберите реагент</option>
                          {reagents.map((r) => (
                            <option key={r.id} value={r.id}>{r.reagentName} {r.lotNumber ? `(лот: ${r.lotNumber})` : ''}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>Расходник *
                        <select
                          value={form.consumableId}
                          onChange={(e) => setForm((p) => ({ ...p, consumableId: e.target.value }))}
                          className="form-input"
                          required
                        >
                          <option value="">Выберите расходник</option>
                          {consumables.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>Количество *
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={form.quantity}
                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                        className="form-input"
                        required
                        placeholder="0"
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>Единица измерения
                      <input
                        type="text"
                        value={form.unitType}
                        onChange={(e) => setForm((p) => ({ ...p, unitType: e.target.value }))}
                        className="form-input"
                        placeholder="UNITS, ML, PIECE..."
                      />
                    </label>
                    <label>Цена за ед. (тенге)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.unitPriceTenge}
                        onChange={(e) => setForm((p) => ({ ...p, unitPriceTenge: e.target.value }))}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>Поставщик
                      <input
                        type="text"
                        value={form.supplier}
                        onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
                        className="form-input"
                        placeholder="Наименование поставщика"
                      />
                    </label>
                    <label>Номер накладной
                      <input
                        type="text"
                        value={form.invoiceNumber}
                        onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                        className="form-input"
                        placeholder="ТТН/накладная"
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>Лот
                      <input
                        type="text"
                        value={form.lotNumber}
                        onChange={(e) => setForm((p) => ({ ...p, lotNumber: e.target.value }))}
                        className="form-input"
                        placeholder="Номер партии"
                      />
                    </label>
                    <label>Срок годности
                      <input
                        type="date"
                        value={form.expiryDate}
                        onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>Дата движения *
                      <input
                        type="date"
                        value={form.movementDate}
                        onChange={(e) => setForm((p) => ({ ...p, movementDate: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </label>
                    <label>Причина / Основание
                      <input
                        type="text"
                        value={form.reason}
                        onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                        className="form-input"
                        placeholder="Причина движения"
                      />
                    </label>
                  </div>

                  <div style={{ gridColumn: '1/-1' }}>
                    <label>Примечания
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        className="form-input"
                        rows={2}
                        placeholder="Дополнительные сведения"
                        style={{ resize: 'vertical' }}
                      />
                    </label>
                  </div>

                  <div className="form-actions" style={{ gridColumn: '1/-1' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                      Отмена
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Сохранение…' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Movements Table */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontWeight: 600 }}>Движения за период ({movements.length})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Позиция</th>
                    <th>Кол-во</th>
                    <th>Ед.</th>
                    <th>Лот</th>
                    <th>Поставщик</th>
                    <th>Стоимость</th>
                    <th>Выполнил</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? movements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.movementDate)}</td>
                      <td><MovementTypeBadge type={m.movementType} /></td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {m.itemType === 'REAGENT' ? m.reagentId : m.consumableId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                      <td>{m.unitType}</td>
                      <td>{m.lotNumber || '—'}</td>
                      <td>{m.supplier || '—'}</td>
                      <td>
                        {m.unitPriceTenge != null
                          ? `${(m.quantity * m.unitPriceTenge).toLocaleString('ru-KZ')} ₸`
                          : '—'}
                      </td>
                      <td>{m.performedBy}</td>
                      {isAdmin && (
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(m.id)}
                            style={{ color: '#ef4444', fontSize: 12 }}
                          >
                            Удалить
                          </button>
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 9} style={{ padding: 24, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        Нет движений за выбранный период
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Low Stock */}
          <div className="panel">
            <div className="panel-heading">
              <h2>Низкий остаток</h2>
              <div className="text-small" style={{ color: '#f59e0b' }}>{lowStockItems.length} позиций</div>
            </div>
            {lowStockItems.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Тип</th>
                    <th>Остаток</th>
                    <th>Ед.</th>
                    <th>Дата снимка</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.itemName}</td>
                      <td>{item.itemType === 'REAGENT' ? 'Реагент' : 'Расходник'}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 600 }}>{item.closingQuantity?.toFixed(1)}</td>
                      <td>{item.unitType}</td>
                      <td>{formatDate(item.snapshotDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>Нет позиций с низким запасом</div>
            )}
          </div>

          {/* Expiry Warnings */}
          <div className="panel">
            <div className="panel-heading">
              <h2>Срок годности истекает</h2>
              <div className="text-small" style={{ color: '#ef4444' }}>{expiryItems.length} позиций</div>
            </div>
            {expiryItems.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Тип</th>
                    <th>Остаток</th>
                    <th>Ед.</th>
                    <th>Дата снимка</th>
                  </tr>
                </thead>
                <tbody>
                  {expiryItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.itemName}</td>
                      <td>{item.itemType === 'REAGENT' ? 'Реагент' : 'Расходник'}</td>
                      <td>{item.closingQuantity?.toFixed(1)}</td>
                      <td>{item.unitType}</td>
                      <td>{formatDate(item.snapshotDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>Нет позиций с истекающим сроком</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

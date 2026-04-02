import { useState } from 'react';
import { generateId } from '../../lib/ids';

const EMPTY_REAGENT = {
  analyzerId: '',
  reagentName: '',
  lotNumber: '',
  manufacturer: '',
  totalVolumeMl: '',
  unitType: 'ML',
  unitPriceTenge: '',
  expiryDateSealed: '',
  status: 'IN_STOCK',
  receivedAt: new Date().toISOString().slice(0, 10),
  notes: '',
};

const EMPTY_CONSUMABLE = {
  name: '',
  category: 'OTHER',
  lotNumber: '',
  quantityTotal: '',
  quantityRemaining: '',
  unitPriceTenge: '',
  expiryDate: '',
  receivedAt: new Date().toISOString().slice(0, 10),
  notes: '',
};

const STATUS_LABELS = {
  IN_STOCK: 'На складе',
  LOW: 'Мало',
  CRITICAL: 'Критично',
  OUT_OF_STOCK: 'Нет',
  EXPIRED: 'Истёк',
};

const UNIT_TYPE_LABELS = {
  ML: 'мл',
  PIECE: 'шт',
  TEST: 'тест',
  TEST_POSITION: 'позиция',
};

const CATEGORY_LABELS = {
  CUVETTE: 'Кюветы',
  REAGENT_CARD: 'Карточки',
  DILUENT: 'Разбавители',
  WASH_SOLUTION: 'Промывочные р-ры',
  CONTROL_MATERIAL: 'Контрольные мат.',
  OTHER: 'Прочее',
};

function StatusBadge({ status }) {
  const color = status === 'CRITICAL' || status === 'OUT_OF_STOCK' || status === 'EXPIRED'
    ? 'var(--red, #ef4444)' : status === 'LOW' ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)';
  return (
    <span style={{ color, fontWeight: 600, fontSize: 12 }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 28, minWidth: 460, maxWidth: 600,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#666' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

function InventoryPanel({
  reagentInventory, consumableInventory, analyzers,
  loading, isAdmin, onSaveReagent, onDeleteReagent,
  onSaveConsumable, onDeleteConsumable, onRefresh,
}) {
  const [subtab, setSubtab] = useState('reagents');
  const [reagentModal, setReagentModal] = useState(null);
  const [consumableModal, setConsumableModal] = useState(null);
  const [reagentForm, setReagentForm] = useState(EMPTY_REAGENT);
  const [consumableForm, setConsumableForm] = useState(EMPTY_CONSUMABLE);

  function openAddReagent() {
    setReagentForm(EMPTY_REAGENT);
    setReagentModal('add');
  }
  function openEditReagent(item) {
    setReagentForm({
      analyzerId: item.analyzerId || '',
      reagentName: item.reagentName || '',
      lotNumber: item.lotNumber || '',
      manufacturer: item.manufacturer || '',
      totalVolumeMl: item.totalVolumeMl ?? '',
      unitType: item.unitType || 'ML',
      unitPriceTenge: item.unitPriceTenge ?? '',
      expiryDateSealed: item.expiryDateSealed ? item.expiryDateSealed.slice(0, 10) : '',
      status: item.status || 'IN_STOCK',
      receivedAt: item.receivedAt ? item.receivedAt.slice(0, 10) : today(),
      notes: item.notes || '',
      _id: item.id,
    });
    setReagentModal('edit');
  }
  function openAddConsumable() {
    setConsumableForm(EMPTY_CONSUMABLE);
    setConsumableModal('add');
  }
  function openEditConsumable(item) {
    setConsumableForm({
      name: item.name || '',
      category: item.category || 'OTHER',
      lotNumber: item.lotNumber || '',
      quantityTotal: item.quantityTotal ?? '',
      quantityRemaining: item.quantityRemaining ?? '',
      unitPriceTenge: item.unitPriceTenge ?? '',
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
      receivedAt: item.receivedAt ? item.receivedAt.slice(0, 10) : today(),
      notes: item.notes || '',
      _id: item.id,
    });
    setConsumableModal('edit');
  }

  async function submitReagent(e) {
    e.preventDefault();
    const id = reagentForm._id || generateId();
    const payload = {
      analyzerId: reagentForm.analyzerId || null,
      reagentName: reagentForm.reagentName,
      lotNumber: reagentForm.lotNumber || null,
      manufacturer: reagentForm.manufacturer || null,
      totalVolumeMl: reagentForm.totalVolumeMl !== '' ? Number(reagentForm.totalVolumeMl) : null,
      unitType: reagentForm.unitType || 'ML',
      unitPriceTenge: reagentForm.unitPriceTenge !== '' ? Number(reagentForm.unitPriceTenge) : null,
      expiryDateSealed: reagentForm.expiryDateSealed || null,
      status: reagentForm.status,
      receivedAt: reagentForm.receivedAt,
      notes: reagentForm.notes || null,
    };
    const ok = await onSaveReagent(id, payload);
    if (ok) setReagentModal(null);
  }

  async function submitConsumable(e) {
    e.preventDefault();
    const id = consumableForm._id || generateId();
    const payload = {
      name: consumableForm.name,
      category: consumableForm.category,
      lotNumber: consumableForm.lotNumber || null,
      quantityTotal: consumableForm.quantityTotal !== '' ? Number(consumableForm.quantityTotal) : 0,
      quantityRemaining: consumableForm.quantityRemaining !== '' ? Number(consumableForm.quantityRemaining) : 0,
      unitPriceTenge: consumableForm.unitPriceTenge !== '' ? Number(consumableForm.unitPriceTenge) : null,
      expiryDate: consumableForm.expiryDate || null,
      receivedAt: consumableForm.receivedAt,
      notes: consumableForm.notes || null,
    };
    const ok = await onSaveConsumable(id, payload);
    if (ok) setConsumableModal(null);
  }

  function rf(field) { return (e) => setReagentForm((p) => ({ ...p, [field]: e.target.value })); }
  function cf(field) { return (e) => setConsumableForm((p) => ({ ...p, [field]: e.target.value })); }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" className={subtab === 'reagents' ? 'primary-button' : 'secondary-button'} onClick={() => setSubtab('reagents')}>
          Реагенты ({reagentInventory.length})
        </button>
        <button type="button" className={subtab === 'consumables' ? 'primary-button' : 'secondary-button'} onClick={() => setSubtab('consumables')}>
          Расходники ({consumableInventory.length})
        </button>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading} style={{ marginLeft: 'auto' }}>
          Обновить
        </button>
      </div>

      {subtab === 'reagents' && (
        <div className="panel" style={{ gridColumn: 'span 12' }}>
          <div className="panel-heading split-end space-bottom">
            <h2>Склад реагентов</h2>
            {isAdmin && (
              <button type="button" className="primary-button" onClick={openAddReagent}>
                + Добавить реагент
              </button>
            )}
          </div>
          {reagentInventory.length === 0 ? (
            <div className="text-medium">Нет записей в складе реагентов.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Реагент</th>
                  <th>Анализатор</th>
                  <th>Серия</th>
                  <th>Остаток (мл)</th>
                  <th>Цена / мл (тг)</th>
                  <th>Срок годности</th>
                  <th>Статус</th>
                  {isAdmin && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {reagentInventory.map((item) => {
                  const analyzer = analyzers.find((a) => a.id === item.analyzerId);
                  return (
                    <tr key={item.id}>
                      <td>{item.reagentName}</td>
                      <td className="text-secondary">{analyzer?.name || item.analyzerId || '—'}</td>
                      <td className="text-secondary">{item.lotNumber || '—'}</td>
                      <td>{item.totalVolumeMl != null ? `${item.totalVolumeMl} ${UNIT_TYPE_LABELS[item.unitType] || item.unitType}` : '—'}</td>
                      <td>{item.unitPriceTenge != null ? item.unitPriceTenge.toLocaleString('ru-KZ') : '—'}</td>
                      <td>{item.expiryDateSealed ? item.expiryDateSealed.slice(0, 10) : '—'}</td>
                      <td><StatusBadge status={item.status} /></td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="inline-link" onClick={() => openEditReagent(item)}>Изм.</button>
                          <button type="button" className="inline-link" style={{ color: 'var(--red, #ef4444)' }}
                            onClick={() => { if (window.confirm('Удалить запись?')) onDeleteReagent(item.id); }}>
                            Удал.
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subtab === 'consumables' && (
        <div className="panel" style={{ gridColumn: 'span 12' }}>
          <div className="panel-heading split-end space-bottom">
            <h2>Склад расходников</h2>
            {isAdmin && (
              <button type="button" className="primary-button" onClick={openAddConsumable}>
                + Добавить расходник
              </button>
            )}
          </div>
          {consumableInventory.length === 0 ? (
            <div className="text-medium">Нет записей в складе расходников.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Категория</th>
                  <th>Серия</th>
                  <th>Остаток / Итого</th>
                  <th>Цена / шт (тг)</th>
                  <th>Срок годности</th>
                  {isAdmin && <th>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {consumableInventory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="text-secondary">{CATEGORY_LABELS[item.category] || item.category}</td>
                    <td className="text-secondary">{item.lotNumber || '—'}</td>
                    <td>{item.quantityRemaining != null ? `${item.quantityRemaining} / ${item.quantityTotal ?? '?'}` : '—'}</td>
                    <td>{item.unitPriceTenge != null ? item.unitPriceTenge.toLocaleString('ru-KZ') : '—'}</td>
                    <td>{item.expiryDate ? item.expiryDate.slice(0, 10) : '—'}</td>
                    {isAdmin && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="inline-link" onClick={() => openEditConsumable(item)}>Изм.</button>
                        <button type="button" className="inline-link" style={{ color: 'var(--red, #ef4444)' }}
                          onClick={() => { if (window.confirm('Удалить запись?')) onDeleteConsumable(item.id); }}>
                          Удал.
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reagentModal && (
        <Modal title={reagentModal === 'add' ? 'Добавить реагент' : 'Изменить реагент'} onClose={() => setReagentModal(null)}>
          <form className="form-stack" onSubmit={submitReagent}>
            <div className="form-grid">
              <FieldGroup label="Наименование реагента *">
                <input required value={reagentForm.reagentName} onChange={rf('reagentName')} />
              </FieldGroup>
              <FieldGroup label="Анализатор">
                <select value={reagentForm.analyzerId} onChange={rf('analyzerId')}>
                  <option value="">— не привязан —</option>
                  {analyzers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Производитель">
                <input value={reagentForm.manufacturer} onChange={rf('manufacturer')} />
              </FieldGroup>
              <FieldGroup label="Серия / партия (lot)">
                <input value={reagentForm.lotNumber} onChange={rf('lotNumber')} />
              </FieldGroup>
              <FieldGroup label="Объём упаковки">
                <input type="number" step="0.01" min="0" value={reagentForm.totalVolumeMl} onChange={rf('totalVolumeMl')} />
              </FieldGroup>
              <FieldGroup label="Единица">
                <select value={reagentForm.unitType} onChange={rf('unitType')}>
                  {Object.entries(UNIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Цена за ед. (тг)">
                <input type="number" step="0.01" min="0" value={reagentForm.unitPriceTenge} onChange={rf('unitPriceTenge')} />
              </FieldGroup>
              <FieldGroup label="Срок годности (закрытый)">
                <input type="date" value={reagentForm.expiryDateSealed} onChange={rf('expiryDateSealed')} />
              </FieldGroup>
              <FieldGroup label="Дата получения *">
                <input type="date" required value={reagentForm.receivedAt} onChange={rf('receivedAt')} />
              </FieldGroup>
              <FieldGroup label="Статус">
                <select value={reagentForm.status} onChange={rf('status')}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="Примечание">
              <textarea rows={2} value={reagentForm.notes} onChange={rf('notes')} />
            </FieldGroup>
            <div className="actions-row">
              <button type="submit" className="primary-button" disabled={loading}>Сохранить</button>
              <button type="button" className="secondary-button" onClick={() => setReagentModal(null)}>Отмена</button>
            </div>
          </form>
        </Modal>
      )}

      {consumableModal && (
        <Modal title={consumableModal === 'add' ? 'Добавить расходник' : 'Изменить расходник'} onClose={() => setConsumableModal(null)}>
          <form className="form-stack" onSubmit={submitConsumable}>
            <div className="form-grid">
              <FieldGroup label="Наименование *">
                <input required value={consumableForm.name} onChange={cf('name')} />
              </FieldGroup>
              <FieldGroup label="Категория">
                <select value={consumableForm.category} onChange={cf('category')}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Серия / партия (lot)">
                <input value={consumableForm.lotNumber} onChange={cf('lotNumber')} />
              </FieldGroup>
              <FieldGroup label="Количество итого (шт) *">
                <input type="number" min="0" required value={consumableForm.quantityTotal} onChange={cf('quantityTotal')} />
              </FieldGroup>
              <FieldGroup label="Остаток (шт) *">
                <input type="number" min="0" required value={consumableForm.quantityRemaining} onChange={cf('quantityRemaining')} />
              </FieldGroup>
              <FieldGroup label="Цена / шт (тг)">
                <input type="number" step="0.01" min="0" value={consumableForm.unitPriceTenge} onChange={cf('unitPriceTenge')} />
              </FieldGroup>
              <FieldGroup label="Срок годности">
                <input type="date" value={consumableForm.expiryDate} onChange={cf('expiryDate')} />
              </FieldGroup>
              <FieldGroup label="Дата получения *">
                <input type="date" required value={consumableForm.receivedAt} onChange={cf('receivedAt')} />
              </FieldGroup>
            </div>
            <FieldGroup label="Примечание">
              <textarea rows={2} value={consumableForm.notes} onChange={cf('notes')} />
            </FieldGroup>
            <div className="actions-row">
              <button type="submit" className="primary-button" disabled={loading}>Сохранить</button>
              <button type="button" className="secondary-button" onClick={() => setConsumableModal(null)}>Отмена</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export default InventoryPanel;

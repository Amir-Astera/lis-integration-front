import { useState } from 'react';
import { generateId } from '../../lib/ids';

const EMPTY_ANALYZER = {
  name: '',
  type: 'BIOCHEMISTRY',
  workplaceName: '',
  lisDeviceSystemName: '',
  lisAnalyzerId: '',
  lisDeviceName: '',
  serialNumber: '',
  isActive: true,
  notes: '',
};

const EMPTY_RATE = {
  reagentName: '',
  operationType: 'PATIENT_TEST',
  testMode: '',
  volumePerOperationMl: '',
  unitsPerOperation: '',
  unitType: 'ML',
  sourceDocument: '',
  notes: '',
};

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

const OPERATION_TYPES = {
  PATIENT_TEST: 'Пациент',
  CALIBRATION: 'Калибровка',
  QUALITY_CONTROL: 'Контроль качества',
  MAINTENANCE: 'Обслуживание',
  PRIMING: 'Промывка',
};

const UNIT_TYPES = {
  ML: 'мл',
  PIECE: 'шт',
  TEST: 'тест',
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 28,
        minWidth: wide ? 640 : 460, maxWidth: wide ? 800 : 600,
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

function AnalyzerRatesPanel({
  analyzers, rates, loading, isAdmin,
  onLoadRates, onSaveAnalyzer, onDeleteAnalyzer,
  onSaveRate, onDeleteRate, onRefresh,
}) {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState(null);
  const [analyzerModal, setAnalyzerModal] = useState(null);
  const [rateModal, setRateModal] = useState(null);
  const [analyzerForm, setAnalyzerForm] = useState(EMPTY_ANALYZER);
  const [rateForm, setRateForm] = useState(EMPTY_RATE);

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId);

  function openAddAnalyzer() {
    setAnalyzerForm(EMPTY_ANALYZER);
    setAnalyzerModal('add');
  }
  function openEditAnalyzer(a) {
    setAnalyzerForm({
      name: a.name || '',
      type: a.type || 'BIOCHEMISTRY',
      workplaceName: a.workplaceName || '',
      lisDeviceSystemName: a.lisDeviceSystemName || '',
      lisAnalyzerId: a.lisAnalyzerId ?? '',
      lisDeviceName: a.lisDeviceName || '',
      serialNumber: a.serialNumber || '',
      isActive: a.isActive !== false,
      notes: a.notes || '',
      _id: a.id,
    });
    setAnalyzerModal('edit');
  }
  function openAddRate() {
    setRateForm({ ...EMPTY_RATE });
    setRateModal('add');
  }
  function openEditRate(r) {
    setRateForm({
      reagentName: r.reagentName || '',
      operationType: r.operationType || 'PATIENT_TEST',
      testMode: r.testMode || '',
      volumePerOperationMl: r.volumePerOperationMl ?? '',
      unitsPerOperation: r.unitsPerOperation ?? '',
      unitType: r.unitType || 'ML',
      sourceDocument: r.sourceDocument || '',
      notes: r.notes || '',
      _id: r.id,
    });
    setRateModal('edit');
  }

  async function submitAnalyzer(e) {
    e.preventDefault();
    const id = analyzerForm._id || generateId();
    const payload = {
      name: analyzerForm.name,
      type: analyzerForm.type,
      workplaceName: analyzerForm.workplaceName,
      lisDeviceSystemName: analyzerForm.lisDeviceSystemName || null,
      lisAnalyzerId: analyzerForm.lisAnalyzerId !== '' ? Number(analyzerForm.lisAnalyzerId) : null,
      lisDeviceName: analyzerForm.lisDeviceName || null,
      serialNumber: analyzerForm.serialNumber || null,
      isActive: analyzerForm.isActive,
      notes: analyzerForm.notes || null,
    };
    const ok = await onSaveAnalyzer(id, payload);
    if (ok) setAnalyzerModal(null);
  }

  async function submitRate(e) {
    e.preventDefault();
    const rateId = rateForm._id || generateId();
    const payload = {
      reagentName: rateForm.reagentName,
      operationType: rateForm.operationType,
      testMode: rateForm.testMode || null,
      volumePerOperationMl: rateForm.volumePerOperationMl !== '' ? Number(rateForm.volumePerOperationMl) : null,
      unitsPerOperation: rateForm.unitsPerOperation !== '' ? Number(rateForm.unitsPerOperation) : null,
      unitType: rateForm.unitType,
      sourceDocument: rateForm.sourceDocument || null,
      notes: rateForm.notes || null,
    };
    const ok = await onSaveRate(selectedAnalyzerId, rateId, payload);
    if (ok) setRateModal(null);
  }

  function selectAnalyzer(id) {
    setSelectedAnalyzerId(id);
    onLoadRates(id);
  }

  function af(field) { return (e) => setAnalyzerForm((p) => ({ ...p, [field]: e.target.value })); }
  function rf(field) { return (e) => setRateForm((p) => ({ ...p, [field]: e.target.value })); }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div className="panel">
        <div className="panel-heading split-end space-bottom">
          <h2>Анализаторы</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {isAdmin && (
              <button type="button" className="primary-button" style={{ fontSize: 12, padding: '4px 10px' }} onClick={openAddAnalyzer}>
                + Новый
              </button>
            )}
            <button type="button" className="secondary-button" style={{ fontSize: 12, padding: '4px 10px' }} onClick={onRefresh} disabled={loading}>
              ↺
            </button>
          </div>
        </div>
        {analyzers.length === 0 ? (
          <div className="text-medium">Нет анализаторов.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {analyzers.map((a) => (
              <div
                key={a.id}
                onClick={() => selectAnalyzer(a.id)}
                style={{
                  padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                  border: selectedAnalyzerId === a.id ? '2px solid var(--blue-primary, #2563eb)' : '2px solid #e5e7eb',
                  background: selectedAnalyzerId === a.id ? '#eff6ff' : '#fafafa',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {ANALYZER_TYPES[a.type] || a.type} • {a.workplaceName}
                  {!a.isActive && <span style={{ color: '#ef4444', marginLeft: 6 }}>Неактивен</span>}
                </div>
                {isAdmin && selectedAnalyzerId === a.id && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" className="inline-link" style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); openEditAnalyzer(a); }}>
                      Изменить
                    </button>
                    <button type="button" className="inline-link" style={{ fontSize: 12, color: '#ef4444' }}
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Удалить ${a.name} и все его нормы?`)) onDeleteAnalyzer(a.id); }}>
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        {!selectedAnalyzer ? (
          <div className="text-medium" style={{ padding: 20 }}>Выберите анализатор слева для просмотра норм реагентов.</div>
        ) : (
          <>
            <div className="panel-heading split-end space-bottom">
              <div>
                <h2>Нормы: {selectedAnalyzer.name}</h2>
                <div className="text-medium">{ANALYZER_TYPES[selectedAnalyzer.type]} • {selectedAnalyzer.workplaceName}</div>
              </div>
              {isAdmin && (
                <button type="button" className="primary-button" onClick={openAddRate}>
                  + Добавить норму
                </button>
              )}
            </div>
            {rates.length === 0 ? (
              <div className="text-medium">Нормы реагентов не заданы для этого анализатора.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Реагент</th>
                    <th>Операция</th>
                    <th>Режим теста</th>
                    <th>Объём (мл)</th>
                    <th>Кол-во (шт)</th>
                    <th>Ед.</th>
                    <th>Источник</th>
                    {isAdmin && <th>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r.id}>
                      <td>{r.reagentName}</td>
                      <td className="text-secondary">{OPERATION_TYPES[r.operationType] || r.operationType}</td>
                      <td className="text-secondary">{r.testMode || '—'}</td>
                      <td>{r.volumePerOperationMl != null ? r.volumePerOperationMl : '—'}</td>
                      <td>{r.unitsPerOperation != null ? r.unitsPerOperation : '—'}</td>
                      <td className="text-secondary">{UNIT_TYPES[r.unitType] || r.unitType}</td>
                      <td className="text-secondary" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.sourceDocument}>{r.sourceDocument || '—'}</td>
                      {isAdmin && (
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="inline-link" onClick={() => openEditRate(r)}>Изм.</button>
                          <button type="button" className="inline-link" style={{ color: '#ef4444' }}
                            onClick={() => { if (window.confirm('Удалить норму?')) onDeleteRate(selectedAnalyzerId, r.id); }}>
                            Удал.
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {analyzerModal && (
        <Modal title={analyzerModal === 'add' ? 'Новый анализатор' : 'Изменить анализатор'} onClose={() => setAnalyzerModal(null)}>
          <form className="form-stack" onSubmit={submitAnalyzer}>
            <div className="form-grid">
              <FieldGroup label="Наименование *">
                <input required value={analyzerForm.name} onChange={af('name')} />
              </FieldGroup>
              <FieldGroup label="Тип">
                <select value={analyzerForm.type} onChange={af('type')}>
                  {Object.entries(ANALYZER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Рабочее место *">
                <input required value={analyzerForm.workplaceName} onChange={af('workplaceName')} />
              </FieldGroup>
              <FieldGroup label="Сист. имя в ЛИС">
                <input value={analyzerForm.lisDeviceSystemName} onChange={af('lisDeviceSystemName')} />
              </FieldGroup>
              <FieldGroup label="ID анализатора в ЛИС">
                <input type="number" value={analyzerForm.lisAnalyzerId} onChange={af('lisAnalyzerId')} />
              </FieldGroup>
              <FieldGroup label="Имя устройства в ЛИС">
                <input value={analyzerForm.lisDeviceName} onChange={af('lisDeviceName')} />
              </FieldGroup>
              <FieldGroup label="Серийный номер">
                <input value={analyzerForm.serialNumber} onChange={af('serialNumber')} />
              </FieldGroup>
              <FieldGroup label="Активен">
                <select value={analyzerForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setAnalyzerForm((p) => ({ ...p, isActive: e.target.value === 'true' }))}>
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="Примечание">
              <textarea rows={2} value={analyzerForm.notes} onChange={af('notes')} />
            </FieldGroup>
            <div className="actions-row">
              <button type="submit" className="primary-button" disabled={loading}>Сохранить</button>
              <button type="button" className="secondary-button" onClick={() => setAnalyzerModal(null)}>Отмена</button>
            </div>
          </form>
        </Modal>
      )}

      {rateModal && (
        <Modal title={rateModal === 'add' ? 'Добавить норму реагента' : 'Изменить норму'} onClose={() => setRateModal(null)}>
          <form className="form-stack" onSubmit={submitRate}>
            <div className="form-grid">
              <FieldGroup label="Наименование реагента *">
                <input required value={rateForm.reagentName} onChange={rf('reagentName')} />
              </FieldGroup>
              <FieldGroup label="Тип операции">
                <select value={rateForm.operationType} onChange={rf('operationType')}>
                  {Object.entries(OPERATION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Режим теста (опц.)">
                <input value={rateForm.testMode} onChange={rf('testMode')} placeholder="PT, APTT, ..." />
              </FieldGroup>
              <FieldGroup label="Объём / операцию (мл)">
                <input type="number" step="0.0001" min="0" value={rateForm.volumePerOperationMl} onChange={rf('volumePerOperationMl')} />
              </FieldGroup>
              <FieldGroup label="Кол-во / операцию (шт)">
                <input type="number" min="0" value={rateForm.unitsPerOperation} onChange={rf('unitsPerOperation')} />
              </FieldGroup>
              <FieldGroup label="Единица измерения">
                <select value={rateForm.unitType} onChange={rf('unitType')}>
                  {Object.entries(UNIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Источник данных">
                <input value={rateForm.sourceDocument} onChange={rf('sourceDocument')} placeholder="Mindray Catalog 2026..." />
              </FieldGroup>
            </div>
            <FieldGroup label="Примечание">
              <textarea rows={2} value={rateForm.notes} onChange={rf('notes')} />
            </FieldGroup>
            <div className="actions-row">
              <button type="submit" className="primary-button" disabled={loading}>Сохранить</button>
              <button type="button" className="secondary-button" onClick={() => setRateModal(null)}>Отмена</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AnalyzerRatesPanel;

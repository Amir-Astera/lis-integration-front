import { useState } from 'react';

const PARSE_STATUS_LABELS = {
  PENDING: 'Ожидает',
  PARSING: 'Разбор...',
  PARSED: 'Разобран',
  FAILED: 'Ошибка',
};

const SOURCE_TYPE_LABELS = {
  APPLOGS: 'Applogs (CSV)',
  ERRORS_XML: 'Errors XML',
};

const CLASSIFICATION_LABELS = {
  LEGITIMATE: 'Регулярная проба',
  SUSPICIOUS: 'Расхождение',
  ERROR: 'Ошибка',
  XML_RESULT: 'XML-результат',
  PROBABLE_RERUN: 'Повтор',
  WASH_TEST: 'Промывка',
  SERVICE: 'Сервисный',
  UNKNOWN: 'Не определено',
};

function StatusBadge({ status }) {
  const colors = {
    PENDING: '#f97316',
    PARSING: '#2563eb',
    PARSED: '#22c55e',
    FAILED: '#ef4444',
  };
  return (
    <span style={{ color: colors[status] || '#6b7280', fontWeight: 600, fontSize: 12 }}>
      {PARSE_STATUS_LABELS[status] || status}
    </span>
  );
}

function LogUploadsPanel({
  analyzers, logUploads, parsedSamples, loading,
  isAdmin, onUpload, onParse, onLoadSamples, onRefresh,
}) {
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [uploadForm, setUploadForm] = useState({ analyzerId: '', sourceType: 'APPLOGS', files: [] });
  const [showSamples, setShowSamples] = useState(false);

  const selectedUpload = logUploads.find((u) => u.id === selectedUploadId);

  async function handleSubmitUpload(e) {
    e.preventDefault();
    if (!uploadForm.files?.length || !uploadForm.analyzerId) return;
    await onUpload(uploadForm.analyzerId, uploadForm.sourceType, uploadForm.files);
    setUploadForm((p) => ({ ...p, files: [] }));
  }

  const batchAllowed = uploadForm.sourceType === 'APPLOGS' || uploadForm.sourceType === 'ERRORS_XML';

  async function handleParse(uploadId) {
    await onParse(uploadId);
  }

  async function handleViewSamples(uploadId) {
    setSelectedUploadId(uploadId);
    setShowSamples(true);
    await onLoadSamples(uploadId);
  }

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isAdmin && (
        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>Загрузить лог анализатора</h2>
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            background: '#f59e0b10', border: '1px solid #f59e0b30', fontSize: 13, lineHeight: 1.5,
          }}>
            <strong>Внимание:</strong> для Applogs и Errors XML можно выбрать <strong>несколько файлов</strong> сразу (Ctrl/Shift в диалоге выбора).
            Для Applogs после загрузки выполняется автоматический разбор. Каждый файл — отдельная запись в журнале ниже.
          </div>
          <form className="form-stack" onSubmit={handleSubmitUpload}>
            <div className="form-grid">
              <div className="field-group">
                <label>Анализатор *</label>
                <select
                  required
                  value={uploadForm.analyzerId}
                  onChange={(e) => setUploadForm((p) => ({ ...p, analyzerId: e.target.value }))}
                >
                  <option value="">— выберите анализатор —</option>
                  {analyzers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Тип источника</label>
                <select
                  value={uploadForm.sourceType}
                  onChange={(e) => setUploadForm((p) => ({ ...p, sourceType: e.target.value, files: [] }))}
                >
                  {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>{batchAllowed ? 'Файлы лога *' : 'Файл лога *'}</label>
                <input
                  type="file"
                  accept=".csv,.xml,.log,.txt"
                  multiple={batchAllowed}
                  onChange={(e) => {
                    const picked = e.target.files ? Array.from(e.target.files) : [];
                    setUploadForm((p) => ({ ...p, files: picked }));
                  }}
                />
                {batchAllowed && uploadForm.files?.length > 0 && (
                  <div className="text-medium" style={{ marginTop: 6 }}>
                    Выбрано файлов: {uploadForm.files.length}
                  </div>
                )}
              </div>
            </div>
            <div className="actions-row">
              <button
                type="submit"
                className="primary-button"
                disabled={loading || !uploadForm.files?.length || !uploadForm.analyzerId}
              >
                {uploadForm.files?.length > 1 ? `Загрузить (${uploadForm.files.length})` : 'Загрузить'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading split-end space-bottom">
          <div>
            <h2>Журнал загрузок логов</h2>
            <div className="text-medium">{logUploads.length} записей</div>
          </div>
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
            Обновить
          </button>
        </div>
        {logUploads.length === 0 ? (
          <div className="text-medium">Нет загруженных логов.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Анализатор</th>
                <th>Файл</th>
                <th>Тип</th>
                <th>Образцов</th>
                <th>Статус</th>
                <th>Загружен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {logUploads.map((u) => {
                const analyzer = analyzers.find((a) => a.id === u.analyzerId);
                return (
                  <tr key={u.id} style={{ background: selectedUploadId === u.id ? '#eff6ff' : undefined }}>
                    <td>{analyzer?.name || u.analyzerId || '—'}</td>
                    <td className="text-secondary" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.originalFileName || '—'}
                    </td>
                    <td className="text-secondary">{SOURCE_TYPE_LABELS[u.sourceType] || u.sourceType || '—'}</td>
                    <td>{u.parsedSampleCount != null ? u.parsedSampleCount : '—'}</td>
                    <td><StatusBadge status={u.parseStatus} /></td>
                    <td className="text-secondary">{formatDate(u.uploadedAt)}</td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {isAdmin && (u.parseStatus === 'PENDING' || u.parseStatus === 'FAILED') && (
                        <button
                          type="button"
                          className="inline-link"
                          disabled={loading}
                          onClick={() => handleParse(u.id)}
                        >
                          Разобрать
                        </button>
                      )}
                      {u.parseStatus === 'PARSED' && (
                        <button
                          type="button"
                          className="inline-link"
                          onClick={() => handleViewSamples(u.id)}
                        >
                          Образцы
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showSamples && selectedUpload && (
        <div className="panel">
          <div className="panel-heading split-end space-bottom">
            <div>
              <h2>Образцы: {analyzers.find((a) => a.id === selectedUpload.analyzerId)?.name || selectedUpload.analyzerId}</h2>
              <div className="text-medium">{selectedUpload.originalFileName} • {parsedSamples.length} записей</div>
            </div>
            <button type="button" className="secondary-button" onClick={() => setShowSamples(false)}>Скрыть</button>
          </div>
          {parsedSamples.length === 0 ? (
            <div className="text-medium">Нет разобранных образцов.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Штрих-код</th>
                  <th>Тест</th>
                  <th>Режим</th>
                  <th>Классификация</th>
                  <th>Дата / время</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                {parsedSamples.slice(0, 200).map((s) => (
                  <tr key={s.id}>
                    <td className="text-secondary">{s.sampleBarcode || '—'}</td>
                    <td>{s.testName || s.testCode || '—'}</td>
                    <td className="text-secondary">{s.testMode || '—'}</td>
                    <td>
                      <span style={{
                        color: s.classification === 'UNAUTHORIZED' ? '#ef4444'
                          : s.classification === 'SERVICE' ? '#f97316' : '#22c55e',
                        fontWeight: 600, fontSize: 12,
                      }}>
                        {CLASSIFICATION_LABELS[s.classification] || s.classification || '—'}
                      </span>
                    </td>
                    <td className="text-secondary">{formatDate(s.sampleTimestamp)}</td>
                    <td className="text-secondary">{s.resultValue != null ? `${s.resultValue} ${s.resultUnit || ''}` : '—'}</td>
                  </tr>
                ))}
                {parsedSamples.length > 200 && (
                  <tr>
                    <td colSpan={6} className="text-medium">...ещё {parsedSamples.length - 200} записей</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default LogUploadsPanel;

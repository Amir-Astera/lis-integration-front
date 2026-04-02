function UploadsView({ uploads, onRefresh }) {
  return (
    <section className="surface-card">
      <div className="card-title-row">
        <h2>Реестр загруженных отчетов</h2>
        <button type="button" className="secondary-button" onClick={onRefresh}>Обновить</button>
      </div>
      {uploads.length === 0 ? (
        <div className="empty-state">Пока нет загруженных отчетов.</div>
      ) : (
        <div className="uploads-grid">
          {uploads.map((upload) => (
            <article key={upload.id} className="upload-card">
              <h3>{upload.reportDisplayName}</h3>
              <div className="helper-text">{upload.reportKind}</div>
              <div className="muted-list" style={{ marginTop: 12 }}>
                <div><strong>Файл:</strong> {upload.originalFileName}</div>
                <div><strong>Формат:</strong> {upload.format}</div>
                <div><strong>Размер:</strong> {upload.sizeBytes} байт</div>
                <div><strong>Источник:</strong> {upload.sourceMode}</div>
                <div><strong>Путь:</strong> {upload.storagePath}</div>
                <div><strong>SHA-256:</strong> {upload.checksumSha256}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default UploadsView;

import { useState } from 'react';
import AnalyzerRatesPanel from '../components/reagents/AnalyzerRatesPanel';
import InventoryPanel from '../components/reagents/InventoryPanel';
import LogUploadsPanel from '../components/reagents/LogUploadsPanel';
import ReagentReportsPanel from '../components/reagents/ReagentReportsPanel';

const TABS = [
  { id: 'inventory', label: 'Склад реагентов' },
  { id: 'analyzers', label: 'Анализаторы и нормы' },
  { id: 'logs', label: 'Загрузка логов' },
  { id: 'reports', label: 'Отчёты расхода' },
];

function ReagentsPage({ reagents, isAdmin }) {
  const [activeTab, setActiveTab] = useState('inventory');

  const criticalItems = reagents.reagentInventory.filter(
    (item) => item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK',
  );
  const totalItems = reagents.reagentInventory.length + reagents.consumableInventory.length;
  const pendingLogs = reagents.logUploads.filter((u) => u.parseStatus === 'PENDING').length;
  const reportsCount = reagents.consumptionReports.length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Реагенты и расходники</h1>
          <div className="text-medium header-subtitle">
            Склад, нормы расхода по анализаторам, загрузка логов, отчёты
          </div>
        </div>
        <div className="integration-status">
          <div className={`status-dot ${criticalItems.length > 0 ? 'error' : 'sync'}`} />
          {criticalItems.length > 0
            ? `${criticalItems.length} позиций требуют внимания`
            : 'Склад в норме'}
        </div>
      </div>

      {reagents.error && <div className="error-banner">{reagents.error}</div>}
      {reagents.success && <div className="success-banner">{reagents.success}</div>}

      <div className="kpi-row" style={{ marginBottom: 20 }}>
        <div className="panel">
          <h2>Позиций на складе</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{totalItems}</span>
            <span className="text-small">реагентов и расходников</span>
          </div>
        </div>
        <div className={`panel${criticalItems.length > 0 ? ' accent-block' : ''}`}>
          <h2>Критических остатков</h2>
          <div className="kpi-value">
            <span className="text-large">{criticalItems.length}</span>
            <span className="text-small">требуют заказа</span>
          </div>
        </div>
        <div className="panel">
          <h2>Анализаторов</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: 'var(--blue-primary)' }}>
              {reagents.analyzers.length}
            </span>
            <span className="text-small">в базе</span>
          </div>
        </div>
        <div className="panel">
          <h2>Логов на разборе</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: pendingLogs > 0 ? 'var(--blue-primary)' : undefined }}>
              {pendingLogs}
            </span>
            <span className="text-small">ожидают парсинга</span>
          </div>
        </div>
        <div className="panel">
          <h2>Отчётов</h2>
          <div className="kpi-value">
            <span className="text-large" style={{ color: 'var(--blue-primary)' }}>{reportsCount}</span>
            <span className="text-small">сгенерировано</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: '0 20px' }}>
        <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); reagents.clearMessages(); }}
              style={{
                padding: '12px 18px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--blue-primary, #2563eb)' : '2px solid transparent',
                background: 'none',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--blue-primary, #2563eb)' : 'inherit',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <InventoryPanel
          reagentInventory={reagents.reagentInventory}
          consumableInventory={reagents.consumableInventory}
          analyzers={reagents.analyzers}
          loading={reagents.loading}
          isAdmin={isAdmin}
          onSaveReagent={reagents.handleUpsertReagentInventory}
          onDeleteReagent={reagents.handleDeleteReagentInventory}
          onSaveConsumable={reagents.handleUpsertConsumableInventory}
          onDeleteConsumable={reagents.handleDeleteConsumableInventory}
          onRefresh={() => { reagents.loadReagentInventory(); reagents.loadConsumableInventory(); }}
        />
      )}

      {activeTab === 'analyzers' && (
        <AnalyzerRatesPanel
          analyzers={reagents.analyzers}
          rates={reagents.selectedAnalyzerRates}
          loading={reagents.loading}
          isAdmin={isAdmin}
          onLoadRates={reagents.loadAnalyzerRates}
          onSaveAnalyzer={reagents.handleUpsertAnalyzer}
          onDeleteAnalyzer={reagents.handleDeleteAnalyzer}
          onSaveRate={reagents.handleUpsertRate}
          onDeleteRate={reagents.handleDeleteRate}
          onRefresh={reagents.loadAnalyzers}
        />
      )}

      {activeTab === 'logs' && (
        <LogUploadsPanel
          analyzers={reagents.analyzers}
          logUploads={reagents.logUploads}
          parsedSamples={reagents.parsedSamples}
          loading={reagents.loading}
          isAdmin={isAdmin}
          onUpload={reagents.handleUploadLog}
          onParse={reagents.handleParseLog}
          onLoadSamples={reagents.loadParsedSamples}
          onRefresh={reagents.loadLogUploads}
        />
      )}

      {activeTab === 'reports' && (
        <ReagentReportsPanel
          analyzers={reagents.analyzers}
          reports={reagents.consumptionReports}
          loading={reagents.loading}
          isAdmin={isAdmin}
          onGenerate={reagents.handleGenerateReport}
          onRefresh={reagents.loadConsumptionReports}
        />
      )}
    </>
  );
}

export default ReagentsPage;

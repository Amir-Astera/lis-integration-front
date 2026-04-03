import { apiRequest } from '../lib/api';

// =====================================================================
// Analyzer Catalog API
// =====================================================================

export async function fetchAnalyzers(token, activeOnly = false) {
  return apiRequest(`/api/reagents/analyzers?activeOnly=${activeOnly}`, { method: 'GET' }, token);
}

export async function fetchAnalyzer(token, analyzerId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}`, { method: 'GET' }, token);
}

export async function fetchAnalyzerRates(token, analyzerId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/rates`, { method: 'GET' }, token);
}

export async function upsertAnalyzer(token, analyzerId, payload) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function upsertAnalyzerRate(token, analyzerId, rateId, payload) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/rates/${rateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAnalyzer(token, analyzerId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}`, { method: 'DELETE' }, token);
}

export async function deleteAnalyzerRate(token, analyzerId, rateId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/rates/${rateId}`, { method: 'DELETE' }, token);
}

// =====================================================================
// Inventory API
// =====================================================================

export async function fetchReagentInventory(token, analyzerId = null, status = null) {
  const params = new URLSearchParams();
  if (analyzerId) params.append('analyzerId', analyzerId);
  if (status) params.append('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/reagents/inventory/reagents${query}`, { method: 'GET' }, token);
}

export async function fetchReagentInventoryItem(token, inventoryId) {
  return apiRequest(`/api/reagents/inventory/reagents/${inventoryId}`, { method: 'GET' }, token);
}

export async function upsertReagentInventory(token, inventoryId, payload) {
  return apiRequest(`/api/reagents/inventory/reagents/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteReagentInventory(token, inventoryId) {
  return apiRequest(`/api/reagents/inventory/reagents/${inventoryId}`, { method: 'DELETE' }, token);
}

export async function fetchConsumableInventory(token, category = null) {
  const query = category ? `?category=${category}` : '';
  return apiRequest(`/api/reagents/inventory/consumables${query}`, { method: 'GET' }, token);
}

export async function fetchConsumableInventoryItem(token, inventoryId) {
  return apiRequest(`/api/reagents/inventory/consumables/${inventoryId}`, { method: 'GET' }, token);
}

export async function upsertConsumableInventory(token, inventoryId, payload) {
  return apiRequest(`/api/reagents/inventory/consumables/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteConsumableInventory(token, inventoryId) {
  return apiRequest(`/api/reagents/inventory/consumables/${inventoryId}`, { method: 'DELETE' }, token);
}

// =====================================================================
// Log Upload API
// =====================================================================

export async function fetchLogUploads(token, analyzerId = null) {
  const query = analyzerId ? `?analyzerId=${analyzerId}` : '';
  return apiRequest(`/api/reagents/log-uploads${query}`, { method: 'GET' }, token);
}

export async function fetchLogUpload(token, uploadId) {
  return apiRequest(`/api/reagents/log-uploads/${uploadId}`, { method: 'GET' }, token);
}

export async function uploadAnalyzerLog(token, analyzerId, sourceType, file) {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams();
  if (analyzerId) params.append('analyzerId', analyzerId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/reagents/log-uploads/manual/${sourceType}${query}`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function parseAnalyzerLog(token, uploadId) {
  return apiRequest(`/api/reagents/log-uploads/${uploadId}/parse`, { method: 'POST' }, token);
}

export async function fetchParsedSamples(token, uploadId) {
  return apiRequest(`/api/reagents/log-uploads/${uploadId}/samples`, { method: 'GET' }, token);
}

// =====================================================================
// Consumption Reports API
// =====================================================================

export async function fetchConsumptionReports(token, analyzerId = null) {
  const query = analyzerId ? `?analyzerId=${analyzerId}` : '';
  return apiRequest(`/api/reagents/reports${query}`, { method: 'GET' }, token);
}

export async function fetchConsumptionReport(token, reportId) {
  return apiRequest(`/api/reagents/reports/${reportId}`, { method: 'GET' }, token);
}

export async function generateConsumptionReport(token, payload) {
  return apiRequest('/api/reagents/reports/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

// =====================================================================
// Damumed Report Consumption API (NEW)
// =====================================================================

export async function calculateDamumedConsumption(token, payload) {
  return apiRequest('/api/reagents/reports/damumed-calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchDamumedConsumption(token, uploadId) {
  return apiRequest(`/api/reagents/reports/damumed-consumption/${uploadId}`, { method: 'GET' }, token);
}

export async function recalculateDamumedConsumption(token, uploadId) {
  return apiRequest(`/api/reagents/reports/damumed-recalculate/${uploadId}`, { method: 'POST' }, token);
}

// =====================================================================
// Service Reagent Norms API (NEW)
// =====================================================================

export async function fetchServiceReagentNorms(token) {
  return apiRequest('/api/reagents/service-norms', { method: 'GET' }, token);
}

export async function fetchServiceReagentNorm(token, normId) {
  return apiRequest(`/api/reagents/service-norms/${normId}`, { method: 'GET' }, token);
}

export async function createServiceReagentNorm(token, payload) {
  return apiRequest('/api/reagents/service-norms', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateServiceReagentNorm(token, normId, payload) {
  return apiRequest(`/api/reagents/service-norms/${normId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteServiceReagentNorm(token, normId) {
  return apiRequest(`/api/reagents/service-norms/${normId}`, { method: 'DELETE' }, token);
}

// =====================================================================
// Service-to-Analyzer Mappings API (NEW)
// =====================================================================

export async function fetchServiceMappings(token) {
  return apiRequest('/api/reagents/service-mappings', { method: 'GET' }, token);
}

export async function createServiceMapping(token, payload) {
  return apiRequest('/api/reagents/service-mappings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateServiceMapping(token, mappingId, payload) {
  return apiRequest(`/api/reagents/service-mappings/${mappingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteServiceMapping(token, mappingId) {
  return apiRequest(`/api/reagents/service-mappings/${mappingId}`, { method: 'DELETE' }, token);
}

export async function findMatchingAnalyzer(token, serviceName, category = null) {
  const params = new URLSearchParams();
  params.append('serviceName', serviceName);
  if (category) params.append('category', category);
  return apiRequest(`/api/reagents/service-mappings/match?${params.toString()}`, { method: 'GET' }, token);
}

// =====================================================================
// Analyzer Reagent Links API
// =====================================================================

export async function fetchAnalyzerReagentLinks(token, analyzerId, activeOnly = false) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links?activeOnly=${activeOnly}`, { method: 'GET' }, token);
}

export async function fetchAnalyzerReagentSummary(token, analyzerId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links/summary`, { method: 'GET' }, token);
}

export async function createAnalyzerReagentLink(token, analyzerId, payload) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAnalyzerReagentLink(token, analyzerId, linkId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links/${linkId}`, { method: 'DELETE' }, token);
}

export async function toggleAnalyzerReagentLink(token, analyzerId, linkId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links/${linkId}/toggle`, { method: 'POST' }, token);
}

export async function autoPopulateAnalyzerReagentLinks(token, analyzerId) {
  return apiRequest(`/api/reagents/analyzers/${analyzerId}/reagent-links/auto-populate`, { method: 'POST' }, token);
}

// =====================================================================
// Log Analytics API
// =====================================================================

export async function fetchLogAnalytics(token, { period = 'WEEK', analyzerId = null, referenceDate = null, dateFrom = null, dateTo = null } = {}) {
  const params = new URLSearchParams();
  params.append('period', period);
  if (analyzerId) params.append('analyzerId', analyzerId);
  if (referenceDate) params.append('referenceDate', referenceDate);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  return apiRequest(`/api/reagents/log-analytics?${params.toString()}`, { method: 'GET' }, token);
}

export async function rebuildLogAnomalies(token, logUploadId) {
  return apiRequest(`/api/reagents/log-analytics/rebuild/${logUploadId}`, { method: 'POST' }, token);
}

// =====================================================================
// Warehouse Movements API
// =====================================================================

export async function fetchWarehouseSummary(token) {
  return apiRequest('/api/reagents/warehouse/summary', { method: 'GET' }, token);
}

export async function fetchWarehouseMovements(token, { from = null, to = null } = {}) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/reagents/warehouse/movements${query}`, { method: 'GET' }, token);
}

export async function fetchWarehouseMovementsByReagent(token, reagentId) {
  return apiRequest(`/api/reagents/warehouse/movements/reagent/${reagentId}`, { method: 'GET' }, token);
}

export async function fetchWarehouseMovementsByConsumable(token, consumableId) {
  return apiRequest(`/api/reagents/warehouse/movements/consumable/${consumableId}`, { method: 'GET' }, token);
}

export async function createWarehouseMovement(token, payload) {
  return apiRequest('/api/reagents/warehouse/movements', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteWarehouseMovement(token, movementId) {
  return apiRequest(`/api/reagents/warehouse/movements/${movementId}`, { method: 'DELETE' }, token);
}

export async function fetchWarehouseLowStock(token) {
  return apiRequest('/api/reagents/warehouse/alerts/low-stock', { method: 'GET' }, token);
}

export async function fetchWarehouseExpiryWarnings(token) {
  return apiRequest('/api/reagents/warehouse/alerts/expiry', { method: 'GET' }, token);
}

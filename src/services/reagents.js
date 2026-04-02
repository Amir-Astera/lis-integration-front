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

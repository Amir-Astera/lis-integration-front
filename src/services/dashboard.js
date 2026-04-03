import { apiRequest } from '../lib/api';

// =====================================================================
// Operational Overview (cached snapshot)
// =====================================================================

export async function fetchOperationalOverview(token, refresh = false) {
  return apiRequest(`/api/damumed-reports/operational-overview?refresh=${refresh}`, { method: 'GET' }, token);
}

// =====================================================================
// Dashboard KPI / TAT / Stats (fast endpoints, period-aware)
// =====================================================================

export async function fetchDashboardFull(token, refresh = false) {
  return apiRequest(`/api/damumed-dashboard/full?refresh=${refresh}`, { method: 'GET' }, token);
}

export async function fetchDashboardKpi(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/kpi?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardTat(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/tat?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardDailyStats(token) {
  return apiRequest('/api/damumed-dashboard/daily-stats', { method: 'GET' }, token);
}

export async function fetchDashboardWorkplaces(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/workplaces?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardDepartmentLoads(token) {
  return apiRequest('/api/damumed-dashboard/department-loads', { method: 'GET' }, token);
}

// =====================================================================
// Report Uploads
// =====================================================================

export async function fetchUploads(token, reportKind = null) {
  const query = reportKind ? `?reportKind=${reportKind}` : '';
  return apiRequest(`/api/damumed-reports/uploads${query}`, { method: 'GET' }, token);
}

export async function uploadDamumedReport(token, reportKind, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/damumed-reports/uploads/manual/${reportKind}`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function normalizeUpload(token, uploadId) {
  return apiRequest(`/api/damumed-reports/uploads/${uploadId}/normalize`, { method: 'POST' }, token);
}

// =====================================================================
// Processed Views
// =====================================================================

export async function fetchWorkplaceProcessedView(token, uploadId) {
  return apiRequest(`/api/damumed-reports/uploads/${uploadId}/workplace-processed-view`, { method: 'GET' }, token);
}

export async function fetchReferralCountByMaterialProcessedView(token, uploadId) {
  return apiRequest(`/api/damumed-reports/uploads/${uploadId}/referral-count-by-material-processed-view`, { method: 'GET' }, token);
}

// =====================================================================
// Summary Reports
// =====================================================================

export async function fetchReferralRegistrationSummary(token) {
  return apiRequest('/api/damumed-reports/referral-registration-summary', { method: 'GET' }, token);
}

export async function fetchWorkplaceDetailReport(token) {
  return apiRequest('/api/damumed-reports/workplace-detail-report', { method: 'GET' }, token);
}

// =====================================================================
// Source Mode
// =====================================================================

export async function fetchSourceMode(token) {
  return apiRequest('/api/damumed-reports/source-mode', { method: 'GET' }, token);
}

export async function updateSourceMode(token, mode) {
  return apiRequest('/api/damumed-reports/source-mode', {
    method: 'PUT',
    body: JSON.stringify({ mode }),
  }, token);
}

// =====================================================================
// Report Kinds
// =====================================================================

export async function fetchReportKinds(token) {
  return apiRequest('/api/damumed-reports/report-kinds', { method: 'GET' }, token);
}

// =====================================================================
// Users & Authorities (admin)
// =====================================================================

export async function fetchUsers(token) {
  return apiRequest('/api/users', { method: 'GET' }, token);
}

export async function createUser(token, payload) {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchAuthorities(token) {
  return apiRequest('/api/authorities', { method: 'GET' }, token);
}

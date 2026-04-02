import { apiRequest } from '../lib/api';

export async function fetchAuthorities(token) {
  return apiRequest('/api/authorities', { method: 'GET' }, token);
}

export async function fetchUploads(token) {
  return apiRequest('/api/damumed-reports/uploads', { method: 'GET' }, token);
}

export async function fetchOperationalOverview(token) {
  return apiRequest('/api/damumed-reports/operational-overview', { method: 'GET' }, token);
}

export async function fetchReferralRegistrationSummary(token) {
  return apiRequest('/api/damumed-reports/referral-registration-summary', { method: 'GET' }, token);
}

// Optimized dashboard endpoints
export async function fetchDashboardKpi(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/kpi?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardTat(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/tat?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardWorkplaces(token, period = 'month') {
  return apiRequest(`/api/damumed-dashboard/workplaces?period=${period}`, { method: 'GET' }, token);
}

export async function fetchDashboardAnalyzers(token) {
  return apiRequest('/api/damumed-dashboard/analyzers', { method: 'GET' }, token);
}

export async function fetchDashboardWarehouse(token) {
  return apiRequest('/api/damumed-dashboard/warehouse', { method: 'GET' }, token);
}

export async function fetchDashboardDailyStats(token) {
  return apiRequest('/api/damumed-dashboard/daily-stats', { method: 'GET' }, token);
}

export async function fetchDashboardDepartmentLoads(token) {
  return apiRequest('/api/damumed-dashboard/department-loads', { method: 'GET' }, token);
}

export async function fetchWorkplaceProcessedView(token, uploadId) {
  return apiRequest(`/api/damumed-reports/uploads/${uploadId}/workplace-processed-view`, { method: 'GET' }, token);
}

export async function fetchReferralCountByMaterialProcessedView(token, uploadId) {
  return apiRequest(`/api/damumed-reports/uploads/${uploadId}/referral-count-by-material-processed-view`, { method: 'GET' }, token);
}

export async function fetchWorkplaceDetailReport(token) {
  return apiRequest('/api/damumed-reports/workplace-detail-report', { method: 'GET' }, token);
}

export async function fetchUsers(token) {
  const response = await apiRequest('/api/users/getAll?page=0&size=50', { method: 'GET' }, token);
  return response?.content || [];
}

export async function fetchSourceMode(token) {
  return apiRequest('/api/damumed-reports/source-mode', { method: 'GET' }, token);
}

export async function updateSourceMode(token, mode) {
  return apiRequest('/api/damumed-reports/source-mode', {
    method: 'PUT',
    body: JSON.stringify({ mode }),
  }, token);
}

export async function createUser(token, payload) {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function uploadDamumedReport(token, reportKind, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/damumed-reports/uploads/manual/${reportKind}`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function fetchReportKinds(token) {
  return apiRequest('/api/damumed-reports/report-kinds', { method: 'GET' }, token);
}

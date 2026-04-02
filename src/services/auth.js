import { apiRequest, encodeBasicAuth } from '../lib/api';

export async function loginWithBasicAuth(email, password) {
  return apiRequest('/auth', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodeBasicAuth(email, password)}`,
    },
  });
}

export async function fetchCurrentUser(token) {
  return apiRequest('/api/users/current', { method: 'GET' }, token);
}

export async function fetchCurrentSession(token) {
  return apiRequest('/auth/me', { method: 'POST' }, token);
}

export async function logoutSession(token) {
  return apiRequest('/logout', { method: 'POST' }, token);
}

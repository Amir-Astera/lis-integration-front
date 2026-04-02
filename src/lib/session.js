const TOKEN_KEY = 'lims_access_token';

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function storeToken(token) {
  if (!token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

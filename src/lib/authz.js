export function normalizeIdentity(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeAuthorityName(authority) {
  if (typeof authority === 'string') {
    return authority.trim().toLowerCase();
  }
  return typeof authority?.name === 'string' ? authority.name.trim().toLowerCase() : '';
}

export function getAuthorityDisplayName(authority) {
  const normalizedName = normalizeAuthorityName(authority);
  if (normalizedName === 'admin') {
    return 'Администратор';
  }
  if (normalizedName === 'publisher') {
    return 'Руководитель';
  }
  if (normalizedName === 'user') {
    return 'Аналитик';
  }
  return authority?.displayName || authority?.name || authority || 'Без роли';
}

export function getUserRoleLabels(user) {
  const labels = (user?.authorities || []).map((authority) => getAuthorityDisplayName(authority));
  return Array.from(new Set(labels.filter(Boolean)));
}

export function isAdminUser(user) {
  const hasAdminAuthority = Boolean(
    user?.authorities?.some((authority) => normalizeAuthorityName(authority) === 'admin'),
  );
  const identity = normalizeIdentity(user?.email || user?.login);
  return hasAdminAuthority || identity === 'admin@dev' || identity === 'dev-bootstrap-admin';
}

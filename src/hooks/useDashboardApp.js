import { useEffect, useMemo, useState } from 'react';
import { isAdminUser } from '../lib/authz';
import { getDisplayErrorMessage, isUnauthorizedError } from '../lib/api';
import { clearToken, getStoredToken, storeToken } from '../lib/session';
import { fetchCurrentSession, fetchCurrentUser, loginWithBasicAuth, logoutSession } from '../services/auth';
import {
  createUser,
  fetchAuthorities,
  fetchOperationalOverview,
  fetchReferralCountByMaterialProcessedView,
  fetchReferralRegistrationSummary,
  fetchReportKinds,
  fetchSourceMode,
  fetchUploads,
  fetchUsers,
  fetchWorkplaceDetailReport,
  fetchWorkplaceProcessedView,
  updateSourceMode,
  uploadDamumedReport,
} from '../services/dashboard';

const initialUserForm = {
  name: '',
  surname: '',
  login: '',
  email: '',
  phone: '',
  password: '',
  authorityIds: [],
};

export function useDashboardApp() {
  const [token, setToken] = useState(() => getStoredToken());
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [operationalOverview, setOperationalOverview] = useState(null);
  const [referralRegistrationSummary, setReferralRegistrationSummary] = useState(null);
  const [workplaceProcessedView, setWorkplaceProcessedView] = useState(null);
  const [materialProcessedView, setMaterialProcessedView] = useState(null);
  const [workplaceDetailReport, setWorkplaceDetailReport] = useState(null);
  const [reportKinds, setReportKinds] = useState([]);
  const [sourceMode, setSourceMode] = useState('MANUAL');
  const [userForm, setUserForm] = useState(initialUserForm);
  const [fileMap, setFileMap] = useState({});

  const isAdmin = useMemo(() => isAdminUser(currentUser), [currentUser]);

  function resetSessionState(message = '') {
    clearToken();
    setToken('');
    setCurrentUser(null);
    setUsersData([]);
    setAuthorities([]);
    setUploads([]);
    setOperationalOverview(null);
    setReferralRegistrationSummary(null);
    setWorkplaceProcessedView(null);
    setMaterialProcessedView(null);
    setWorkplaceDetailReport(null);
    setReportKinds([]);
    setSourceMode('MANUAL');
    setFileMap({});
    setUserForm(initialUserForm);
    setLoginError('');
    setGlobalError(message);
  }

  function handleProtectedError(error, fallbackMessage) {
    if (isUnauthorizedError(error)) {
      resetSessionState('Сессия истекла или доступ был отозван. Войдите снова.');
      return true;
    }
    setGlobalError(getDisplayErrorMessage(error, fallbackMessage));
    return false;
  }

  useEffect(() => {
    if (!token) {
      return;
    }
    setBootstrapping(true);
    bootstrap(token)
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          resetSessionState('Сессия истекла или недействительна. Войдите снова.');
          return;
        }
        setGlobalError(getDisplayErrorMessage(error, 'Не удалось загрузить данные с backend.'));
      })
      .finally(() => setBootstrapping(false));
  }, [token]);

  async function bootstrap(accessToken) {
    setGlobalError('');
    const user = await fetchCurrentUser(accessToken).catch(async () => {
      const session = await fetchCurrentSession(accessToken);
      const email = session?.email || '';
      return {
        id: email || 'current-session',
        name: email || 'Пользователь',
        email,
        login: email,
        phone: null,
        authorities: [],
      };
    });
    setCurrentUser(user);
    const admin = isAdminUser(user);

    const [authorityList, uploadList, overview, referralSummary, workplaceDetail] = await Promise.all([
      fetchAuthorities(accessToken),
      fetchUploads(accessToken),
      fetchOperationalOverview(accessToken),
      fetchReferralRegistrationSummary(accessToken).catch(() => null),
      admin ? fetchWorkplaceDetailReport(accessToken).catch(() => null) : null,
    ]);

    setAuthorities(authorityList || []);
    setUploads(uploadList || []);
    setOperationalOverview(overview || null);
    setReferralRegistrationSummary(referralSummary || null);
    setWorkplaceDetailReport(workplaceDetail || null);

    // Fetch processed views if we have uploads
    if (admin) {
      const normalizedUploads = uploadList?.filter(u => u.normalizationStatus === 'NORMALIZED') || [];
      const workplaceUpload = normalizedUploads
        .filter(u => u.reportKind === 'WORKPLACE_COMPLETED_STUDIES')
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
      const materialUpload = normalizedUploads
        .filter(u => u.reportKind === 'REFERRAL_COUNT_BY_MATERIAL')
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

      const [workplaceView, materialView] = await Promise.all([
        workplaceUpload ? fetchWorkplaceProcessedView(accessToken, workplaceUpload.id).catch(() => null) : null,
        materialUpload ? fetchReferralCountByMaterialProcessedView(accessToken, materialUpload.id).catch(() => null) : null,
      ]);

      setWorkplaceProcessedView(workplaceView);
      setMaterialProcessedView(materialView);
    } else {
      setWorkplaceProcessedView(null);
      setMaterialProcessedView(null);
    }

    if (admin) {
      const [usersResponse, modeResponse, reportKindList] = await Promise.all([
        fetchUsers(accessToken),
        fetchSourceMode(accessToken),
        fetchReportKinds(accessToken),
      ]);
      setUsersData(usersResponse || []);
      setSourceMode(modeResponse?.mode || 'MANUAL');
      setReportKinds(reportKindList || []);
    } else {
      setUsersData([]);
      setReportKinds([]);
      setSourceMode('MANUAL');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setLoginError('');
    setSuccessMessage('');
    try {
      const response = await loginWithBasicAuth(authForm.email.trim(), authForm.password);
      const accessToken = response?.access_token || '';
      if (!accessToken) {
        throw new Error('Backend не вернул access token.');
      }
      storeToken(accessToken);
      setToken(accessToken);
    } catch (error) {
      setLoginError(getDisplayErrorMessage(error, 'Не удалось выполнить вход. Проверьте логин и пароль.'));
    } finally {
      setAuthForm((prev) => ({ ...prev, password: '' }));
      setLoading(false);
    }
  }

  async function handleLogout() {
    const accessToken = token;
    resetSessionState('');
    setSuccessMessage('Вы вышли из системы.');
    if (accessToken) {
      await logoutSession(accessToken).catch(() => {});
    }
  }

  async function refreshUploads() {
    try {
      const [uploadList, overview, referralSummary] = await Promise.all([
        fetchUploads(token),
        fetchOperationalOverview(token),
        fetchReferralRegistrationSummary(token).catch(() => null),
      ]);
      setUploads(uploadList || []);
      setOperationalOverview(overview || null);
      setReferralRegistrationSummary(referralSummary || null);

      if (isAdmin) {
        const normalizedUploads = uploadList?.filter(u => u.normalizationStatus === 'NORMALIZED') || [];
        const workplaceUpload = normalizedUploads
          .filter(u => u.reportKind === 'WORKPLACE_COMPLETED_STUDIES')
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
        const materialUpload = normalizedUploads
          .filter(u => u.reportKind === 'REFERRAL_COUNT_BY_MATERIAL')
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

        const [workplaceView, materialView] = await Promise.all([
          workplaceUpload ? fetchWorkplaceProcessedView(token, workplaceUpload.id).catch(() => null) : null,
          materialUpload ? fetchReferralCountByMaterialProcessedView(token, materialUpload.id).catch(() => null) : null,
        ]);

        setWorkplaceProcessedView(workplaceView);
        setMaterialProcessedView(materialView);
        const detailReport = await fetchWorkplaceDetailReport(token).catch(() => null);
        setWorkplaceDetailReport(detailReport);
      } else {
        setWorkplaceProcessedView(null);
        setMaterialProcessedView(null);
        setWorkplaceDetailReport(null);
      }
    } catch (error) {
      handleProtectedError(error, 'Не удалось обновить список загрузок.');
    }
  }

  async function refreshAdminData() {
    if (!isAdmin) {
      return;
    }
    try {
      const [usersResponse, authorityList, modeResponse, reportKindList] = await Promise.all([
        fetchUsers(token),
        fetchAuthorities(token),
        fetchSourceMode(token),
        fetchReportKinds(token),
      ]);
      setUsersData(usersResponse || []);
      setAuthorities(authorityList || []);
      setSourceMode(modeResponse?.mode || 'MANUAL');
      setReportKinds(reportKindList || []);
    } catch (error) {
      handleProtectedError(error, 'Не удалось обновить данные админ-панели.');
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setGlobalError('');
    setSuccessMessage('');
    try {
      await createUser(token, {
        ...userForm,
        login: userForm.login || null,
        surname: userForm.surname || null,
        authorityIds: userForm.authorityIds,
      });
      setUserForm(initialUserForm);
      setSuccessMessage('Аккаунт создан.');
      await refreshAdminData();
    } catch (error) {
      handleProtectedError(error, 'Не удалось создать аккаунт.');
    }
  }

  async function handleSourceModeChange(event) {
    const nextMode = event.target.value;
    setGlobalError('');
    setSuccessMessage('');
    try {
      const response = await updateSourceMode(token, nextMode);
      setSourceMode(response?.mode || nextMode);
      setSuccessMessage('Режим источника обновлен.');
    } catch (error) {
      handleProtectedError(error, 'Не удалось обновить режим источника.');
    }
  }

  async function handleUpload(reportKind) {
    const file = fileMap[reportKind];
    if (!file) {
      setGlobalError('Выберите файл перед загрузкой.');
      return;
    }
    setGlobalError('');
    setSuccessMessage('');
    try {
      await uploadDamumedReport(token, reportKind, file);
      setSuccessMessage(`Отчет ${reportKind} загружен.`);
      setFileMap((prev) => ({ ...prev, [reportKind]: null }));
      await refreshUploads();
    } catch (error) {
      handleProtectedError(error, 'Не удалось загрузить отчет.');
    }
  }

  function toggleAuthority(authorityId) {
    setUserForm((prev) => ({
      ...prev,
      authorityIds: prev.authorityIds.includes(authorityId)
        ? prev.authorityIds.filter((item) => item !== authorityId)
        : [...prev.authorityIds, authorityId],
    }));
  }

  function handleAuthFormChange(field, value) {
    setLoginError('');
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(reportKind, file) {
    setFileMap((prev) => ({ ...prev, [reportKind]: file }));
  }

  return {
    token,
    authForm,
    loginError,
    globalError,
    successMessage,
    loading,
    bootstrapping,
    currentUser,
    usersData,
    authorities,
    uploads,
    operationalOverview,
    referralRegistrationSummary,
    workplaceProcessedView,
    materialProcessedView,
    workplaceDetailReport,
    reportKinds,
    sourceMode,
    userForm,
    fileMap,
    isAdmin,
    setUserForm,
    handleLogin,
    handleLogout,
    refreshUploads,
    refreshAdminData,
    handleCreateUser,
    handleSourceModeChange,
    handleUpload,
    toggleAuthority,
    handleAuthFormChange,
    handleFileChange,
  };
}

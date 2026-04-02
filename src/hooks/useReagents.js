import { useCallback, useEffect, useState } from 'react';
import { getDisplayErrorMessage, isUnauthorizedError } from '../lib/api';
import {
  calculateDamumedConsumption,
  createServiceMapping,
  createServiceReagentNorm,
  deleteAnalyzer,
  deleteAnalyzerRate,
  deleteConsumableInventory,
  deleteReagentInventory,
  deleteServiceMapping,
  deleteServiceReagentNorm,
  fetchAnalyzerRates,
  fetchAnalyzers,
  fetchConsumableInventory,
  fetchConsumptionReports,
  fetchDamumedConsumption,
  fetchLogUploads,
  fetchParsedSamples,
  fetchReagentInventory,
  fetchServiceMappings,
  fetchServiceReagentNorms,
  generateConsumptionReport,
  parseAnalyzerLog,
  recalculateDamumedConsumption,
  updateServiceMapping,
  updateServiceReagentNorm,
  uploadAnalyzerLog,
  upsertAnalyzer,
  upsertAnalyzerRate,
  upsertConsumableInventory,
  upsertReagentInventory,
} from '../services/reagents';

export function useReagents(token, isAdmin, onUnauthorized) {
  const [analyzers, setAnalyzers] = useState([]);
  const [selectedAnalyzerRates, setSelectedAnalyzerRates] = useState([]);
  const [reagentInventory, setReagentInventory] = useState([]);
  const [consumableInventory, setConsumableInventory] = useState([]);
  const [logUploads, setLogUploads] = useState([]);
  const [parsedSamples, setParsedSamples] = useState([]);
  const [consumptionReports, setConsumptionReports] = useState([]);
  const [serviceReagentNorms, setServiceReagentNorms] = useState([]);
  const [serviceMappings, setServiceMappings] = useState([]);
  const [damumedConsumption, setDamumedConsumption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleError(err, fallback) {
    if (isUnauthorizedError(err)) {
      onUnauthorized?.();
      return;
    }
    setError(getDisplayErrorMessage(err, fallback));
  }

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  const loadAnalyzers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchAnalyzers(token);
      setAnalyzers(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить анализаторы.');
    }
  }, [token]);

  const loadReagentInventory = useCallback(async (analyzerId = null) => {
    if (!token) return;
    try {
      const data = await fetchReagentInventory(token, analyzerId);
      setReagentInventory(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить склад реагентов.');
    }
  }, [token]);

  const loadConsumableInventory = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchConsumableInventory(token);
      setConsumableInventory(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить склад расходников.');
    }
  }, [token]);

  const loadLogUploads = useCallback(async () => {
    if (!token || !isAdmin) {
      setLogUploads([]);
      return;
    }
    try {
      const data = await fetchLogUploads(token);
      setLogUploads(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить журнал загрузок.');
    }
  }, [token, isAdmin]);

  const loadConsumptionReports = useCallback(async (analyzerId = null) => {
    if (!token || !isAdmin) {
      setConsumptionReports([]);
      return;
    }
    try {
      const data = await fetchConsumptionReports(token, analyzerId);
      setConsumptionReports(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить отчёты расхода.');
    }
  }, [token, isAdmin]);

  const loadServiceReagentNorms = useCallback(async () => {
    if (!token || !isAdmin) {
      setServiceReagentNorms([]);
      return;
    }
    try {
      const data = await fetchServiceReagentNorms(token);
      setServiceReagentNorms(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить нормы расхода по услугам.');
    }
  }, [token, isAdmin]);

  const loadServiceMappings = useCallback(async () => {
    if (!token || !isAdmin) {
      setServiceMappings([]);
      return;
    }
    try {
      const data = await fetchServiceMappings(token);
      setServiceMappings(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить маппинги услуг.');
    }
  }, [token, isAdmin]);

  const loadDamumedConsumption = useCallback(async (uploadId) => {
    if (!token || !isAdmin || !uploadId) {
      setDamumedConsumption(null);
      return;
    }
    try {
      const data = await fetchDamumedConsumption(token, uploadId);
      setDamumedConsumption(data || null);
    } catch (err) {
      handleError(err, 'Не удалось загрузить расчёт потребления.');
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token) return;
    loadAnalyzers();
    loadReagentInventory();
    loadConsumableInventory();
    if (isAdmin) {
      loadLogUploads();
      loadConsumptionReports();
      loadServiceReagentNorms();
      loadServiceMappings();
    } else {
      setLogUploads([]);
      setConsumptionReports([]);
      setServiceReagentNorms([]);
      setServiceMappings([]);
    }
  }, [token, isAdmin, loadAnalyzers, loadReagentInventory, loadConsumableInventory, loadLogUploads, loadConsumptionReports, loadServiceReagentNorms, loadServiceMappings]);

  async function loadAnalyzerRates(analyzerId) {
    clearMessages();
    try {
      const data = await fetchAnalyzerRates(token, analyzerId);
      setSelectedAnalyzerRates(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить нормы реагентов.');
    }
  }

  async function loadParsedSamples(uploadId) {
    if (!isAdmin) {
      setParsedSamples([]);
      return;
    }
    clearMessages();
    try {
      const data = await fetchParsedSamples(token, uploadId);
      setParsedSamples(data || []);
    } catch (err) {
      handleError(err, 'Не удалось загрузить образцы.');
    }
  }

  async function handleUpsertAnalyzer(analyzerId, payload) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await upsertAnalyzer(token, analyzerId, payload);
      setSuccess('Анализатор сохранён.');
      await loadAnalyzers();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось сохранить анализатор.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAnalyzer(analyzerId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteAnalyzer(token, analyzerId);
      setSuccess('Анализатор удалён.');
      await loadAnalyzers();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить анализатор.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpsertRate(analyzerId, rateId, payload) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await upsertAnalyzerRate(token, analyzerId, rateId, payload);
      setSuccess('Норма реагента сохранена.');
      await loadAnalyzerRates(analyzerId);
      return true;
    } catch (err) {
      handleError(err, 'Не удалось сохранить норму реагента.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRate(analyzerId, rateId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteAnalyzerRate(token, analyzerId, rateId);
      setSuccess('Норма удалена.');
      await loadAnalyzerRates(analyzerId);
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить норму реагента.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpsertReagentInventory(inventoryId, payload) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await upsertReagentInventory(token, inventoryId, payload);
      setSuccess('Запись склада сохранена.');
      await loadReagentInventory();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось сохранить запись склада.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReagentInventory(inventoryId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteReagentInventory(token, inventoryId);
      setSuccess('Запись удалена.');
      await loadReagentInventory();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить запись склада.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpsertConsumableInventory(inventoryId, payload) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await upsertConsumableInventory(token, inventoryId, payload);
      setSuccess('Расходник сохранён.');
      await loadConsumableInventory();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось сохранить расходник.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConsumableInventory(inventoryId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteConsumableInventory(token, inventoryId);
      setSuccess('Расходник удалён.');
      await loadConsumableInventory();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить расходник.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadLog(analyzerId, sourceType, file) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await uploadAnalyzerLog(token, analyzerId, sourceType, file);
      setSuccess('Лог загружен. Нажмите "Разобрать" для парсинга.');
      await loadLogUploads();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось загрузить лог.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleParseLog(uploadId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await parseAnalyzerLog(token, uploadId);
      setSuccess('Лог успешно разобран.');
      await loadLogUploads();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось разобрать лог.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport(payload) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await generateConsumptionReport(token, payload);
      setSuccess('Отчёт расхода сгенерирован.');
      await loadConsumptionReports();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось сгенерировать отчёт.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Damumed consumption handlers
  async function handleCalculateDamumedConsumption(uploadId, categoryFilter = null, overrides = null) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await calculateDamumedConsumption(token, {
        uploadId,
        serviceCategoryFilter: categoryFilter,
        overrideAnalyzerMappings: overrides,
      });
      setSuccess('Расчёт потребления выполнен.');
      setDamumedConsumption(result);
      return result;
    } catch (err) {
      handleError(err, 'Не удалось рассчитать потребление.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculateDamumedConsumption(uploadId) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await recalculateDamumedConsumption(token, uploadId);
      setSuccess('Расчёт потребления пересчитан.');
      setDamumedConsumption(result);
      return result;
    } catch (err) {
      handleError(err, 'Не удалось пересчитать потребление.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Service reagent norm handlers
  async function handleCreateServiceNorm(payload) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await createServiceReagentNorm(token, payload);
      setSuccess('Норма расхода создана.');
      await loadServiceReagentNorms();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось создать норму расхода.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateServiceNorm(normId, payload) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await updateServiceReagentNorm(token, normId, payload);
      setSuccess('Норма расхода обновлена.');
      await loadServiceReagentNorms();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось обновить норму расхода.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteServiceNorm(normId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteServiceReagentNorm(token, normId);
      setSuccess('Норма расхода удалена.');
      await loadServiceReagentNorms();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить норму расхода.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Service mapping handlers
  async function handleCreateServiceMapping(payload) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await createServiceMapping(token, payload);
      setSuccess('Маппинг создан.');
      await loadServiceMappings();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось создать маппинг.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateServiceMapping(mappingId, payload) {
    if (!isAdmin) return null;
    clearMessages();
    setLoading(true);
    try {
      const result = await updateServiceMapping(token, mappingId, payload);
      setSuccess('Маппинг обновлён.');
      await loadServiceMappings();
      return result;
    } catch (err) {
      handleError(err, 'Не удалось обновить маппинг.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteServiceMapping(mappingId) {
    if (!isAdmin) return false;
    clearMessages();
    setLoading(true);
    try {
      await deleteServiceMapping(token, mappingId);
      setSuccess('Маппинг удалён.');
      await loadServiceMappings();
      return true;
    } catch (err) {
      handleError(err, 'Не удалось удалить маппинг.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    analyzers,
    selectedAnalyzerRates,
    reagentInventory,
    consumableInventory,
    logUploads,
    parsedSamples,
    consumptionReports,
    serviceReagentNorms,
    serviceMappings,
    damumedConsumption,
    loading,
    error,
    success,
    clearMessages,
    loadAnalyzers,
    loadAnalyzerRates,
    loadReagentInventory,
    loadConsumableInventory,
    loadLogUploads,
    loadParsedSamples,
    loadConsumptionReports,
    loadServiceReagentNorms,
    loadServiceMappings,
    loadDamumedConsumption,
    handleUpsertAnalyzer,
    handleDeleteAnalyzer,
    handleUpsertRate,
    handleDeleteRate,
    handleUpsertReagentInventory,
    handleDeleteReagentInventory,
    handleUpsertConsumableInventory,
    handleDeleteConsumableInventory,
    handleUploadLog,
    handleParseLog,
    handleGenerateReport,
    handleCalculateDamumedConsumption,
    handleRecalculateDamumedConsumption,
    handleCreateServiceNorm,
    handleUpdateServiceNorm,
    handleDeleteServiceNorm,
    handleCreateServiceMapping,
    handleUpdateServiceMapping,
    handleDeleteServiceMapping,
  };
}

// ============================================================================
// USE ALLOWANCE TEMPLATES COMPOSABLE
// Manages template list state, filtering, and CRUD operations
// ============================================================================

import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { allowanceTemplateService, ApiError } from '../services/allowanceTemplateService';
import { TABLE_DEFAULTS } from '../constants';
import type {
  AllowanceTemplate,
  AllowanceTemplateListRequest,
  AllowanceType,
  AllowanceStatus,
  PaginatedResponse
} from '../types';

export function useAllowanceTemplates() {
  const toast = useToast();
  const confirm = useConfirm();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const templates = ref<AllowanceTemplate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const page = ref(1);
  const limit = ref(TABLE_DEFAULTS.pageSize);
  const total = ref(0);
  const totalPages = ref(0);

  // Filters
  const searchQuery = ref('');
  const typeFilter = ref<AllowanceType | null>(null);
  const statusFilter = ref<AllowanceStatus | null>(null);

  // Sorting
  const sortField = ref(TABLE_DEFAULTS.sortField);
  const sortOrder = ref<'asc' | 'desc'>(TABLE_DEFAULTS.sortOrder === -1 ? 'desc' : 'asc');

  // Single template (for details/edit)
  const selectedTemplate = ref<AllowanceTemplate | null>(null);
  const loadingTemplate = ref(false);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  const isEmpty = computed(() => templates.value.length === 0 && !loading.value);

  const hasFilters = computed(
    () => !!searchQuery.value || !!typeFilter.value || !!statusFilter.value
  );

  const paginationInfo = computed(() => ({
    page: page.value,
    limit: limit.value,
    total: total.value,
    totalPages: totalPages.value,
    from: (page.value - 1) * limit.value + 1,
    to: Math.min(page.value * limit.value, total.value)
  }));

  // ---------------------------------------------------------------------------
  // METHODS - Fetching
  // ---------------------------------------------------------------------------

  async function fetchTemplates(resetPage = false): Promise<void> {
    if (resetPage) {
      page.value = 1;
    }

    loading.value = true;
    error.value = null;

    try {
      const params: AllowanceTemplateListRequest = {
        page: page.value,
        limit: limit.value,
        sortBy: sortField.value,
        sortOrder: sortOrder.value
      };

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      if (typeFilter.value) {
        params.type = typeFilter.value;
      }
      if (statusFilter.value) {
        params.status = statusFilter.value;
      }

      const response: PaginatedResponse<AllowanceTemplate> =
        await allowanceTemplateService.getTemplates(params);

      templates.value = response.data;
      total.value = response.meta.total;
      totalPages.value = response.meta.totalPages;
    } catch (e) {
      const err = e as ApiError;
      error.value = err.message || 'Failed to fetch templates';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 5000
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchTemplate(id: string): Promise<AllowanceTemplate | null> {
    loadingTemplate.value = true;
    error.value = null;

    try {
      const template = await allowanceTemplateService.getTemplate(id);
      selectedTemplate.value = template;
      return template;
    } catch (e) {
      const err = e as ApiError;
      error.value = err.message || 'Failed to fetch template';
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 5000
      });
      return null;
    } finally {
      loadingTemplate.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - CRUD Operations
  // ---------------------------------------------------------------------------

  async function duplicateTemplate(template: AllowanceTemplate): Promise<boolean> {
    try {
      const duplicated = await allowanceTemplateService.duplicateTemplate(template.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Template "${duplicated.name}" created as duplicate`,
        life: 3000
      });
      await fetchTemplates();
      return true;
    } catch (e) {
      const err = e as ApiError;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to duplicate template',
        life: 5000
      });
      return false;
    }
  }

  function confirmArchive(template: AllowanceTemplate): void {
    confirm.require({
      message: `Are you sure you want to archive "${template.name}"? This will stop all future payments to assigned users.`,
      header: 'Confirm Archive',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-warning',
      accept: () => archiveTemplate(template),
      reject: () => {}
    });
  }

  async function archiveTemplate(template: AllowanceTemplate): Promise<boolean> {
    try {
      await allowanceTemplateService.archiveTemplate(template.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Template "${template.name}" archived`,
        life: 3000
      });
      await fetchTemplates();
      return true;
    } catch (e) {
      const err = e as ApiError;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to archive template',
        life: 5000
      });
      return false;
    }
  }

  async function unarchiveTemplate(template: AllowanceTemplate): Promise<boolean> {
    try {
      await allowanceTemplateService.unarchiveTemplate(template.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Template "${template.name}" restored to draft`,
        life: 3000
      });
      await fetchTemplates();
      return true;
    } catch (e) {
      const err = e as ApiError;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to unarchive template',
        life: 5000
      });
      return false;
    }
  }

  function confirmDelete(template: AllowanceTemplate): void {
    confirm.require({
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: () => deleteTemplate(template),
      reject: () => {}
    });
  }

  async function deleteTemplate(template: AllowanceTemplate): Promise<boolean> {
    try {
      await allowanceTemplateService.deleteTemplate(template.id);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Template "${template.name}" deleted`,
        life: 3000
      });
      await fetchTemplates();
      return true;
    } catch (e) {
      const err = e as ApiError;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to delete template',
        life: 5000
      });
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - Pagination & Sorting
  // ---------------------------------------------------------------------------

  function setPage(newPage: number): void {
    page.value = newPage;
    fetchTemplates();
  }

  function setPageSize(newSize: number): void {
    limit.value = newSize;
    fetchTemplates(true);
  }

  function setSort(field: string, order: 'asc' | 'desc'): void {
    sortField.value = field;
    sortOrder.value = order;
    fetchTemplates();
  }

  // ---------------------------------------------------------------------------
  // METHODS - Filtering
  // ---------------------------------------------------------------------------

  function setSearch(query: string): void {
    searchQuery.value = query;
  }

  function setTypeFilter(type: AllowanceType | null): void {
    typeFilter.value = type;
    fetchTemplates(true);
  }

  function setStatusFilter(status: AllowanceStatus | null): void {
    statusFilter.value = status;
    fetchTemplates(true);
  }

  function clearFilters(): void {
    searchQuery.value = '';
    typeFilter.value = null;
    statusFilter.value = null;
    fetchTemplates(true);
  }

  // ---------------------------------------------------------------------------
  // WATCHERS
  // ---------------------------------------------------------------------------

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;
  watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchTemplates(true);
    }, 300);
  });

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    templates,
    loading,
    error,
    selectedTemplate,
    loadingTemplate,

    // Pagination
    page,
    limit,
    total,
    totalPages,
    paginationInfo,

    // Filters
    searchQuery,
    typeFilter,
    statusFilter,
    hasFilters,

    // Sorting
    sortField,
    sortOrder,

    // Computed
    isEmpty,

    // Methods
    fetchTemplates,
    fetchTemplate,
    duplicateTemplate,
    confirmArchive,
    archiveTemplate,
    unarchiveTemplate,
    confirmDelete,
    deleteTemplate,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    clearFilters
  };
}

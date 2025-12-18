// ============================================================================
// USE ASSIGNMENTS COMPOSABLE
// Manages user assignments for allowance templates
// ============================================================================

import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { allowanceTemplateService, ApiError } from '../services/allowanceTemplateService';
import { TABLE_DEFAULTS } from '../constants';
import type {
  AllowanceAssignment,
  User,
  PaginatedResponse,
  BulkAssignRequest
} from '../types';

export function useAssignments(templateId?: string) {
  const toast = useToast();
  const confirm = useConfirm();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  // Current assignments
  const assignments = ref<AllowanceAssignment[]>([]);
  const loadingAssignments = ref(false);
  const assignmentsPage = ref(1);
  const assignmentsLimit = ref(TABLE_DEFAULTS.pageSize);
  const assignmentsTotal = ref(0);
  const assignmentsSearch = ref('');

  // Available users (for manual selection)
  const availableUsers = ref<User[]>([]);
  const loadingUsers = ref(false);
  const usersPage = ref(1);
  const usersLimit = ref(TABLE_DEFAULTS.pageSize);
  const usersTotal = ref(0);
  const usersSearch = ref('');

  // Selection state
  const selectedUserIds = ref<string[]>([]);
  const assignmentMode = ref<'MANUAL' | 'CRITERIA'>('MANUAL');

  // Bulk operation state
  const bulkAssigning = ref(false);
  const bulkRemoving = ref(false);

  // Override options (for per-user customization)
  const effectiveStartOverride = ref<string | null>(null);
  const effectiveEndOverride = ref<string | null>(null);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  const hasAssignments = computed(() => assignments.value.length > 0);
  const hasSelectedUsers = computed(() => selectedUserIds.value.length > 0);

  const assignedUserIds = computed(() =>
    assignments.value.map((a) => a.userId)
  );

  // Filter out already assigned users from available users
  const unassignedUsers = computed(() =>
    availableUsers.value.filter(
      (user) => !assignedUserIds.value.includes(user.id)
    )
  );

  const selectedCount = computed(() => selectedUserIds.value.length);

  // ---------------------------------------------------------------------------
  // METHODS - Fetch Assignments
  // ---------------------------------------------------------------------------

  async function fetchAssignments(): Promise<void> {
    if (!templateId) return;

    loadingAssignments.value = true;
    try {
      const response: PaginatedResponse<AllowanceAssignment> =
        await allowanceTemplateService.getAssignments(templateId, {
          page: assignmentsPage.value,
          limit: assignmentsLimit.value,
          search: assignmentsSearch.value || undefined
        });

      assignments.value = response.data;
      assignmentsTotal.value = response.meta.total;
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch assignments',
        life: 5000
      });
    } finally {
      loadingAssignments.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - Fetch Available Users
  // ---------------------------------------------------------------------------

  async function fetchAvailableUsers(): Promise<void> {
    loadingUsers.value = true;
    try {
      const response: PaginatedResponse<User> =
        await allowanceTemplateService.getUsers({
          page: usersPage.value,
          limit: usersLimit.value,
          search: usersSearch.value || undefined,
          excludeTemplateId: templateId
        });

      availableUsers.value = response.data;
      usersTotal.value = response.meta.total;
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch users',
        life: 5000
      });
    } finally {
      loadingUsers.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - User Selection
  // ---------------------------------------------------------------------------

  function selectUser(userId: string): void {
    if (!selectedUserIds.value.includes(userId)) {
      selectedUserIds.value.push(userId);
    }
  }

  function deselectUser(userId: string): void {
    const index = selectedUserIds.value.indexOf(userId);
    if (index > -1) {
      selectedUserIds.value.splice(index, 1);
    }
  }

  function toggleUserSelection(userId: string): void {
    if (selectedUserIds.value.includes(userId)) {
      deselectUser(userId);
    } else {
      selectUser(userId);
    }
  }

  function selectAllVisible(): void {
    const visibleIds = unassignedUsers.value.map((u) => u.id);
    selectedUserIds.value = [
      ...new Set([...selectedUserIds.value, ...visibleIds])
    ];
  }

  function deselectAll(): void {
    selectedUserIds.value = [];
  }

  function setSelectedUsers(userIds: string[]): void {
    selectedUserIds.value = [...userIds];
  }

  // For criteria-based assignment: set users from preview
  function setUsersFromCriteriaPreview(userIds: string[]): void {
    assignmentMode.value = 'CRITERIA';
    selectedUserIds.value = [...userIds];
  }

  // ---------------------------------------------------------------------------
  // METHODS - Assign Users
  // ---------------------------------------------------------------------------

  async function assignSelectedUsers(): Promise<boolean> {
    if (!templateId || selectedUserIds.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'No Users Selected',
        detail: 'Please select at least one user to assign',
        life: 3000
      });
      return false;
    }

    bulkAssigning.value = true;
    try {
      const request: BulkAssignRequest = {
        userIds: selectedUserIds.value,
        source: assignmentMode.value
      };

      if (effectiveStartOverride.value) {
        request.effectiveStartOverride = effectiveStartOverride.value;
      }
      if (effectiveEndOverride.value) {
        request.effectiveEndOverride = effectiveEndOverride.value;
      }

      const result = await allowanceTemplateService.assignUsers(templateId, request);

      const message =
        result.skipped > 0
          ? `Assigned ${result.assigned} users (${result.skipped} already assigned)`
          : `Successfully assigned ${result.assigned} users`;

      toast.add({
        severity: result.skipped > 0 ? 'warn' : 'success',
        summary: 'Assignment Complete',
        detail: message,
        life: 3000
      });

      // Reset selection and refresh
      selectedUserIds.value = [];
      assignmentMode.value = 'MANUAL';
      effectiveStartOverride.value = null;
      effectiveEndOverride.value = null;
      await fetchAssignments();
      return true;
    } catch (e) {
      const err = e as ApiError;
      toast.add({
        severity: 'error',
        summary: 'Assignment Failed',
        detail: err.message || 'Failed to assign users',
        life: 5000
      });
      return false;
    } finally {
      bulkAssigning.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - Remove Assignments
  // ---------------------------------------------------------------------------

  function confirmRemoveAssignment(assignment: AllowanceAssignment): void {
    confirm.require({
      message: `Remove ${assignment.userName} from this allowance?`,
      header: 'Confirm Remove',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: () => removeAssignment(assignment.id),
      reject: () => {}
    });
  }

  async function removeAssignment(assignmentId: string): Promise<boolean> {
    if (!templateId) return false;

    try {
      await allowanceTemplateService.removeAssignment(templateId, assignmentId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Assignment removed',
        life: 3000
      });
      await fetchAssignments();
      return true;
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove assignment',
        life: 5000
      });
      return false;
    }
  }

  function confirmBulkRemove(assignmentIds: string[]): void {
    confirm.require({
      message: `Remove ${assignmentIds.length} users from this allowance?`,
      header: 'Confirm Bulk Remove',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      accept: () => bulkRemoveAssignments(assignmentIds),
      reject: () => {}
    });
  }

  async function bulkRemoveAssignments(assignmentIds: string[]): Promise<boolean> {
    if (!templateId || assignmentIds.length === 0) return false;

    bulkRemoving.value = true;
    try {
      const result = await allowanceTemplateService.removeAssignments(
        templateId,
        assignmentIds
      );
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Removed ${result.removed} assignments`,
        life: 3000
      });
      await fetchAssignments();
      return true;
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove assignments',
        life: 5000
      });
      return false;
    } finally {
      bulkRemoving.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - Pagination & Search
  // ---------------------------------------------------------------------------

  function setAssignmentsPage(page: number): void {
    assignmentsPage.value = page;
    fetchAssignments();
  }

  function setAssignmentsSearch(search: string): void {
    assignmentsSearch.value = search;
    assignmentsPage.value = 1;
    fetchAssignments();
  }

  function setUsersPage(page: number): void {
    usersPage.value = page;
    fetchAvailableUsers();
  }

  function setUsersSearch(search: string): void {
    usersSearch.value = search;
    usersPage.value = 1;
    fetchAvailableUsers();
  }

  // ---------------------------------------------------------------------------
  // METHODS - Override Management
  // ---------------------------------------------------------------------------

  function setEffectiveStartOverride(date: string | null): void {
    effectiveStartOverride.value = date;
  }

  function setEffectiveEndOverride(date: string | null): void {
    effectiveEndOverride.value = date;
  }

  function clearOverrides(): void {
    effectiveStartOverride.value = null;
    effectiveEndOverride.value = null;
  }

  // ---------------------------------------------------------------------------
  // METHODS - Reset
  // ---------------------------------------------------------------------------

  function resetState(): void {
    assignments.value = [];
    availableUsers.value = [];
    selectedUserIds.value = [];
    assignmentMode.value = 'MANUAL';
    effectiveStartOverride.value = null;
    effectiveEndOverride.value = null;
    assignmentsPage.value = 1;
    usersPage.value = 1;
    assignmentsSearch.value = '';
    usersSearch.value = '';
  }

  // ---------------------------------------------------------------------------
  // WATCHERS
  // ---------------------------------------------------------------------------

  // Debounced search for assignments
  let assignmentsSearchTimeout: ReturnType<typeof setTimeout>;
  watch(assignmentsSearch, () => {
    clearTimeout(assignmentsSearchTimeout);
    assignmentsSearchTimeout = setTimeout(() => {
      fetchAssignments();
    }, 300);
  });

  // Debounced search for users
  let usersSearchTimeout: ReturnType<typeof setTimeout>;
  watch(usersSearch, () => {
    clearTimeout(usersSearchTimeout);
    usersSearchTimeout = setTimeout(() => {
      fetchAvailableUsers();
    }, 300);
  });

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // Assignment state
    assignments,
    loadingAssignments,
    assignmentsPage,
    assignmentsLimit,
    assignmentsTotal,
    assignmentsSearch,

    // User state
    availableUsers,
    loadingUsers,
    usersPage,
    usersLimit,
    usersTotal,
    usersSearch,
    unassignedUsers,

    // Selection state
    selectedUserIds,
    assignmentMode,
    hasSelectedUsers,
    selectedCount,

    // Operation state
    bulkAssigning,
    bulkRemoving,

    // Override state
    effectiveStartOverride,
    effectiveEndOverride,

    // Computed
    hasAssignments,
    assignedUserIds,

    // Fetch methods
    fetchAssignments,
    fetchAvailableUsers,

    // Selection methods
    selectUser,
    deselectUser,
    toggleUserSelection,
    selectAllVisible,
    deselectAll,
    setSelectedUsers,
    setUsersFromCriteriaPreview,

    // Assignment methods
    assignSelectedUsers,
    confirmRemoveAssignment,
    removeAssignment,
    confirmBulkRemove,
    bulkRemoveAssignments,

    // Pagination methods
    setAssignmentsPage,
    setAssignmentsSearch,
    setUsersPage,
    setUsersSearch,

    // Override methods
    setEffectiveStartOverride,
    setEffectiveEndOverride,
    clearOverrides,

    // Reset
    resetState
  };
}

<template>
  <div class="assign-users-panel">
    <!-- Action Toolbar -->
    <div class="action-toolbar">
      <Button
        icon="pi pi-user-plus"
        class="p-button-primary"
        @click="showAssignDrawer = true"
        v-tooltip.top="'Assign Employee'"
      />
      <Button
        icon="pi pi-user-minus"
        class="p-button-outlined p-button-danger"
        :disabled="!hasSelectedAssignments"
        @click="handleUnassignSelected"
        v-tooltip.top="'Unassign Employee'"
      />
    </div>

    <!-- Assigned Users Table -->
    <DataTable
      :value="displayedAssignments"
      :loading="loadingAssignments"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      selectionMode="multiple"
      v-model:selection="selectedAssignmentsForTable"
      v-model:filters="filters"
      filterDisplay="row"
      dataKey="id"
      responsiveLayout="scroll"
      class="users-table"
      :rowClass="getRowClass"
      @rowSelect="handleRowSelect"
      @rowUnselect="handleRowUnselect"
      @rowSelectAll="handleSelectAllAssignments"
      @rowUnselectAll="handleDeselectAllAssignments"
    >
      <template #empty>
        <div class="table-empty">
          <i class="pi pi-users empty-icon"></i>
          <span>No employees assigned yet</span>
          <small>Click "Assign Employee" to add employees to this allowance</small>
        </div>
      </template>

      <template #loading>
        <div class="table-loading">
          <ProgressSpinner style="width: 40px; height: 40px" />
          <span>Loading assignments...</span>
        </div>
      </template>

      <Column selectionMode="multiple" headerStyle="width: 3rem" class="checkbox-column">
        <template #filter>
          <span></span>
        </template>
      </Column>

      <Column field="userCode" header="Employee ID" sortable :showFilterMenu="false" style="min-width: 140px">
        <template #body="{ data }">
          <span class="user-code">{{ data.userCode }}</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="userName" header="Name" sortable :showFilterMenu="false" style="min-width: 220px">
        <template #body="{ data }">
          <div class="user-info">
            <Avatar
              :label="getInitials(data.userName || '')"
              shape="circle"
              class="user-avatar"
            />
            <div class="user-details">
              <span class="user-name">{{ data.userName }}</span>
            </div>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="userPosition" header="Designation" sortable :showFilterMenu="false" style="min-width: 150px">
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="userDepartment" header="Department" sortable :showFilterMenu="false" style="min-width: 150px">
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="assignedAt" header="Assigned Date" sortable style="min-width: 130px">
        <template #body="{ data }">
          <span class="assigned-date">{{ formatDate(data.assignedAt) }}</span>
        </template>
      </Column>

      <!-- Clear Filter Column -->
      <Column headerStyle="width: 3.5rem" :showFilterMenu="false">
        <template #filter>
          <Button
            v-if="hasActiveFilters"
            icon="pi pi-filter-slash"
            class="p-button-text p-button-sm clear-filter-btn"
            @click="clearAllFilters"
            v-tooltip.top="'Clear all filters'"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Selection Summary -->
    <Card v-if="hasSelectedAssignments" class="selection-summary">
      <template #content>
        <div class="summary-content">
          <div class="summary-info">
            <Badge :value="selectedAssignmentCount" size="large" severity="warn" />
            <span class="summary-text">
              employee{{ selectedAssignmentCount !== 1 ? 's' : '' }} selected for unassignment
            </span>
          </div>
          <div class="summary-actions">
            <Button
              label="Clear Selection"
              icon="pi pi-times"
              class="p-button-text"
              @click="handleClearSelection"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Assign Employee Drawer -->
    <Sidebar
      v-model:visible="showAssignDrawer"
      position="right"
      :style="{ width: '56rem' }"
      class="assign-drawer"
    >
      <template #header>
        <div class="drawer-header-full">
          <div class="drawer-header-left">
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              class="p-button-text"
              @click="handleCancelDrawer"
            />
          </div>
          <div class="drawer-header-title">
            <i class="pi pi-user-plus"></i>
            <span>Assign Employees</span>
          </div>
          <div class="drawer-header-right">
            <Button
              label="Save"
              icon="pi pi-save"
              class="p-button-primary"
              :disabled="drawerSelectedUsers.length === 0"
              :loading="bulkAssigning"
              @click="handleConfirmAssignment"
            />
          </div>
        </div>
      </template>

      <!-- Drawer Content: Unassigned Employees Table -->
      <div class="drawer-content">
        <DataTable
          :value="filteredUnassignedUsers"
          :loading="loadingUsers"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          selectionMode="multiple"
          v-model:selection="drawerSelectedUsers"
          v-model:filters="drawerFilters"
          filterDisplay="row"
          dataKey="id"
          responsiveLayout="scroll"
          class="users-table drawer-table"
        >
          <template #empty>
            <div class="table-empty">
              <i class="pi pi-check-circle empty-icon" style="color: #22c55e"></i>
              <span>All employees are already assigned</span>
            </div>
          </template>

          <template #loading>
            <div class="table-loading">
              <ProgressSpinner style="width: 40px; height: 40px" />
              <span>Loading employees...</span>
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" class="checkbox-column">
            <template #filter>
              <span></span>
            </template>
          </Column>

          <Column field="code" header="Employee ID" sortable :showFilterMenu="false" style="min-width: 100px; width: 100px">
            <template #body="{ data }">
              <span class="user-code">{{ data.code }}</span>
            </template>
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search..."
                class="p-column-filter"
              />
            </template>
          </Column>

          <Column field="name" header="Name" sortable :showFilterMenu="false" style="min-width: 140px">
            <template #body="{ data }">
              <span class="user-name">{{ data.name }}</span>
            </template>
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search..."
                class="p-column-filter"
              />
            </template>
          </Column>

          <Column field="position" header="Designation" sortable :showFilterMenu="false" style="min-width: 120px">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search..."
                class="p-column-filter"
              />
            </template>
          </Column>

          <Column field="branch" header="Company" sortable :showFilterMenu="false" style="min-width: 90px">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search..."
                class="p-column-filter"
              />
            </template>
          </Column>

          <Column field="department" header="Department" sortable :showFilterMenu="false" style="min-width: 100px">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                type="text"
                @input="filterCallback()"
                placeholder="Search..."
                class="p-column-filter"
              />
            </template>
          </Column>

          <Column field="assignedTemplates" header="Allowance Template" :showFilterMenu="false" style="min-width: 150px">
            <template #body="{ data }">
              <div class="template-badges" v-if="data.assignedTemplates && data.assignedTemplates.length > 0">
                <Badge
                  v-for="template in data.assignedTemplates"
                  :key="template.id"
                  :value="template.name"
                  severity="info"
                  class="template-badge"
                />
              </div>
              <span v-else class="no-template">-</span>
            </template>
          </Column>

          <!-- Clear Filter Column -->
          <Column headerStyle="width: 3.5rem" :showFilterMenu="false">
            <template #filter>
              <Button
                v-if="hasDrawerActiveFilters"
                icon="pi pi-filter-slash"
                class="p-button-text p-button-sm clear-filter-btn"
                @click="clearDrawerFilters"
                v-tooltip.top="'Clear all filters'"
              />
            </template>
          </Column>
        </DataTable>

        <!-- Drawer Selection Summary -->
        <Card v-if="drawerSelectedUsers.length > 0" class="drawer-selection-summary">
          <template #content>
            <div class="summary-content">
              <div class="summary-info">
                <Badge :value="drawerSelectedUsers.length" size="large" severity="success" />
                <span class="summary-text">
                  employee{{ drawerSelectedUsers.length !== 1 ? 's' : '' }} selected for assignment
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

    </Sidebar>

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useConfirm } from 'primevue/useconfirm';
// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import Sidebar from 'primevue/sidebar';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Tooltip from 'primevue/tooltip';
// Composables
import { useAssignments } from '../../composables';
// Types
import type { User, AllowanceAssignment } from '../../types';
import type { DataTableFilterMeta } from 'primevue/datatable';

// ---------------------------------------------------------------------------
// DIRECTIVES
// ---------------------------------------------------------------------------

const vTooltip = Tooltip;

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  templateId?: string | null;
  initialSelectedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  templateId: null,
  initialSelectedIds: () => []
});

const emit = defineEmits<{
  (e: 'update', data: { userIds: string[]; mode: 'MANUAL' }): void;
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const confirm = useConfirm();

const {
  // Assignments (assigned users)
  assignments,
  loadingAssignments,
  fetchAssignments,
  // Available users (for drawer)
  availableUsers,
  loadingUsers,
  unassignedUsers,
  fetchAvailableUsers,
  // Selection
  selectedUserIds,
  selectAllVisible,
  deselectAll,
  setSelectedUsers,
  // Assignment operations
  assignSelectedUsers,
  bulkAssigning,
  bulkRemoveAssignments,
  // Overrides
  effectiveStartOverride,
  effectiveEndOverride
} = useAssignments(props.templateId || undefined);

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

// Drawer visibility
const showAssignDrawer = ref(false);

// Local assignments for create mode (when no templateId)
const localAssignedUsers = ref<User[]>([]);

// For main table (assigned users) selection
const selectedAssignmentsForTable = ref<AllowanceAssignment[]>([]);
const selectedAssignmentIds = ref<string[]>([]);

// For drawer table (unassigned users) selection
const drawerSelectedUsers = ref<User[]>([]);

// Main table filters
const filters = ref<DataTableFilterMeta>({
  userCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
  userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  userPosition: { value: null, matchMode: FilterMatchMode.CONTAINS },
  userDepartment: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Drawer table filters
const drawerFilters = ref<DataTableFilterMeta>({
  code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  position: { value: null, matchMode: FilterMatchMode.CONTAINS },
  branch: { value: null, matchMode: FilterMatchMode.CONTAINS },
  department: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Filter active states
const hasActiveFilters = ref(false);
const hasDrawerActiveFilters = ref(false);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

// In create mode, show local users; in edit mode, show assignments from API
const displayedAssignments = computed(() => {
  if (props.templateId) {
    // Edit mode: use assignments from API
    return assignments.value;
  } else {
    // Create mode: convert local users to assignment-like objects for display
    return localAssignedUsers.value.map(user => ({
      id: user.id,
      templateId: '',
      userId: user.id,
      userName: user.name,
      userCode: user.code,
      userDepartment: user.department,
      userPosition: user.position,
      assignedAt: new Date().toISOString(),
      assignedBy: '',
      assignmentSource: 'MANUAL' as const
    }));
  }
});

// Filter out already assigned users from available users (for create mode)
const filteredUnassignedUsers = computed(() => {
  if (props.templateId) {
    // Edit mode: use unassignedUsers from composable
    return unassignedUsers.value;
  } else {
    // Create mode: filter out locally assigned users
    const assignedIds = localAssignedUsers.value.map(u => u.id);
    return availableUsers.value.filter(u => !assignedIds.includes(u.id));
  }
});

const hasSelectedAssignments = computed(() => selectedAssignmentIds.value.length > 0);
const selectedAssignmentCount = computed(() => selectedAssignmentIds.value.length);

// ---------------------------------------------------------------------------
// METHODS - Main Table (Assigned Users)
// ---------------------------------------------------------------------------

function handleRowSelect(event: { data: AllowanceAssignment }): void {
  if (!selectedAssignmentIds.value.includes(event.data.id)) {
    selectedAssignmentIds.value.push(event.data.id);
  }
}

function handleRowUnselect(event: { data: AllowanceAssignment }): void {
  const index = selectedAssignmentIds.value.indexOf(event.data.id);
  if (index > -1) {
    selectedAssignmentIds.value.splice(index, 1);
  }
}

function handleSelectAllAssignments(): void {
  selectedAssignmentIds.value = assignments.value.map(a => a.id);
}

function handleDeselectAllAssignments(): void {
  selectedAssignmentIds.value = [];
  selectedAssignmentsForTable.value = [];
}

function handleClearSelection(): void {
  selectedAssignmentIds.value = [];
  selectedAssignmentsForTable.value = [];
}

function handleUnassignSelected(): void {
  confirm.require({
    message: `Are you sure you want to unassign ${selectedAssignmentCount.value} employee${selectedAssignmentCount.value !== 1 ? 's' : ''} from this allowance?`,
    header: 'Confirm Unassign',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (props.templateId) {
        // Edit mode: call API to remove assignments
        const success = await bulkRemoveAssignments(selectedAssignmentIds.value);
        if (success) {
          selectedAssignmentIds.value = [];
          selectedAssignmentsForTable.value = [];
          emitUpdate();
        }
      } else {
        // Create mode: remove from local state
        localAssignedUsers.value = localAssignedUsers.value.filter(
          u => !selectedAssignmentIds.value.includes(u.id)
        );
        selectedAssignmentIds.value = [];
        selectedAssignmentsForTable.value = [];
        // Emit updated user IDs
        emit('update', {
          userIds: localAssignedUsers.value.map(u => u.id),
          mode: 'MANUAL'
        });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// METHODS - Drawer (Unassigned Users)
// ---------------------------------------------------------------------------

function handleCancelDrawer(): void {
  showAssignDrawer.value = false;
  drawerSelectedUsers.value = [];
  clearDrawerFilters();
}

async function handleConfirmAssignment(): Promise<void> {
  // Get selected user IDs from drawer selection
  const userIdsToAssign = drawerSelectedUsers.value.map(u => u.id);

  if (userIdsToAssign.length === 0) {
    return;
  }

  // If we have a templateId, perform API assignment
  if (props.templateId) {
    // Set selected user IDs first and wait for next tick
    setSelectedUsers(userIdsToAssign);

    // Use nextTick to ensure Vue reactivity has updated
    await nextTick();

    // Perform assignment via API
    const success = await assignSelectedUsers();

    if (success) {
      showAssignDrawer.value = false;
      drawerSelectedUsers.value = [];
      clearDrawerFilters();
      // Refresh both lists
      await fetchAssignments();
      await fetchAvailableUsers();
      emitUpdate();
    }
  } else {
    // Create mode: add to local state and emit
    // Add selected users to local assigned users
    localAssignedUsers.value = [
      ...localAssignedUsers.value,
      ...drawerSelectedUsers.value
    ];

    // Close drawer and clear selection
    showAssignDrawer.value = false;
    drawerSelectedUsers.value = [];
    clearDrawerFilters();

    // Emit the updated user IDs to parent
    emit('update', {
      userIds: localAssignedUsers.value.map(u => u.id),
      mode: 'MANUAL'
    });
  }
}

// ---------------------------------------------------------------------------
// METHODS - Utilities
// ---------------------------------------------------------------------------

function emitUpdate(): void {
  const assignedUserIds = props.templateId
    ? assignments.value.map(a => a.userId)
    : localAssignedUsers.value.map(u => u.id);
  emit('update', {
    userIds: assignedUserIds,
    mode: 'MANUAL'
  });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getRowClass(data: AllowanceAssignment): string {
  return selectedAssignmentIds.value.includes(data.id) ? 'row-selected' : '';
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ---------------------------------------------------------------------------
// METHODS - Filters
// ---------------------------------------------------------------------------

function clearAllFilters(): void {
  filters.value = {
    userCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userPosition: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userDepartment: { value: null, matchMode: FilterMatchMode.CONTAINS }
  };
}

function clearDrawerFilters(): void {
  drawerFilters.value = {
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    position: { value: null, matchMode: FilterMatchMode.CONTAINS },
    branch: { value: null, matchMode: FilterMatchMode.CONTAINS },
    department: { value: null, matchMode: FilterMatchMode.CONTAINS }
  };
}

function checkActiveFilters(): void {
  hasActiveFilters.value = Object.values(filters.value).some(
    (filter) => filter && (filter as { value: unknown }).value !== null && (filter as { value: unknown }).value !== ''
  );
}

function checkDrawerActiveFilters(): void {
  hasDrawerActiveFilters.value = Object.values(drawerFilters.value).some(
    (filter) => filter && (filter as { value: unknown }).value !== null && (filter as { value: unknown }).value !== ''
  );
}

// ---------------------------------------------------------------------------
// WATCHERS
// ---------------------------------------------------------------------------

// Sync table selection with selectedAssignmentIds
watch(
  selectedAssignmentIds,
  (newIds) => {
    selectedAssignmentsForTable.value = displayedAssignments.value.filter((a) =>
      newIds.includes(a.id)
    );
  },
  { immediate: true }
);

// Watch filters
watch(filters, checkActiveFilters, { deep: true });
watch(drawerFilters, checkDrawerActiveFilters, { deep: true });

// Fetch available users when drawer opens & control body scroll
watch(showAssignDrawer, (isOpen) => {
  if (isOpen) {
    fetchAvailableUsers();
    // Hide main page scrollbar when drawer is open
    document.body.style.overflow = 'hidden';
  } else {
    // Restore scrollbar when drawer closes
    document.body.style.overflow = '';
  }
});

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchAssignments();
  fetchAvailableUsers();

  // Initialize with provided selected IDs if any
  if (props.initialSelectedIds?.length) {
    setSelectedUsers(props.initialSelectedIds);
  }
});

onUnmounted(() => {
  // Ensure body scroll is restored when component unmounts
  document.body.style.overflow = '';
});

// Expose methods
defineExpose({
  getAssignedUserIds: () => props.templateId
    ? assignments.value.map(a => a.userId)
    : localAssignedUsers.value.map(u => u.id),
  refreshAssignments: fetchAssignments
});
</script>

<style scoped>
/* Action Toolbar */
.action-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

/* Users Table */
.users-table {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.users-table :deep(.p-datatable-tbody > tr > td) {
  font-size: 0.8rem;
}

/* ============================================================
   TABLE HEADER STYLING
   ============================================================ */

/* Header row - all columns */
.users-table :deep(.p-datatable-thead > tr:first-child > th) {
  font-weight: 600;
  color: #1e40af;
  background-color: #f1f5f9;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Filter row - all columns */
.users-table :deep(.p-datatable-thead > tr:nth-child(2) > th) {
  padding: 0.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

/* ============================================================
   CHECKBOX COLUMN ALIGNMENT FIX
   Create visual rowspan effect for checkbox column
   ============================================================ */

/* Header row - checkbox column: extend to cover filter row visually */
.users-table :deep(.p-datatable-thead > tr:first-child > th:first-child) {
  position: relative;
  background-color: #f1f5f9;
  text-align: center;
  vertical-align: middle;
  border-bottom: none;
  z-index: 2;
}

/* Create pseudo-element to extend background into filter row */
.users-table :deep(.p-datatable-thead > tr:first-child > th:first-child::after) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -100%;
  height: 100%;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  z-index: 1;
}

/* Filter row - checkbox column: make invisible but maintain structure */
.users-table :deep(.p-datatable-thead > tr:nth-child(2) > th:first-child) {
  background-color: transparent;
  border-top: none;
  padding: 0.5rem;
  visibility: hidden;
}

/* Body cells - checkbox column */
.users-table :deep(.p-datatable-tbody > tr > td:first-child) {
  text-align: center;
  vertical-align: middle;
}

/* Center checkbox in header and body */
.users-table :deep(.p-datatable-thead > tr:first-child > th:first-child .p-checkbox),
.users-table :deep(.p-datatable-tbody > tr > td:first-child .p-checkbox) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.users-table :deep(.p-column-filter) {
  width: 100%;
  font-size: 0.8rem;
}

.users-table :deep(.p-column-filter .p-inputtext) {
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
}

/* Clear Filter Button */
.clear-filter-btn {
  color: #64748b;
}

.clear-filter-btn:hover {
  color: #ef4444;
  background-color: #fee2e2 !important;
}


.table-empty,
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #64748b;
}

.table-empty small {
  color: #94a3b8;
}

.empty-icon {
  font-size: 2.5rem;
  color: #cbd5e1;
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  flex-shrink: 0;
  background-color: #3b82f6;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #1e293b;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.user-code {
  font-family: monospace;
  font-size: 0.875rem;
}

.assigned-date {
  font-size: 0.8rem;
  color: #64748b;
}

/* Template Badges */
.template-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.template-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
}

.no-template {
  color: #94a3b8;
  font-style: italic;
}

/* Selection Summary */
.selection-summary {
  margin-top: 1rem;
  background-color: #fef3c7;
  border: 1px solid #fcd34d;
}

.summary-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-text {
  font-size: 0.875rem;
  color: #92400e;
}

/* Drawer Styles */
.drawer-header-full {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 2rem;
}

.drawer-header-left {
  flex: 0 0 auto;
}

.drawer-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.drawer-header-title i {
  font-size: 1.25rem;
}

.drawer-header-right {
  flex: 0 0 auto;
}

.drawer-content {
  padding: 0.75rem 0;
}

.drawer-table {
  margin-bottom: 0.75rem;
}

/* Compact table styling for drawer */
.drawer-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.drawer-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.drawer-table :deep(.p-column-filter) {
  font-size: 0.75rem;
}

.drawer-table :deep(.p-column-filter .p-inputtext) {
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
}

/* ============================================================
   DRAWER TABLE - HEADER STYLING
   ============================================================ */

/* Header row - all columns */
.drawer-table :deep(.p-datatable-thead > tr:first-child > th) {
  font-weight: 600;
  color: #1e40af;
  background-color: #f1f5f9;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Filter row - all columns */
.drawer-table :deep(.p-datatable-thead > tr:nth-child(2) > th) {
  padding: 0.35rem 0.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

/* ============================================================
   DRAWER TABLE - CHECKBOX COLUMN ALIGNMENT FIX
   ============================================================ */

/* Header row - checkbox column: extend to cover filter row visually */
.drawer-table :deep(.p-datatable-thead > tr:first-child > th:first-child) {
  position: relative;
  background-color: #f1f5f9;
  text-align: center;
  vertical-align: middle;
  border-bottom: none;
  z-index: 2;
}

/* Create pseudo-element to extend background into filter row */
.drawer-table :deep(.p-datatable-thead > tr:first-child > th:first-child::after) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -100%;
  height: 100%;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  z-index: 1;
}

/* Filter row - checkbox column: make invisible but maintain structure */
.drawer-table :deep(.p-datatable-thead > tr:nth-child(2) > th:first-child) {
  background-color: transparent;
  border-top: none;
  padding: 0.35rem 0.5rem;
  visibility: hidden;
}

/* Body cells - checkbox column */
.drawer-table :deep(.p-datatable-tbody > tr > td:first-child) {
  text-align: center;
  vertical-align: middle;
}

/* Center checkbox in header and body */
.drawer-table :deep(.p-datatable-thead > tr:first-child > th:first-child .p-checkbox),
.drawer-table :deep(.p-datatable-tbody > tr > td:first-child .p-checkbox) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.drawer-selection-summary {
  background-color: #ecfdf5;
  border: 1px solid #6ee7b7;
}

.drawer-selection-summary .summary-text {
  color: #065f46;
}

/* Row Selected */
:deep(.row-selected) {
  background-color: #fef3c7 !important;
}

/* Responsive */
@media (max-width: 768px) {
  .action-toolbar {
    flex-direction: column;
  }

  .summary-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

/* Sidebar customization */
:deep(.assign-drawer) {
  max-width: 70vw;
}

:deep(.assign-drawer .p-sidebar-content) {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.assign-drawer .p-sidebar-header) {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}
</style>

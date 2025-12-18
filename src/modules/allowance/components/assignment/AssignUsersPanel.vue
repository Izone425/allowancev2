<template>
  <div class="assign-users-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-content">
        <h3 class="header-title">Assign Users</h3>
        <p class="header-description">
          Choose how to assign users to this allowance template.
        </p>
      </div>
    </div>

    <!-- Assignment Mode Tabs -->
    <TabView v-model:activeIndex="activeTab" class="assignment-tabs">
      <!-- Manual Selection Tab -->
      <TabPanel>
        <template #header>
          <div class="tab-header">
            <i class="pi pi-user-plus"></i>
            <span>Manual Selection</span>
          </div>
        </template>

        <div class="tab-content">
          <!-- Search & Actions -->
          <div class="search-bar">
            <IconField iconPosition="left" class="search-field">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="usersSearch"
                placeholder="Search users by name or employee ID..."
                class="search-input"
              />
            </IconField>
            <div class="search-actions">
              <Button
                label="Select All Visible"
                icon="pi pi-check-square"
                class="p-button-outlined p-button-sm"
                :disabled="unassignedUsers.length === 0"
                @click="selectAllVisible"
              />
              <Button
                v-if="hasSelectedUsers"
                :label="`Clear (${selectedCount})`"
                icon="pi pi-times"
                class="p-button-text p-button-sm"
                @click="deselectAll"
              />
            </div>
          </div>

          <!-- Users Table -->
          <DataTable
            :value="unassignedUsers"
            :loading="loadingUsers"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            selectionMode="multiple"
            v-model:selection="selectedUsersForTable"
            dataKey="id"
            responsiveLayout="scroll"
            class="users-table"
            :rowClass="getRowClass"
            @rowSelect="handleRowSelect"
            @rowUnselect="handleRowUnselect"
            @rowSelectAll="handleSelectAll"
            @rowUnselectAll="deselectAll"
          >
            <template #empty>
              <div class="table-empty">
                <i class="pi pi-users empty-icon"></i>
                <span>No users found</span>
              </div>
            </template>

            <template #loading>
              <div class="table-loading">
                <ProgressSpinner style="width: 40px; height: 40px" />
                <span>Loading users...</span>
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column field="code" header="ID" sortable style="min-width: 100px">
              <template #body="{ data }">
                <span class="user-code">{{ data.code }}</span>
              </template>
            </Column>

            <Column field="name" header="Name" sortable style="min-width: 200px">
              <template #body="{ data }">
                <div class="user-info">
                  <Avatar
                    :image="data.avatar"
                    :label="getInitials(data.name)"
                    shape="circle"
                    class="user-avatar"
                  />
                  <div class="user-details">
                    <span class="user-name">{{ data.name }}</span>
                    <span class="user-email">{{ data.email }}</span>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="department" header="Department" sortable style="min-width: 150px" />

            <Column field="position" header="Position" sortable style="min-width: 150px" />

            <Column field="jobGrade" header="Grade" sortable style="min-width: 80px">
              <template #body="{ data }">
                <Badge :value="data.jobGrade" severity="info" />
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- By Criteria Tab -->
      <TabPanel>
        <template #header>
          <div class="tab-header">
            <i class="pi pi-filter"></i>
            <span>By Criteria</span>
          </div>
        </template>

        <div class="tab-content">
          <div v-if="!hasCriteria" class="no-criteria-state">
            <i class="pi pi-info-circle info-icon"></i>
            <div class="info-content">
              <h4>No criteria defined</h4>
              <p>
                Go back to Step 2 to define eligibility criteria, then return here
                to preview and assign eligible users.
              </p>
              <Button
                label="Go to Criteria"
                icon="pi pi-arrow-left"
                class="p-button-outlined"
                @click="$emit('goToCriteria')"
              />
            </div>
          </div>

          <div v-else class="criteria-preview-section">
            <!-- Criteria Summary -->
            <Card class="criteria-summary-card">
              <template #content>
                <div class="criteria-summary">
                  <div class="summary-header">
                    <i class="pi pi-filter summary-icon"></i>
                    <span class="summary-title">Current Criteria</span>
                  </div>
                  <p class="summary-description">
                    {{ criteriaDescription || 'No criteria description available' }}
                  </p>
                </div>
              </template>
            </Card>

            <!-- Preview Button -->
            <div class="preview-actions">
              <Button
                label="Preview Eligible Users"
                icon="pi pi-eye"
                class="p-button-primary"
                :loading="previewLoading"
                @click="handlePreviewCriteria"
              />
            </div>

            <!-- Preview Results -->
            <Card v-if="criteriaPreviewResult" class="preview-results-card">
              <template #header>
                <div class="preview-header">
                  <div class="preview-stat">
                    <span class="stat-value">{{ criteriaPreviewResult.eligibleCount }}</span>
                    <span class="stat-label">Eligible Users</span>
                  </div>
                  <Button
                    label="Assign All Eligible"
                    icon="pi pi-users"
                    class="p-button-success"
                    :disabled="criteriaPreviewResult.eligibleCount === 0"
                    @click="assignFromCriteria"
                  />
                </div>
              </template>
              <template #content>
                <DataTable
                  v-if="criteriaPreviewResult.eligibleUsers?.length"
                  :value="criteriaPreviewResult.eligibleUsers"
                  :paginator="criteriaPreviewResult.eligibleUsers.length > 10"
                  :rows="10"
                  responsiveLayout="scroll"
                  class="preview-table"
                >
                  <Column field="code" header="ID" style="min-width: 100px" />
                  <Column field="name" header="Name" style="min-width: 200px">
                    <template #body="{ data }">
                      <div class="user-info-simple">
                        <Avatar
                          :label="getInitials(data.name)"
                          shape="circle"
                          size="small"
                        />
                        <span>{{ data.name }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column field="department" header="Department" style="min-width: 150px" />
                  <Column field="position" header="Position" style="min-width: 150px" />
                </DataTable>
                <div v-else class="preview-empty">
                  <i class="pi pi-inbox"></i>
                  <span>No eligible users match the current criteria</span>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Selection Summary -->
    <Card v-if="hasSelectedUsers" class="selection-summary">
      <template #content>
        <div class="summary-content">
          <div class="summary-info">
            <Badge :value="selectedCount" size="large" severity="success" />
            <span class="summary-text">
              user{{ selectedCount !== 1 ? 's' : '' }} selected for assignment
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

    <!-- Optional: Effective Date Override -->
    <Fieldset
      v-if="hasSelectedUsers"
      legend="Assignment Options (Optional)"
      :toggleable="true"
      :collapsed="true"
      class="options-fieldset"
    >
      <div class="options-grid">
        <div class="option-field">
          <label for="effectiveStartOverride" class="option-label">
            Override Effective Start Date
          </label>
          <Calendar
            id="effectiveStartOverride"
            v-model="effectiveStartOverride"
            dateFormat="dd M yy"
            showIcon
            class="w-full"
          />
          <small class="option-hint">
            Leave empty to use template's effective date
          </small>
        </div>
        <div class="option-field">
          <label for="effectiveEndOverride" class="option-label">
            Override Effective End Date
          </label>
          <Calendar
            id="effectiveEndOverride"
            v-model="effectiveEndOverride"
            dateFormat="dd M yy"
            showIcon
            :minDate="effectiveStartOverride || undefined"
            class="w-full"
          />
          <small class="option-hint">
            Leave empty to use template's effective date
          </small>
        </div>
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
// PrimeVue Components
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import Calendar from 'primevue/calendar';
import Fieldset from 'primevue/fieldset';
import ProgressSpinner from 'primevue/progressspinner';
// Composables
import { useAssignments } from '../../composables';
import { useCriteriaBuilder } from '../../composables';
// Types
import type { CriteriaSet, User } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  templateId?: string | null;
  criteria?: CriteriaSet;
  initialSelectedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  templateId: null,
  criteria: undefined,
  initialSelectedIds: () => []
});

const emit = defineEmits<{
  (e: 'update', data: { userIds: string[]; mode: 'MANUAL' | 'CRITERIA' }): void;
  (e: 'goToCriteria'): void;
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const {
  availableUsers,
  loadingUsers,
  usersSearch,
  selectedUserIds,
  hasSelectedUsers,
  selectedCount,
  unassignedUsers,
  selectAllVisible,
  deselectAll,
  setSelectedUsers,
  setUsersFromCriteriaPreview,
  fetchAvailableUsers,
  effectiveStartOverride,
  effectiveEndOverride
} = useAssignments(props.templateId || undefined);

const {
  previewLoading,
  previewResult: criteriaPreviewResult,
  criteriaDescription,
  previewEligibleUsers,
  setCriteria
} = useCriteriaBuilder(props.templateId);

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const activeTab = ref(0);

// For DataTable selection binding
const selectedUsersForTable = ref<User[]>([]);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const hasCriteria = computed(() => {
  if (!props.criteria) return false;
  return props.criteria.groups.some((g) => g.rules.length > 0);
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function handleRowSelect(event: { data: User }): void {
  if (!selectedUserIds.value.includes(event.data.id)) {
    selectedUserIds.value.push(event.data.id);
    emitUpdate('MANUAL');
  }
}

function handleRowUnselect(event: { data: User }): void {
  const index = selectedUserIds.value.indexOf(event.data.id);
  if (index > -1) {
    selectedUserIds.value.splice(index, 1);
    emitUpdate('MANUAL');
  }
}

function handleSelectAll(): void {
  selectAllVisible();
  emitUpdate('MANUAL');
}

function handleClearSelection(): void {
  deselectAll();
  selectedUsersForTable.value = [];
  emitUpdate('MANUAL');
}

async function handlePreviewCriteria(): Promise<void> {
  if (props.criteria) {
    setCriteria(props.criteria);
  }
  await previewEligibleUsers();
}

function assignFromCriteria(): void {
  if (criteriaPreviewResult.value?.eligibleUserIds) {
    setUsersFromCriteriaPreview(criteriaPreviewResult.value.eligibleUserIds);
    emitUpdate('CRITERIA');
  }
}

function emitUpdate(mode: 'MANUAL' | 'CRITERIA'): void {
  emit('update', {
    userIds: [...selectedUserIds.value],
    mode
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getRowClass(data: User): string {
  return selectedUserIds.value.includes(data.id) ? 'row-selected' : '';
}

// ---------------------------------------------------------------------------
// WATCHERS
// ---------------------------------------------------------------------------

// Sync table selection with selectedUserIds
watch(
  selectedUserIds,
  (newIds) => {
    selectedUsersForTable.value = availableUsers.value.filter((u) =>
      newIds.includes(u.id)
    );
  },
  { immediate: true }
);

// Update criteria when prop changes
watch(
  () => props.criteria,
  (newCriteria) => {
    if (newCriteria) {
      setCriteria(newCriteria);
    }
  },
  { immediate: true }
);

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchAvailableUsers();

  // Initialize with provided selected IDs
  if (props.initialSelectedIds?.length) {
    setSelectedUsers(props.initialSelectedIds);
  }
});

// Expose methods
defineExpose({
  getSelectedUserIds: () => [...selectedUserIds.value],
  setSelectedUsers
});
</script>

<style scoped>
.assign-users-panel {
  max-width: 1000px;
}

/* Header */
.panel-header {
  margin-bottom: 1.5rem;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Tabs */
.assignment-tabs :deep(.p-tabview-nav) {
  border-bottom: 1px solid #e2e8f0;
}

.assignment-tabs :deep(.p-tabview-panels) {
  padding: 1.5rem 0;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-content {
  min-height: 400px;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 0.5rem;
}

/* Users Table */
.users-table {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
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

.user-info-simple {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* No Criteria State */
.no-criteria-state {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.info-icon {
  font-size: 1.5rem;
  color: #3b82f6;
  flex-shrink: 0;
}

.info-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.info-content p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
}

/* Criteria Preview Section */
.criteria-preview-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.criteria-summary-card {
  background-color: #f8fafc;
}

.criteria-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-icon {
  color: #3b82f6;
}

.summary-title {
  font-weight: 600;
  color: #1e293b;
}

.summary-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.preview-actions {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

/* Preview Results */
.preview-results-card {
  border: 1px solid #22c55e;
}

.preview-results-card :deep(.p-card-header) {
  padding: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
}

.preview-stat {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #166534;
}

.stat-label {
  font-size: 0.875rem;
  color: #22c55e;
}

.preview-table {
  font-size: 0.875rem;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #64748b;
}

/* Selection Summary */
.selection-summary {
  margin-top: 1.5rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
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
  color: #1e40af;
}

/* Options Fieldset */
.options-fieldset {
  margin-top: 1rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.option-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Row Selected */
:deep(.row-selected) {
  background-color: #eff6ff !important;
}

/* Responsive */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-field {
    min-width: 100%;
  }

  .search-actions {
    justify-content: flex-end;
  }

  .summary-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="allowance-template-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Allowance Templates</h1>
      <Button
        icon="pi pi-plus"
        class="p-button-text p-button-rounded add-btn"
        @click="navigateToCreate"
        v-tooltip.left="'Add Template'"
      />
    </div>

    <!-- Subtitle -->
    <p class="page-subtitle">
      Organize and manage allowance templates linked to the payroll application.
    </p>

    <!-- Status Tabs -->
    <div class="status-tabs">
      <button
        class="status-tab"
        :class="{ active: activeStatusTab === 'active' }"
        @click="activeStatusTab = 'active'"
      >
        Active
      </button>
      <button
        class="status-tab"
        :class="{ active: activeStatusTab === 'archived' }"
        @click="activeStatusTab = 'archived'"
      >
        Archived
      </button>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <!-- Data Table -->
      <DataTable
        :value="filteredTemplates"
        :loading="loading"
        dataKey="id"
        class="templates-table"
        :paginator="filteredTemplates.length > 10"
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        filterDisplay="row"
        v-model:filters="filters"
        scrollable
        scrollHeight="flex"
      >
        <!-- Code Column -->
        <Column field="code" header="Code" :sortable="true" :showFilterMenu="false" style="width: 10%">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder=""
              class="filter-input"
            />
          </template>
          <template #body="{ data }">
            <span class="code-text">{{ data.code }}</span>
          </template>
        </Column>

        <!-- Name Column -->
        <Column field="name" header="Name" :sortable="true" :showFilterMenu="false" style="width: 15%">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder=""
              class="filter-input"
            />
          </template>
          <template #body="{ data }">
            <router-link
              :to="{ name: 'allowance-template-details', params: { id: data.id } }"
              class="name-link"
            >
              {{ data.name }}
            </router-link>
          </template>
        </Column>

        <!-- Type Column -->
        <Column field="type" header="Type" :sortable="true" :showFilterMenu="false" style="width: 10%">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder=""
              class="filter-input"
            />
          </template>
          <template #body="{ data }">
            <span class="type-text">{{ getTypeLabel(data.type) }}</span>
          </template>
        </Column>

        <!-- Amount Column -->
        <Column field="amount" header="Amount" :sortable="true" :showFilterMenu="false" style="width: 15%">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder=""
              class="filter-input"
            />
          </template>
          <template #body="{ data }">
            <span class="amount-text">{{ formatAmount(data) }}</span>
          </template>
        </Column>

        <!-- Status Column -->
        <Column field="status" header="Status" :sortable="true" :showFilterMenu="false" style="width: 15%">
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="statusFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All"
              showClear
              class="filter-dropdown"
              @change="filterCallback()"
            />
          </template>
          <template #body="{ data }">
            <span :class="['status-text', getStatusClass(data.status)]">
              {{ data.status }}
            </span>
          </template>
        </Column>

        <!-- Action Column -->
        <Column header="Action" style="width: 10%">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-rounded p-button-sm action-btn"
                @click="navigateToEdit(data.id)"
                v-tooltip.top="'Edit'"
              />
              <Button
                v-if="data.status === 'ACTIVE'"
                icon="pi pi-inbox"
                class="p-button-text p-button-rounded p-button-sm action-btn archive-btn"
                @click="handleArchive(data.id)"
                v-tooltip.top="'Archive'"
              />
              <Button
                v-else
                icon="pi pi-replay"
                class="p-button-text p-button-rounded p-button-sm action-btn unarchive-btn"
                @click="handleUnarchive(data.id)"
                v-tooltip.top="'Restore'"
              />
            </div>
          </template>
        </Column>

        <!-- Empty State -->
        <template #empty>
          <div class="empty-state">
            <span>No templates found.</span>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog />

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from 'primevue/api';
// PrimeVue Components
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
// Composables
import { useAllowanceTemplates } from '../composables';
// Constants
import { ALLOWANCE_TYPE_OPTIONS } from '../constants';
// Types
import type { AllowanceTemplate, AllowanceType, AllowanceStatus } from '../types';

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const router = useRouter();

const {
  templates,
  loading,
  fetchTemplates,
  confirmArchive,
  unarchiveTemplate
} = useAllowanceTemplates();

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const activeStatusTab = ref<'active' | 'archived'>('active');

const filters = ref({
  code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  type: { value: null, matchMode: FilterMatchMode.CONTAINS },
  amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const statusFilterOptions = computed(() => [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' }
]);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const filteredTemplates = computed(() => {
  if (activeStatusTab.value === 'archived') {
    return templates.value.filter(t => t.status === 'ARCHIVED');
  }
  // Active tab shows ACTIVE statuses
  return templates.value.filter(t => t.status === 'ACTIVE');
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function navigateToCreate(): void {
  router.push({ name: 'allowance-template-create' });
}

function navigateToEdit(id: string): void {
  router.push({ name: 'allowance-template-edit', params: { id } });
}

function handleArchive(id: string): void {
  const template = templates.value.find(t => t.id === id);
  if (template) {
    confirmArchive(template);
  }
}

async function handleUnarchive(id: string): Promise<void> {
  const template = templates.value.find(t => t.id === id);
  if (template) {
    await unarchiveTemplate(template);
  }
}

// ---------------------------------------------------------------------------
// FORMATTERS
// ---------------------------------------------------------------------------

function getTypeLabel(type: AllowanceType): string {
  return ALLOWANCE_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

function getStatusClass(status: AllowanceStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'status-active';
    case 'ARCHIVED':
      return 'status-archived';
    default:
      return '';
  }
}

function formatAmount(template: AllowanceTemplate): string {
  if (template.amountMode === 'FORMULA') {
    return 'Formula';
  }

  const currencySymbols: Record<string, string> = {
    MYR: 'RM',
    SGD: 'S$',
    USD: '$'
  };
  const symbol = currencySymbols[template.currency] || template.currency;
  const amount = template.amount?.toLocaleString() || '0';

  switch (template.type) {
    case 'DAILY':
      return `${symbol}${amount}/day`;
    case 'MONTHLY':
      return `${symbol}${amount}/month`;
    case 'ONE_OFF':
      return `${symbol}${amount}`;
    default:
      return `${symbol}${amount}`;
  }
}

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped>
.allowance-template-list-page {
  background-color: #fff;
  border-radius: 12px;
  padding: 1.5rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* Subtitle */
.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
}

/* Status Tabs */
.status-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Table Card */
.table-card {
  position: relative;
}

.status-tab {
  padding: 0.625rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.status-tab:hover {
  color: #1e293b;
}

.status-tab.active {
  color: #3b82f6;
}

.status-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
}

.add-btn {
  color: #3b82f6 !important;
  width: 36px;
  height: 36px;
}

.add-btn:hover {
  background-color: #eff6ff !important;
}

/* Table Styles */
.templates-table {
  font-size: 0.875rem;
}

.templates-table :deep(.p-datatable-thead > tr > th) {
  background-color: #fff;
  color: #3b82f6;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 1px solid #e2e8f0;
}

.templates-table :deep(.p-datatable-tbody > tr) {
  border: none;
}

.templates-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.templates-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}

/* Filter Row */
.templates-table :deep(.p-column-filter-row) {
  padding: 0.5rem 1rem;
}

.filter-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
}

.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.filter-dropdown {
  width: 100%;
}

.filter-dropdown :deep(.p-dropdown) {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

/* Cell Styles */
.code-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8rem;
  color: #475569;
}

.name-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.name-link:hover {
  text-decoration: underline;
}

.type-text {
  color: #475569;
}

.amount-text {
  font-weight: 500;
  color: #1e293b;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: capitalize;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-archived {
  background-color: #f1f5f9;
  color: #64748b;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 32px;
  height: 32px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #94a3b8;
}

/* Paginator */
.templates-table :deep(.p-paginator) {
  padding: 1rem;
  border: none;
  background: transparent;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .allowance-template-list-page {
    padding: 1rem;
  }
}
</style>

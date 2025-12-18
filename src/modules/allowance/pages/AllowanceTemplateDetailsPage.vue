<template>
  <div class="allowance-template-details-page">
    <!-- Loading State -->
    <div v-if="loadingTemplate" class="loading-container">
      <ProgressSpinner />
      <p>Loading template...</p>
    </div>

    <!-- Content -->
    <template v-else-if="template">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <Button
            icon="pi pi-arrow-left"
            class="p-button-text p-button-sm back-button"
            @click="navigateBack"
          />
          <div class="header-content">
            <div class="title-row">
              <h1 class="page-title">{{ template.name }}</h1>
              <Tag
                :value="template.status"
                :severity="getStatusSeverity(template.status)"
                class="status-tag"
              />
            </div>
            <p class="page-subtitle">
              <span class="code-badge">{{ template.code }}</span>
              <span class="separator">•</span>
              <span>{{ getTypeLabel(template.type) }}</span>
              <span class="separator">•</span>
              <span>{{ template.assignmentCount || 0 }} assigned</span>
            </p>
          </div>
        </div>
        <div class="header-right">
          <Button
            v-if="template.status !== 'ARCHIVED'"
            label="Edit"
            icon="pi pi-pencil"
            class="p-button-outlined"
            @click="navigateToEdit"
          />
          <Button
            icon="pi pi-ellipsis-v"
            class="p-button-text"
            @click="toggleMenu"
            aria-haspopup="true"
          />
          <Menu ref="menuRef" :model="menuItems" :popup="true" />
        </div>
      </div>

      <!-- Tab Navigation -->
      <TabView v-model:activeIndex="activeTab" class="details-tabs">
        <!-- Info Tab -->
        <TabPanel header="Information">
          <div class="tab-content">
            <div class="info-sections">
              <!-- Basic Info -->
              <Card class="info-card">
                <template #title>
                  <div class="card-title">
                    <i class="pi pi-file-edit"></i>
                    Basic Information
                  </div>
                </template>
                <template #content>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Name</span>
                      <span class="info-value">{{ template.name }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Code</span>
                      <span class="info-value code">{{ template.code }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Type</span>
                      <Tag
                        :value="getTypeLabel(template.type)"
                        :style="{ backgroundColor: getTypeColor(template.type) }"
                      />
                    </div>
                    <div class="info-item">
                      <span class="info-label">Status</span>
                      <Tag
                        :value="template.status"
                        :severity="getStatusSeverity(template.status)"
                      />
                    </div>
                    <div v-if="template.description" class="info-item full-width">
                      <span class="info-label">Description</span>
                      <span class="info-value">{{ template.description }}</span>
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Amount Info -->
              <Card class="info-card">
                <template #title>
                  <div class="card-title">
                    <i class="pi pi-dollar"></i>
                    Amount Configuration
                  </div>
                </template>
                <template #content>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Amount Mode</span>
                      <span class="info-value">
                        {{ template.amountMode === 'FIXED' ? 'Fixed Amount' : 'Formula' }}
                      </span>
                    </div>
                    <div v-if="template.amountMode === 'FIXED'" class="info-item">
                      <span class="info-label">Amount</span>
                      <span class="info-value amount">
                        {{ formatAmount(template) }}
                      </span>
                    </div>
                    <div v-if="template.amountMode === 'FORMULA'" class="info-item full-width">
                      <span class="info-label">Formula</span>
                      <code class="formula-code">{{ template.formulaExpression }}</code>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Taxable</span>
                      <Tag
                        :value="template.taxable ? 'Yes' : 'No'"
                        :severity="template.taxable ? 'warning' : 'secondary'"
                      />
                    </div>
                    <div class="info-item">
                      <span class="info-label">Prorate</span>
                      <Tag
                        :value="template.prorate ? 'Enabled' : 'Disabled'"
                        :severity="template.prorate ? 'info' : 'secondary'"
                      />
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Effective Period -->
              <Card class="info-card">
                <template #title>
                  <div class="card-title">
                    <i class="pi pi-calendar"></i>
                    Effective Period
                  </div>
                </template>
                <template #content>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Start Date</span>
                      <span class="info-value">{{ formatDate(template.effectiveStart) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">End Date</span>
                      <span class="info-value">
                        {{ template.effectiveEnd ? formatDate(template.effectiveEnd) : 'Ongoing' }}
                      </span>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

        <!-- Criteria Tab -->
        <TabPanel header="Eligibility Criteria">
          <div class="tab-content">
            <Card v-if="!hasCriteria" class="empty-card">
              <template #content>
                <div class="empty-state">
                  <i class="pi pi-filter-slash empty-icon"></i>
                  <h4>No criteria defined</h4>
                  <p>All employees are eligible for this allowance.</p>
                </div>
              </template>
            </Card>

            <Card v-else class="criteria-card">
              <template #title>
                <div class="card-title">
                  <i class="pi pi-filter"></i>
                  Eligibility Rules
                </div>
              </template>
              <template #content>
                <div class="criteria-display">
                  <div
                    v-for="(group, gIndex) in template.criteria?.groups"
                    :key="group.id"
                    class="criteria-group-display"
                  >
                    <div v-if="gIndex > 0" class="group-connector-display">
                      <Tag :value="template.criteria?.groupOperator" severity="secondary" />
                    </div>
                    <div class="rules-display">
                      <div
                        v-for="(rule, rIndex) in group.rules"
                        :key="rule.id"
                        class="rule-display"
                      >
                        <span v-if="rIndex > 0" class="rule-connector-display">
                          {{ group.operator }}
                        </span>
                        <div class="rule-content-display">
                          <strong>{{ getFieldLabel(rule.field) }}</strong>
                          <span>{{ getOperatorLabel(rule.operator) }}</span>
                          <Tag :value="formatRuleValue(rule.value)" severity="info" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Assignments Tab -->
        <TabPanel>
          <template #header>
            <span>Assignments</span>
            <Badge
              :value="template.assignmentCount || 0"
              severity="info"
              class="tab-badge"
            />
          </template>
          <div class="tab-content">
            <!-- Assignment Actions -->
            <div class="assignments-header">
              <IconField iconPosition="left" class="search-field">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="assignmentSearch"
                  placeholder="Search assigned users..."
                  class="search-input"
                />
              </IconField>
              <Button
                v-if="template.status !== 'ARCHIVED'"
                label="Manage Assignments"
                icon="pi pi-user-plus"
                class="p-button-primary"
                @click="navigateToEdit"
              />
            </div>

            <!-- Assignments Table -->
            <DataTable
              :value="assignments"
              :loading="loadingAssignments"
              :paginator="true"
              :rows="10"
              :rowsPerPageOptions="[10, 25, 50]"
              responsiveLayout="scroll"
              class="assignments-table"
            >
              <template #empty>
                <div class="table-empty">
                  <i class="pi pi-users"></i>
                  <span>No users assigned yet</span>
                </div>
              </template>

              <Column field="userCode" header="Employee ID" sortable style="min-width: 120px" />
              <Column field="userName" header="Name" sortable style="min-width: 200px" />
              <Column field="userDepartment" header="Department" sortable style="min-width: 150px" />
              <Column field="userPosition" header="Position" sortable style="min-width: 150px" />
              <Column field="assignmentSource" header="Source" style="min-width: 100px">
                <template #body="{ data }">
                  <Tag
                    :value="data.assignmentSource"
                    :severity="data.assignmentSource === 'CRITERIA' ? 'success' : 'info'"
                  />
                </template>
              </Column>
              <Column field="assignedAt" header="Assigned" sortable style="min-width: 150px">
                <template #body="{ data }">
                  <span>{{ formatDate(data.assignedAt) }}</span>
                </template>
              </Column>
              <Column v-if="template.status !== 'ARCHIVED'" header="Actions" style="min-width: 80px">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    @click="confirmRemoveAssignment(data)"
                    v-tooltip.top="'Remove'"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <!-- Audit Tab -->
        <TabPanel header="Audit Log">
          <div class="tab-content">
            <Card class="audit-card">
              <template #content>
                <div class="audit-info">
                  <div class="audit-item">
                    <i class="pi pi-plus-circle audit-icon create"></i>
                    <div class="audit-content">
                      <span class="audit-label">Created</span>
                      <span class="audit-value">
                        {{ formatDate(template.createdAt) }} by {{ template.createdBy }}
                      </span>
                    </div>
                  </div>
                  <div class="audit-item">
                    <i class="pi pi-pencil audit-icon update"></i>
                    <div class="audit-content">
                      <span class="audit-label">Last Updated</span>
                      <span class="audit-value">
                        {{ formatDate(template.updatedAt) }} by {{ template.updatedBy }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>
      </TabView>
    </template>

    <!-- Not Found -->
    <div v-else class="not-found">
      <i class="pi pi-exclamation-triangle not-found-icon"></i>
      <h3>Template not found</h3>
      <p>The template you're looking for doesn't exist or has been deleted.</p>
      <Button
        label="Back to Templates"
        icon="pi pi-arrow-left"
        @click="navigateBack"
      />
    </div>

    <!-- Dialogs -->
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
// PrimeVue Components
import Button from 'primevue/button';
import Card from 'primevue/card';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Menu from 'primevue/menu';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
// Composables
import { useAllowanceTemplates, useAssignments } from '../composables';
// Constants
import {
  ALLOWANCE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  CRITERIA_FIELD_OPTIONS,
  CRITERIA_OPERATOR_LABELS,
  CURRENCY_OPTIONS
} from '../constants';
// Types
import type {
  AllowanceTemplate,
  AllowanceStatus,
  AllowanceType,
  CriteriaField,
  CriteriaOperator,
  CriteriaValue,
  AllowanceAssignment
} from '../types';

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

const props = defineProps<{
  id: string;
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const {
  selectedTemplate: template,
  loadingTemplate,
  fetchTemplate,
  duplicateTemplate,
  confirmArchive,
  unarchiveTemplate,
  confirmDelete
} = useAllowanceTemplates();

const {
  assignments,
  loadingAssignments,
  assignmentsSearch: assignmentSearch,
  fetchAssignments,
  confirmRemoveAssignment
} = useAssignments(props.id);

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const activeTab = ref(0);
const menuRef = ref();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const hasCriteria = computed(() => {
  if (!template.value?.criteria) return false;
  return template.value.criteria.groups.some((g) => g.rules.length > 0);
});

const menuItems = computed(() => {
  if (!template.value) return [];

  const items = [
    {
      label: 'Duplicate',
      icon: 'pi pi-copy',
      command: () => handleDuplicate()
    },
    { separator: true }
  ];

  if (template.value.status === 'ARCHIVED') {
    items.push({
      label: 'Unarchive',
      icon: 'pi pi-replay',
      command: () => handleUnarchive()
    });
  } else {
    items.push({
      label: 'Archive',
      icon: 'pi pi-inbox',
      command: () => handleArchive()
    });
  }

  items.push({
    label: 'Delete',
    icon: 'pi pi-trash',
    class: 'p-menuitem-danger',
    command: () => handleDelete()
  });

  return items;
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function navigateBack(): void {
  router.push({ name: 'allowance-templates' });
}

function navigateToEdit(): void {
  router.push({ name: 'allowance-template-edit', params: { id: props.id } });
}

function toggleMenu(event: Event): void {
  menuRef.value.toggle(event);
}

async function handleDuplicate(): Promise<void> {
  if (template.value) {
    await duplicateTemplate(template.value);
  }
}

function handleArchive(): void {
  if (template.value) {
    confirmArchive(template.value);
  }
}

async function handleUnarchive(): Promise<void> {
  if (template.value) {
    await unarchiveTemplate(template.value);
    await loadData();
  }
}

function handleDelete(): void {
  if (template.value) {
    confirmDelete(template.value);
  }
}

// ---------------------------------------------------------------------------
// FORMATTERS
// ---------------------------------------------------------------------------

function getTypeLabel(type: AllowanceType): string {
  return ALLOWANCE_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

function getTypeColor(type: AllowanceType): string {
  return ALLOWANCE_TYPE_OPTIONS.find((t) => t.value === type)?.color || '#6B7280';
}

function getStatusSeverity(status: AllowanceStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.severity || 'secondary';
}

function formatAmount(tpl: AllowanceTemplate): string {
  const currencyOption = CURRENCY_OPTIONS.find((c) => c.value === tpl.currency);
  const symbol = currencyOption?.symbol || tpl.currency;
  return `${symbol} ${tpl.amount?.toLocaleString() || '0'}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getFieldLabel(field: CriteriaField): string {
  return CRITERIA_FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
}

function getOperatorLabel(operator: CriteriaOperator): string {
  return CRITERIA_OPERATOR_LABELS[operator] || operator;
}

function formatRuleValue(value: CriteriaValue): string {
  if (Array.isArray(value)) {
    return value.length > 3
      ? `${value.slice(0, 3).join(', ')} +${value.length - 3}`
      : value.join(', ');
  }
  if (typeof value === 'object' && 'min' in value) {
    return `${value.min} - ${value.max}`;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------------

async function loadData(): Promise<void> {
  await Promise.all([
    fetchTemplate(props.id),
    fetchAssignments()
  ]);
}

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.allowance-template-details-page {
  padding: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.back-button {
  margin-top: 0.25rem;
}

.header-content {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.status-tag {
  text-transform: capitalize;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.code-badge {
  font-family: monospace;
  background-color: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.separator {
  color: #cbd5e1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Tabs */
.details-tabs :deep(.p-tabview-panels) {
  background-color: transparent;
  padding: 1.5rem 0;
}

.tab-badge {
  margin-left: 0.5rem;
}

.tab-content {
  min-height: 300px;
}

/* Info Sections */
.info-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  border-radius: 0.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.card-title i {
  color: #3b82f6;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.info-value {
  font-size: 0.875rem;
  color: #1e293b;
}

.info-value.code {
  font-family: monospace;
}

.info-value.amount {
  font-size: 1.125rem;
  font-weight: 600;
  color: #059669;
}

.formula-code {
  display: block;
  padding: 0.5rem 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

/* Criteria Display */
.criteria-display {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criteria-group-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-connector-display {
  display: flex;
  justify-content: center;
  padding: 0.25rem 0;
}

.rules-display {
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

.rule-display {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.rule-connector-display {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.rule-content-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

/* Assignments */
.assignments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-field {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.assignments-table {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #64748b;
}

.table-empty i {
  font-size: 2.5rem;
  color: #cbd5e1;
}

/* Audit */
.audit-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.audit-icon {
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.audit-icon.create {
  color: #22c55e;
  background-color: #f0fdf4;
}

.audit-icon.update {
  color: #3b82f6;
  background-color: #eff6ff;
}

.audit-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.audit-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
}

.audit-value {
  font-size: 0.875rem;
  color: #1e293b;
}

/* Empty States */
.empty-card {
  max-width: 500px;
  margin: 0 auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* Not Found */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.not-found-icon {
  font-size: 4rem;
  color: #fbbf24;
  margin-bottom: 1rem;
}

.not-found h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.not-found p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0 0 1.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .assignments-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-field {
    max-width: none;
  }
}
</style>

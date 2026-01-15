<template>
  <div class="report-page">
    <!-- Page Header with Title and Filters inline -->
    <div class="page-header">
      <h1 class="page-title">Generate Allowance Report</h1>
      <span class="close-btn" @click="goBack">
        <i class="pi pi-times"></i>
      </span>
    </div>

    <!-- Top Filter Bar -->
    <div class="filter-bar">
      <div class="filter-item">
        <label class="filter-label">Date Preset</label>
        <Dropdown
          v-model="datePreset"
          :options="datePresetOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select preset"
          class="filter-dropdown"
          @change="onDatePresetChange"
        />
      </div>

      <div class="filter-item">
        <label class="filter-label">Date Range</label>
        <Calendar
          v-model="dateRange"
          selectionMode="range"
          dateFormat="dd/mm/yy"
          placeholder="Select date range"
          showIcon
          class="filter-calendar"
        />
      </div>

      <div class="filter-item">
        <label class="filter-label">Allowance Template</label>
        <MultiSelect
          v-model="selectedTemplates"
          :options="templateOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select template"
          class="filter-multiselect"
          :maxSelectedLabels="2"
          selectedItemsLabel="{0} templates"
        />
      </div>

      <div class="filter-item">
        <label class="filter-label">Export Format</label>
        <Dropdown
          v-model="exportFormat"
          :options="exportFormatOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select format"
          class="filter-dropdown"
        />
      </div>

      <div class="filter-item filter-action">
        <Button
          label="Generate Report"
          icon="pi pi-download"
          class="generate-btn"
          @click="generateReport"
          :loading="isGenerating"
          :disabled="!isValidFilter || selectedEmployees.length === 0 || selectedTemplates.length === 0"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <DataTable
        v-model:selection="selectedEmployees"
        v-model:filters="filters"
        :value="employees"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        dataKey="id"
        filterDisplay="row"
        :loading="isLoading"
        scrollable
        scrollHeight="flex"
        class="report-table"
        :globalFilterFields="['code', 'name', 'position', 'department', 'branch']"
        tableStyle="table-layout: fixed; width: 100%"
      >
        <!-- Selection Column -->
        <Column selectionMode="multiple" headerStyle="width: 40px" />

        <!-- Employee Code -->
        <Column field="code" header="User ID" sortable style="width: 10%">
          <template #body="{ data }">
            <span class="code-text">{{ data.code }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              @input="filterCallback()"
              placeholder=""
              class="column-filter"
            />
          </template>
        </Column>

        <!-- Employee Name with Avatar -->
        <Column field="name" header="Name" sortable style="width: 22%">
          <template #body="{ data }">
            <div class="employee-cell">
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(data.name) }">
                {{ getInitials(data.name) }}
              </div>
              <span class="employee-name">{{ data.name }}</span>
            </div>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              @input="filterCallback()"
              placeholder=""
              class="column-filter"
            />
          </template>
        </Column>

        <!-- Status (Active/Inactive) -->
        <Column field="isConfirmed" header="Active Users" sortable style="width: 12%">
          <template #body="{ data }">
            <span class="status-icon" :class="{ active: data.isConfirmed, inactive: !data.isConfirmed }">
              <i :class="data.isConfirmed ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
            </span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="activeStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All"
              class="column-filter-dropdown"
              @change="filterCallback()"
              showClear
            />
          </template>
        </Column>

        <!-- Position/Designation -->
        <Column field="position" header="Designation" sortable style="width: 18%">
          <template #body="{ data }">
            <span class="ellipsis-text">{{ data.position || '-' }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="positionFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder=""
              class="column-filter-dropdown"
              @change="filterCallback()"
              showClear
              filter
            />
          </template>
        </Column>

        <!-- Company/Branch -->
        <Column field="branch" header="Company" sortable style="width: 15%">
          <template #body="{ data }">
            <span class="cell-text">{{ data.branch || '-' }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="branchFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder=""
              class="column-filter-dropdown"
              @change="filterCallback()"
              showClear
              filter
            />
          </template>
        </Column>

        <!-- Department -->
        <Column field="department" header="Division/Department" sortable style="width: 18%">
          <template #body="{ data }">
            <span class="cell-text">{{ data.department || '-' }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="departmentFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder=""
              class="column-filter-dropdown"
              @change="filterCallback()"
              showClear
              filter
            />
          </template>
        </Column>

        <!-- Clear Filters Column -->
        <Column style="width: 40px">
          <template #header>
            <Button
              icon="pi pi-filter-slash"
              severity="secondary"
              text
              rounded
              size="small"
              @click="clearColumnFilters"
              v-tooltip.top="'Clear all filters'"
            />
          </template>
        </Column>

        <!-- Empty message -->
        <template #empty>
          <div class="empty-table">
            <i class="pi pi-inbox"></i>
            <p>No employees found.</p>
          </div>
        </template>

        <!-- Loading message -->
        <template #loading>
          <div class="loading-table">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading employees...</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Selection Summary -->
    <div v-if="selectedEmployees.length > 0" class="selection-summary">
      <span class="summary-text">
        <i class="pi pi-users"></i>
        {{ selectedEmployees.length }} employee{{ selectedEmployees.length > 1 ? 's' : '' }} selected
      </span>
      <Button
        label="Clear Selection"
        icon="pi pi-times"
        severity="secondary"
        text
        size="small"
        @click="clearSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from 'primevue/api';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import { allowanceTemplateService } from '../services/allowanceTemplateService';
import type { AllowanceTemplate, User } from '../types';

const router = useRouter();

// Filter bar state
const datePreset = ref('today');
const dateRange = ref<Date[] | null>(null);
const exportFormat = ref('EXCEL');
const selectedTemplates = ref<string[]>([]);

// Table state
const selectedEmployees = ref<User[]>([]);
const isLoading = ref(false);
const isGenerating = ref(false);

// Data sources
const employees = ref<User[]>([]);
const templates = ref<AllowanceTemplate[]>([]);

// Template options for multi-select
const templateOptions = computed(() => {
  return templates.value.map(t => ({ label: t.name, value: t.id }));
});

// Column filters
const filters = ref({
  code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  isConfirmed: { value: null, matchMode: FilterMatchMode.EQUALS },
  position: { value: null, matchMode: FilterMatchMode.EQUALS },
  branch: { value: null, matchMode: FilterMatchMode.EQUALS },
  department: { value: null, matchMode: FilterMatchMode.EQUALS }
});

// Filter options
const datePresetOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Custom', value: 'custom' }
];

const exportFormatOptions = [
  { label: 'Excel', value: 'EXCEL' },
  { label: 'PDF', value: 'PDF' },
  { label: 'TXT', value: 'TXT' }
];

const activeStatusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
];

// Dynamic filter options based on data
const positionFilterOptions = computed(() => {
  const uniquePositions = [...new Set(employees.value.map(e => e.position).filter(Boolean))];
  return uniquePositions.map(pos => ({ label: pos, value: pos }));
});

const branchFilterOptions = computed(() => {
  const uniqueBranches = [...new Set(employees.value.map(e => e.branch).filter(Boolean))];
  return uniqueBranches.map(branch => ({ label: branch, value: branch }));
});

const departmentFilterOptions = computed(() => {
  const uniqueDepts = [...new Set(employees.value.map(e => e.department).filter(Boolean))];
  return uniqueDepts.map(dept => ({ label: dept, value: dept }));
});

// Validation
const isValidFilter = computed(() => {
  if (datePreset.value === 'custom') {
    return dateRange.value && dateRange.value.length === 2;
  }
  return true;
});

// Avatar colors
const avatarColors = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3d8', '#60a5fa', '#a78bfa', '#f472b6', '#94a3b8'
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Date preset change handler
function onDatePresetChange() {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (datePreset.value) {
    case 'today':
      start = new Date(now);
      end = new Date(now);
      break;
    case 'thisWeek':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'custom':
      return;
    default:
      start = new Date(now);
      end = new Date(now);
  }

  dateRange.value = [start, end];
}

// Load data on mount
onMounted(async () => {
  onDatePresetChange();
  await Promise.all([loadEmployees(), loadTemplates()]);
});

async function loadEmployees() {
  isLoading.value = true;
  try {
    const response = await allowanceTemplateService.getUsers({ limit: 100 });
    employees.value = response.data;
  } catch (error) {
    console.error('Failed to load employees:', error);
  } finally {
    isLoading.value = false;
  }
}

async function loadTemplates() {
  try {
    const response = await allowanceTemplateService.getTemplates({
      limit: 100,
      status: 'ACTIVE' as any
    });
    templates.value = response.data;
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

async function generateReport() {
  if (!isValidFilter.value || selectedEmployees.value.length === 0 || selectedTemplates.value.length === 0) return;

  isGenerating.value = true;

  try {
    // Get date range
    const [startDate, endDate] = dateRange.value || [new Date(), new Date()];

    // Get selected templates
    const selectedAllowances = templates.value.filter(t => selectedTemplates.value.includes(t.id));

    // Generate report data based on selected employees and templates
    const reportData = generateReportData(selectedEmployees.value, selectedAllowances, startDate, endDate);

    if (exportFormat.value === 'EXCEL') {
      await exportExcel(reportData, selectedAllowances);
    } else if (exportFormat.value === 'TXT') {
      await exportTxt(reportData, selectedAllowances);
    } else if (exportFormat.value === 'PDF') {
      alert('PDF export coming soon!');
    }
  } catch (error) {
    console.error('Failed to generate report:', error);
  } finally {
    isGenerating.value = false;
  }
}

interface EmployeeAllowanceRow {
  employeeCode: string;
  employeeName: string;
  department: string;
  allowances: Record<string, number>; // allowanceId -> amount
  totalAmount: number;
}

function generateReportData(
  selectedUsers: User[],
  selectedAllowances: AllowanceTemplate[],
  startDate: Date,
  endDate: Date
): EmployeeAllowanceRow[] {
  const results: EmployeeAllowanceRow[] = [];

  for (const employee of selectedUsers) {
    const allowances: Record<string, number> = {};
    let totalAmount = 0;

    for (const template of selectedAllowances) {
      let amount = 0;

      if (template.type === 'DAILY') {
        // Calculate working days in range (mock)
        const eligibleDays = calculateWorkingDays(startDate, endDate);
        amount = eligibleDays * template.amount;
      } else if (template.type === 'MONTHLY') {
        // Full monthly amount
        amount = template.amount;
      } else if (template.type === 'ONE_OFF') {
        // One-time amount
        amount = template.amount;
      }

      allowances[template.id] = amount;
      totalAmount += amount;
    }

    results.push({
      employeeCode: employee.code,
      employeeName: employee.name,
      department: employee.department,
      allowances,
      totalAmount
    });
  }

  return results;
}

function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Simulate some random attendance (80-100% of working days)
  return Math.floor(count * (0.8 + Math.random() * 0.2));
}

async function exportExcel(data: EmployeeAllowanceRow[], selectedAllowances: AllowanceTemplate[]) {
  try {
    const XLSX = await import('xlsx');

    // Build dynamic columns: Employee Code, Employee Name, Department, [Allowance Names...], Total Amount
    const exportData = data.map(row => {
      const rowData: Record<string, string | number> = {
        'Employee Code': row.employeeCode,
        'Employee Name': row.employeeName,
        'Department': row.department
      };

      // Add each selected allowance as a column
      for (const template of selectedAllowances) {
        rowData[template.name] = row.allowances[template.id]?.toFixed(2) || '0.00';
      }

      rowData['Total Amount'] = row.totalAmount.toFixed(2);
      return rowData;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths dynamically
    const colWidths = [
      { wch: 15 },  // Employee Code
      { wch: 25 },  // Employee Name
      { wch: 20 },  // Department
      ...selectedAllowances.map(() => ({ wch: 18 })),  // Each allowance column
      { wch: 15 }   // Total Amount
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Allowance Report');

    const filename = `Allowance_Report_${formatDateForFile(new Date())}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Failed to export Excel:', error);
  }
}

async function exportTxt(data: EmployeeAllowanceRow[], selectedAllowances: AllowanceTemplate[]) {
  // Build headers: Employee Code, Employee Name, Department, [Allowance Names...], Total Amount
  const headers = [
    'Employee Code',
    'Employee Name',
    'Department',
    ...selectedAllowances.map(t => t.name),
    'Total Amount'
  ].join('\t');

  const rows = data.map(row => [
    row.employeeCode,
    row.employeeName,
    row.department,
    ...selectedAllowances.map(t => row.allowances[t.id]?.toFixed(2) || '0.00'),
    row.totalAmount.toFixed(2)
  ].join('\t'));

  const content = [headers, ...rows].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Allowance_Report_${formatDateForFile(new Date())}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearColumnFilters() {
  filters.value = {
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    isConfirmed: { value: null, matchMode: FilterMatchMode.EQUALS },
    position: { value: null, matchMode: FilterMatchMode.EQUALS },
    branch: { value: null, matchMode: FilterMatchMode.EQUALS },
    department: { value: null, matchMode: FilterMatchMode.EQUALS }
  };
}

function clearSelection() {
  selectedEmployees.value = [];
}

function goBack() {
  router.back();
}

function formatDateForFile(date: Date): string {
  return date.toISOString().split('T')[0];
}
</script>

<style scoped>
.report-page {
  background: #fff;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  max-height: 100%;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.filter-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.filter-dropdown {
  min-width: 100px;
}

.filter-calendar {
  min-width: 180px;
}

.filter-action {
  margin-left: auto;
}

.generate-btn {
  background: #3b82f6;
  border-color: #3b82f6;
  font-weight: 500;
  font-size: 0.8125rem;
  padding: 0.375rem 1rem;
  height: 32px;
}

.generate-btn:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table Container */
.table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
}

/* Table Styling */
.report-table {
  font-size: 0.8125rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

:deep(.p-datatable) {
  border: none;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

:deep(.p-datatable-wrapper) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.p-datatable-table) {
  table-layout: fixed;
  width: 100%;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #fff;
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.65rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  border-top: none;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.35rem 0.5rem;
  border: none;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
  background: #eff6ff;
}

/* Column Filter Inputs */
:deep(.p-datatable-filter-row > th) {
  padding: 0.25rem 0.5rem !important;
  background: #fff !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.column-filter {
  width: 100%;
  padding: 0.25rem 0.375rem;
  font-size: 0.6875rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
}

.column-filter:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.column-filter-dropdown {
  width: 100%;
}

:deep(.column-filter-dropdown .p-dropdown) {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

:deep(.column-filter-dropdown .p-dropdown .p-dropdown-label) {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

:deep(.column-filter-dropdown .p-dropdown:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Employee Cell with Avatar */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5625rem;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.75rem;
}

/* Code Text */
.code-text {
  font-family: monospace;
  font-size: 0.75rem;
  color: #475569;
}

/* Status Icon */
.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-icon i {
  font-size: 1.125rem;
}

.status-icon.active i {
  color: #22c55e;
}

.status-icon.inactive i {
  color: #ef4444;
}

/* Ellipsis Text */
.ellipsis-text,
.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  font-size: 0.75rem;
}

/* Empty/Loading State */
.empty-table,
.loading-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #94a3b8;
}

.empty-table i,
.loading-table i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-table p,
.loading-table p {
  margin: 0;
  font-size: 0.8125rem;
}

/* Selection Summary */
.selection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  background: #eff6ff;
  border-top: 1px solid #bfdbfe;
  flex-shrink: 0;
}

.summary-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1d4ed8;
}

.summary-text i {
  font-size: 0.875rem;
}

/* Checkbox styling */
:deep(.p-checkbox .p-checkbox-box) {
  border-color: #cbd5e1;
  border-radius: 4px;
  width: 18px;
  height: 18px;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #3b82f6;
  border-color: #3b82f6;
}

/* Paginator */
:deep(.p-paginator) {
  padding: 0.5rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  min-width: 2rem;
  height: 2rem;
  font-size: 0.8125rem;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: #3b82f6;
  color: #fff;
}

:deep(.p-paginator .p-dropdown) {
  height: 2rem;
}

:deep(.p-paginator .p-dropdown .p-dropdown-label) {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}

/* Filter bar controls - consistent sizing */
:deep(.filter-dropdown .p-dropdown) {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

:deep(.filter-dropdown .p-dropdown .p-dropdown-label) {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.25;
}

:deep(.filter-dropdown .p-dropdown .p-dropdown-trigger) {
  width: 2rem;
}

:deep(.filter-calendar .p-calendar) {
  height: 32px;
}

:deep(.filter-calendar .p-calendar .p-inputtext) {
  height: 32px !important;
  padding: 0 0.625rem !important;
  font-size: 0.8125rem;
  border-radius: 4px 0 0 4px;
  border: 1px solid #e2e8f0;
}

:deep(.filter-calendar .p-calendar .p-datepicker-trigger) {
  width: 32px;
  height: 32px !important;
  padding: 0;
  border-radius: 0 4px 4px 0;
}

:deep(.filter-calendar .p-calendar .p-datepicker-trigger .p-button-icon) {
  font-size: 0.875rem;
}

/* MultiSelect styling */
.filter-multiselect {
  min-width: 180px;
}

:deep(.filter-multiselect .p-multiselect) {
  height: 32px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

:deep(.filter-multiselect .p-multiselect .p-multiselect-label) {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.25;
}

:deep(.filter-multiselect .p-multiselect .p-multiselect-trigger) {
  width: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    width: 100%;
  }

  .filter-action {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .filter-dropdown,
  .filter-calendar {
    min-width: 100%;
  }
}
</style>

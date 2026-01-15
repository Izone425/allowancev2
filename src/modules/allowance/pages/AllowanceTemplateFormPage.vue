<template>
  <div class="allowance-template-form-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          class="p-button-text p-button-sm back-button"
          @click="handleBack"
        />
        <div class="header-content">
          <h1 class="page-title">
            {{ pageTitle }}
          </h1>
          <p class="page-subtitle">
            {{ pageSubtitle }}
          </p>
        </div>
      </div>
      <div class="header-right">
        <Tag
          v-if="formData.status && !isViewMode"
          :value="formData.status"
          :severity="getStatusSeverity(formData.status)"
        />
        <Button
          v-if="isViewMode && formData.status !== 'ARCHIVED'"
          icon="pi pi-pencil"
          class="edit-fab-button"
          @click="switchToEditMode"
          v-tooltip.left="'Edit Template'"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingTemplate" class="loading-container">
      <ProgressSpinner />
      <p>Loading template...</p>
    </div>

    <!-- Wizard -->
    <Card v-else class="wizard-card">
      <template #content>
        <!-- Stepper Header -->
        <div class="stepper-header">
          <div
            v-for="(step, index) in steps"
            :key="step.key"
            class="step-item"
            :class="{
              'step-active': currentStep === index,
              'step-completed': currentStep > index,
              'step-clickable': canNavigateToStep(index)
            }"
            @click="handleStepClick(index)"
          >
            <div class="step-indicator">
              <i v-if="currentStep > index" class="pi pi-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <span class="step-label">{{ step.label }}</span>
              <span class="step-description">{{ step.description }}</span>
            </div>
          </div>
        </div>

        <Divider />

        <!-- Step Content -->
        <div class="step-body">
          <!-- Step 1: General (Basic Info + Template Info) -->
          <div v-if="currentStep === 0">
            <!-- Copy From Template Section (only in create mode) -->
            <CopyFromTemplateSection
              v-if="!isViewMode"
              ref="copyFromSectionRef"
              :templates="availableTemplates"
              :loading="loadingTemplates"
              :disabled="isEditMode"
              @select="handleCopyFromTemplate"
            />

            <!-- Basic Info Section -->
            <BasicInfoSection
              :form-data="formData"
              :errors="errors"
              :code-check-loading="codeCheckLoading"
              :code-check-result="codeCheckResult"
              :is-edit-mode="isEditMode"
              :readonly="isViewMode"
              @update="handleFormUpdate"
              @blur="handleFieldBlur"
            />

            <!-- Template Info Form -->
            <TemplateInfoForm
              :form-data="formData"
              :errors="errors"
              :readonly="isViewMode"
              @update="handleFormUpdate"
              @blur="handleFieldBlur"
            />
          </div>

          <!-- Step 2: Assign Employee -->
          <AssignUsersPanel
            v-if="currentStep === 1"
            ref="assignUsersPanelRef"
            :template-id="templateId"
            :criteria="criteriaData"
            :initial-selected-ids="selectedUserIds"
            :readonly="isViewMode"
            @update="handleAssignmentUpdate"
          />
        </div>

        <!-- Step Footer -->
        <Divider />

        <div class="step-footer">
          <div class="footer-left">
            <Button
              v-if="currentStep > 0"
              label="Back"
              icon="pi pi-arrow-left"
              class="p-button-secondary"
              @click="goToPreviousStep"
            />
          </div>
          <div class="footer-right">
            <!-- View mode: only show navigation buttons -->
            <template v-if="isViewMode">
              <Button
                v-if="currentStep < steps.length - 1"
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                class="p-button-primary"
                @click="goToNextStep"
              />
            </template>
            <!-- Edit/Create mode: show validation and save buttons -->
            <template v-else>
              <Button
                v-if="currentStep < steps.length - 1"
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                class="p-button-primary"
                :disabled="!isCurrentStepValid"
                @click="goToNextStep"
              />
              <Button
                v-else
                label="Save"
                icon="pi pi-check"
                class="p-button-success"
                :loading="saving"
                :disabled="!isFormValid"
                @click="handleSaveAndActivate"
              />
            </template>
          </div>
        </div>
      </template>
    </Card>

    <!-- Unsaved Changes Dialog -->
    <Dialog
      v-model:visible="showUnsavedDialog"
      header="Unsaved Changes"
      :modal="true"
      :closable="false"
      class="unsaved-dialog"
    >
      <p>You have unsaved changes. What would you like to do?</p>
      <template #footer>
        <Button
          label="Discard"
          icon="pi pi-times"
          class="p-button-text"
          @click="discardAndLeave"
        />
        <Button
          label="Continue Editing"
          icon="pi pi-pencil"
          class="p-button-primary"
          @click="showUnsavedDialog = false"
        />
      </template>
    </Dialog>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { useToast } from 'primevue/usetoast';
// PrimeVue Components
import Button from 'primevue/button';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
// Components
import BasicInfoSection from '../components/wizard/BasicInfoSection.vue';
import TemplateInfoForm from '../components/wizard/TemplateInfoForm.vue';
import AssignUsersPanel from '../components/assignment/AssignUsersPanel.vue';
import CopyFromTemplateSection from '../components/wizard/CopyFromTemplateSection.vue';
// Composables
import { useFormValidation } from '../composables';
// Services
import { allowanceTemplateService } from '../services/allowanceTemplateService';
// Constants
import { WIZARD_STEPS, STATUS_OPTIONS } from '../constants';
// Types
import type {
  AllowanceTemplate,
  CriteriaSet,
  TemplateInfoFormData,
  CreateAllowanceTemplateRequest,
  AttendanceCriteriaSet
} from '../types';
import { CriteriaGroupOperator, DailyCalculationMode, AllowanceStatus, OneOffFrequency, ServicePeriodUnit } from '../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

const props = defineProps<{
  id?: string;
  mode?: 'view' | 'edit' | 'create';
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const router = useRouter();
const route = useRoute();
const toast = useToast();

const {
  formData,
  errors,
  isDirty,
  codeCheckLoading,
  codeCheckResult,
  validateStep,
  validateAll,
  setFormData,
  updateField,
  resetForm,
  setTouched,
  touchAll,
  populateFromTemplate
} = useFormValidation(props.id || null);

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const currentStep = ref(0);
const steps = WIZARD_STEPS;

// Template data
const templateId = computed(() => props.id || (route.params.id as string) || null);
const isViewMode = computed(() => props.mode === 'view' || route.query.mode === 'view');
const isEditMode = computed(() => !!templateId.value && !isViewMode.value);
const isCreateMode = computed(() => !templateId.value);
const loadingTemplate = ref(false);

// Page title and subtitle based on mode
const pageTitle = computed(() => {
  if (isViewMode.value) return formData.value.name || 'Allowance Template';
  if (isEditMode.value) return 'Edit Allowance Template';
  return 'Create Allowance Template';
});

const pageSubtitle = computed(() => {
  if (isViewMode.value) return formData.value.code || '';
  if (isEditMode.value) return formData.value.name || 'Untitled';
  return 'Configure a new allowance for your organization';
});

// Criteria state
const criteriaData = ref<CriteriaSet>({
  groupOperator: 'AND',
  groups: []
});

// Assignment state
const selectedUserIds = ref<string[]>([]);
const assignmentMode = ref<'MANUAL' | 'CRITERIA'>('MANUAL');
const assignUsersPanelRef = ref();

// Copy from template state
const availableTemplates = ref<AllowanceTemplate[]>([]);
const loadingTemplates = ref(false);
const copyFromSectionRef = ref();

// Save state
const saving = ref(false);

// Unsaved changes
const showUnsavedDialog = ref(false);
const pendingNavigation = ref<(() => void) | null>(null);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const isCurrentStepValid = computed(() => {
  if (currentStep.value === 0) {
    const result = validateStep(0);
    return result.isValid && codeCheckResult.value !== false;
  }
  if (currentStep.value === 1) {
    // Assignments are optional
    return true;
  }
  return true;
});

const isFormValid = computed(() => {
  const result = validateAll();
  return result.isValid;
});

// In view mode, there are no unsaved changes since nothing can be edited
const hasUnsavedChanges = computed(() => !isViewMode.value && isDirty.value);

// ---------------------------------------------------------------------------
// METHODS - Navigation
// ---------------------------------------------------------------------------

function goToNextStep(): void {
  if (currentStep.value < steps.length - 1 && isCurrentStepValid.value) {
    currentStep.value++;
  }
}

function goToPreviousStep(): void {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function goToStep(stepIndex: number): void {
  if (canNavigateToStep(stepIndex)) {
    currentStep.value = stepIndex;
  }
}

function canNavigateToStep(stepIndex: number): boolean {
  // Can always go back
  if (stepIndex < currentStep.value) return true;
  // Can only go forward if all previous steps are valid
  for (let i = 0; i < stepIndex; i++) {
    const result = validateStep(i);
    if (!result.isValid) return false;
  }
  return true;
}

function handleStepClick(stepIndex: number): void {
  if (canNavigateToStep(stepIndex)) {
    goToStep(stepIndex);
  }
}

function handleBack(): void {
  if (hasUnsavedChanges.value) {
    pendingNavigation.value = () => router.push({ name: 'allowance-templates' });
    showUnsavedDialog.value = true;
  } else {
    router.push({ name: 'allowance-templates' });
  }
}

function switchToEditMode(): void {
  if (templateId.value) {
    router.push({ name: 'allowance-template-edit', params: { id: templateId.value } });
  }
}

function discardAndLeave(): void {
  showUnsavedDialog.value = false;
  resetForm();
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
}

// ---------------------------------------------------------------------------
// METHODS - Form Handling
// ---------------------------------------------------------------------------

function handleFormUpdate(field: keyof TemplateInfoFormData, value: any): void {
  updateField(field, value);
}

function handleFieldBlur(field: string): void {
  setTouched(field);
}

function handleAssignmentUpdate(data: { userIds: string[]; mode: 'MANUAL' | 'CRITERIA' }): void {
  selectedUserIds.value = data.userIds;
  assignmentMode.value = data.mode;
}

// ---------------------------------------------------------------------------
// METHODS - Copy From Template
// ---------------------------------------------------------------------------

async function loadAvailableTemplates(): Promise<void> {
  loadingTemplates.value = true;
  try {
    const response = await allowanceTemplateService.getTemplates({
      status: AllowanceStatus.ACTIVE,
      page: 1,
      limit: 100
    });
    availableTemplates.value = response.data;
  } catch (e) {
    console.error('Failed to load templates for copy:', e);
    availableTemplates.value = [];
  } finally {
    loadingTemplates.value = false;
  }
}

async function handleCopyFromTemplate(templateId: string | null): Promise<void> {
  if (!templateId) {
    // User cleared the selection - reset form
    resetForm();
    return;
  }

  try {
    const template = await allowanceTemplateService.getTemplate(templateId);
    populateFromTemplate(template);

    // Also copy criteria if present
    if (template.criteria) {
      criteriaData.value = { ...template.criteria };
    }

    toast.add({
      severity: 'success',
      summary: 'Template Loaded',
      detail: `Data from "${template.name}" has been loaded. You can modify as needed.`,
      life: 3000
    });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load template data',
      life: 5000
    });
  }
}

// ---------------------------------------------------------------------------
// METHODS - Save Operations
// ---------------------------------------------------------------------------

async function handleSaveAndActivate(): Promise<void> {
  touchAll();
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the errors before activating',
      life: 3000
    });
    return;
  }

  saving.value = true;
  try {
    const template = await saveTemplate('ACTIVE');

    // If we have assignments, bulk assign them
    if (selectedUserIds.value.length > 0 && template.id) {
      await allowanceTemplateService.assignUsers(template.id, {
        userIds: selectedUserIds.value,
        source: assignmentMode.value
      });
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template created and activated',
      life: 3000
    });

    // Reset dirty flag to prevent "Unsaved Changes" dialog
    isDirty.value = false;

    // Navigate to list page
    router.push({ name: 'allowance-templates' });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: (e as Error).message || 'Failed to save template',
      life: 5000
    });
  } finally {
    saving.value = false;
  }
}

async function saveTemplate(status: AllowanceStatus): Promise<AllowanceTemplate> {
  const payload: CreateAllowanceTemplateRequest = {
    name: formData.value.name,
    code: formData.value.code,
    description: formData.value.description || undefined,
    type: formData.value.type!,
    amountMode: formData.value.amountMode,
    amount: formData.value.amount || 0,
    formulaExpression: formData.value.formulaExpression || undefined,
    formulaVariables: formData.value.formulaVariables || undefined,
    currency: formData.value.currency,
    taxable: formData.value.taxable,
    prorate: formData.value.prorate,
    // Daily specific
    dailyCalculationMode: formData.value.dailyCalculationMode,
    ratePerDay: formData.value.ratePerDay || undefined,
    includeNonWorkingDays: formData.value.includeNonWorkingDays,
    applyOnNormalWorkday: formData.value.applyOnNormalWorkday,
    applyOnRestday: formData.value.applyOnRestday,
    applyOnOffday: formData.value.applyOnOffday,
    applyOnHoliday: formData.value.applyOnHoliday,
    filterByShift: formData.value.filterByShift,
    applyOnShifts: formData.value.applyOnShifts,
    filterByWorkLocation: formData.value.filterByWorkLocation,
    applyOnWorkLocations: formData.value.applyOnWorkLocations,
    hourlyRateConfig: formData.value.hourlyRateConfig,
    // Payroll Integration
    computeToPayroll: formData.value.computeToPayroll,
    payrollAdditionalItem: formData.value.computeToPayroll ? (formData.value.payrollAdditionalItem || undefined) : undefined,
    allowanceName: !formData.value.computeToPayroll ? (formData.value.allowanceName || undefined) : undefined,
    // Attendance criteria (for Daily and Monthly types)
    attendanceCriteria: formData.value.attendanceCriteria?.groups?.length > 0
      ? formData.value.attendanceCriteria
      : undefined,
    // Monthly specific
    prorateByJoinDate: formData.value.prorateByJoinDate,
    prorateByLeaveDate: formData.value.prorateByLeaveDate,
    monthlyCriteria: formData.value.monthlyCriteria,
    // One-off specific
    oneOffFrequency: formData.value.oneOffFrequency,
    payoutDate: formData.value.payoutDate?.toISOString().split('T')[0] || undefined,
    payoutMonth: formData.value.payoutMonth || undefined,
    serviceEligibility: formData.value.serviceEligibility,
    // Common
    effectiveStart: formData.value.effectiveStart?.toISOString().split('T')[0] || '',
    effectiveEnd: formData.value.effectiveEnd?.toISOString().split('T')[0] || undefined,
    status,
    criteria: criteriaData.value.groups.length > 0 ? criteriaData.value : undefined
  };

  if (isEditMode.value && templateId.value) {
    return allowanceTemplateService.updateTemplate(templateId.value, {
      ...payload,
      id: templateId.value
    });
  } else {
    return allowanceTemplateService.createTemplate(payload);
  }
}

// ---------------------------------------------------------------------------
// METHODS - Load Template
// ---------------------------------------------------------------------------

async function loadTemplate(): Promise<void> {
  if (!templateId.value) return;

  loadingTemplate.value = true;
  try {
    const template = await allowanceTemplateService.getTemplate(templateId.value);

    // Default attendance criteria
    const defaultAttendanceCriteria: AttendanceCriteriaSet = {
      groupOperator: CriteriaGroupOperator.AND,
      groups: []
    };

    // Default hourly rate config
    const defaultHourlyRateConfig = {
      ratePerHour: 0,
      dailyCap: null,
      minWorkingHours: null
    };

    // Default monthly criteria
    const defaultMonthlyCriteria = {
      minAttendanceDays: null,
      attendanceDaysCondition: 'GREATER_THAN_OR_EQUALS',
      maxLateTimes: null,
      lateTimesCondition: 'LESS_THAN_OR_EQUALS',
      maxAbsentDays: null,
      absentDaysCondition: 'LESS_THAN_OR_EQUALS',
      requirePerfectAttendance: false
    };

    // Default service eligibility
    const defaultServiceEligibility = {
      minServicePeriod: null,
      minServicePeriodUnit: ServicePeriodUnit.MONTHS,
      serviceMilestones: [],
      prorateByServicePeriod: false
    };

    // Map template to form data
    setFormData({
      name: template.name,
      code: template.code,
      description: template.description || '',
      type: template.type,
      amountMode: template.amountMode,
      amount: template.amount,
      formulaExpression: template.formulaExpression || '',
      formulaVariables: template.formulaVariables || [],
      currency: template.currency,
      taxable: template.taxable,
      prorate: template.prorate ?? false,
      // Payroll Integration
      computeToPayroll: template.computeToPayroll ?? false,
      payrollAdditionalItem: template.payrollAdditionalItem || '',
      allowanceName: template.allowanceName || '',
      // Daily specific
      dailyCalculationMode: template.dailyCalculationMode || DailyCalculationMode.FIXED_DAILY,
      ratePerDay: template.ratePerDay || null,
      includeNonWorkingDays: template.includeNonWorkingDays || false,
      applyOnNormalWorkday: template.applyOnNormalWorkday ?? true,
      applyOnRestday: template.applyOnRestday || false,
      applyOnOffday: template.applyOnOffday || false,
      applyOnHoliday: template.applyOnHoliday || false,
      filterByShift: template.filterByShift || false,
      applyOnShifts: template.applyOnShifts || [],
      filterByWorkLocation: template.filterByWorkLocation || false,
      applyOnWorkLocations: template.applyOnWorkLocations || [],
      hourlyRateConfig: template.hourlyRateConfig || defaultHourlyRateConfig,
      // Monthly specific
      prorateByJoinDate: template.prorateByJoinDate ?? false,
      prorateByLeaveDate: template.prorateByLeaveDate ?? false,
      monthlyCriteria: template.monthlyCriteria || defaultMonthlyCriteria,
      // One-off specific
      oneOffFrequency: template.oneOffFrequency || OneOffFrequency.YEARLY,
      payoutDate: template.payoutDate ? new Date(template.payoutDate) : null,
      payoutMonth: template.payoutMonth || '',
      serviceEligibility: template.serviceEligibility || defaultServiceEligibility,
      // Common
      effectiveStart: template.effectiveStart ? new Date(template.effectiveStart) : null,
      effectiveEnd: template.effectiveEnd ? new Date(template.effectiveEnd) : null,
      status: template.status,
      attendanceCriteria: template.attendanceCriteria || defaultAttendanceCriteria
    });

    // Load criteria
    if (template.criteria) {
      criteriaData.value = template.criteria;
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load template',
      life: 5000
    });
    router.push({ name: 'allowance-templates' });
  } finally {
    loadingTemplate.value = false;
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getStatusSeverity(status: AllowanceStatus): string {
  const option = STATUS_OPTIONS.find((s) => s.value === status);
  return option?.severity || 'secondary';
}

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  if (isEditMode.value || isViewMode.value) {
    // Load template data for both edit and view modes
    loadTemplate();
  } else {
    // Load available templates for copy dropdown (only in create mode)
    loadAvailableTemplates();
  }
});

// Warn on navigation with unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value && !saving.value) {
    pendingNavigation.value = () => next();
    showUnsavedDialog.value = true;
    next(false);
  } else {
    next();
  }
});
</script>

<style scoped>
.allowance-template-form-page {
  padding: 1rem 1.25rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.back-button {
  margin-top: 0.125rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.125rem 0;
}

.page-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Floating Edit Button */
.edit-fab-button {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
  border-radius: 50% !important;
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.edit-fab-button:hover {
  background-color: #e2e8f0 !important;
  color: #475569 !important;
  border-color: #cbd5e1 !important;
}

.edit-fab-button .pi {
  font-size: 0.875rem;
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

/* Wizard Card */
.wizard-card {
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Stepper Header */
.stepper-header {
  display: flex;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: default;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.step-item.step-active,
.step-item.step-completed {
  opacity: 1;
}

.step-item.step-clickable {
  cursor: pointer;
}

.step-item.step-clickable:hover {
  opacity: 0.8;
}

.step-indicator {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  background-color: #e2e8f0;
  color: #64748b;
  flex-shrink: 0;
}

.step-active .step-indicator {
  background-color: #3b82f6;
  color: white;
}

.step-completed .step-indicator {
  background-color: #22c55e;
  color: white;
}

.step-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.step-label {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.8125rem;
}

.step-description {
  font-size: 0.6875rem;
  color: #94a3b8;
}

/* Step Body */
.step-body {
  padding: 1rem 1.25rem;
  min-height: 300px;
}

/* Step Footer */
.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 0.75rem;
}

/* Unsaved Dialog */
.unsaved-dialog {
  max-width: 450px;
}

/* Responsive */
@media (max-width: 768px) {
  .stepper-header {
    flex-direction: column;
    gap: 1rem;
  }

  .step-item {
    flex: none;
  }

  .step-footer {
    flex-direction: column;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    width: 100%;
    justify-content: center;
  }
}
</style>

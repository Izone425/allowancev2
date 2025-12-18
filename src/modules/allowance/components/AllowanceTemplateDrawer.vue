<template>
  <Sidebar
    v-model:visible="isVisible"
    position="right"
    class="allowance-template-drawer"
    :showCloseIcon="false"
    :modal="true"
    :dismissable="false"
    :blockScroll="true"
  >
    <!-- Drawer Header -->
    <template #header>
      <div class="drawer-header">
        <div class="header-row">
          <Button
            icon="pi pi-arrow-left"
            class="p-button-text p-button-rounded back-btn"
            @click="handleClose"
          />
          <h2 class="drawer-title">
            {{ isEditMode ? 'Edit Allowance Template' : 'Add Allowance Template' }}
          </h2>
        </div>
        <p class="drawer-subtitle">
          {{ isEditMode ? `Editing: ${formData.name || 'Untitled'}` : 'Configure a new allowance for your organization' }}
        </p>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loadingTemplate" class="loading-container">
      <ProgressSpinner />
      <p>Loading template...</p>
    </div>

    <!-- Drawer Content -->
    <div v-else class="drawer-content">
      <!-- Scrollable Content Area -->
      <div class="scrollable-content">
        <!-- Basic Info Section -->
        <BasicInfoSection
          :form-data="formData"
          :errors="errors"
          :code-check-loading="codeCheckLoading"
          :code-check-result="codeCheckResult"
          :is-edit-mode="isEditMode"
          @update="handleFormUpdate"
          @blur="handleFieldBlur"
        />

        <!-- Stepper -->
        <div class="stepper-section">
          <template v-for="(step, index) in steps" :key="step.key">
            <div
              class="step-item"
              :class="{
                'step-active': currentStep === index,
                'step-completed': currentStep > index,
                'step-clickable': canNavigateToStep(index)
              }"
              @click="handleStepClick(index)"
            >
              <div class="step-indicator">
                <span>{{ index + 1 }}</span>
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
            <!-- Connector line between steps -->
            <div
              v-if="index < steps.length - 1"
              class="step-connector"
              :class="{ 'connector-completed': currentStep > index }"
            ></div>
          </template>
        </div>

        <!-- Step Content -->
        <div class="step-body">
          <!-- Step 1: General (Template Info) -->
          <TemplateInfoForm
            v-if="currentStep === 0"
            :form-data="formData"
            :errors="errors"
            @update="handleFormUpdate"
            @blur="handleFieldBlur"
          />

          <!-- Step 2: Assign Employee -->
          <AssignUsersPanel
            v-if="currentStep === 1"
            ref="assignUsersPanelRef"
            :template-id="templateId"
            :criteria="criteriaData"
            :initial-selected-ids="selectedUserIds"
            @update="handleAssignmentUpdate"
          />
        </div>
      </div>

      <!-- Footer with navigation buttons (Fixed at bottom) -->
      <div class="drawer-footer">
        <Button
          v-if="currentStep > 0"
          label="Back"
          icon="pi pi-arrow-left"
          class="p-button-text"
          @click="goToPreviousStep"
        />
        <div v-else></div>
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
          @click="handleSave"
        />
      </div>
    </div>

  </Sidebar>

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
        @click="discardAndClose"
      />
      <Button
        label="Continue Editing"
        icon="pi pi-pencil"
        class="p-button-primary"
        @click="showUnsavedDialog = false"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
// PrimeVue Components
import Button from 'primevue/button';
import Sidebar from 'primevue/sidebar';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
// Components
import BasicInfoSection from './wizard/BasicInfoSection.vue';
import TemplateInfoForm from './wizard/TemplateInfoForm.vue';
import AssignUsersPanel from './assignment/AssignUsersPanel.vue';
// Composables
import { useFormValidation } from '../composables';
// Services
import { allowanceTemplateService } from '../services/allowanceTemplateService';
// Constants
import { WIZARD_STEPS } from '../constants';
// Types
import type {
  AllowanceTemplate,
  AllowanceStatus,
  CriteriaSet,
  TemplateInfoFormData,
  CreateAllowanceTemplateRequest,
  AttendanceCriteriaSet
} from '../types';
import { CriteriaGroupOperator } from '../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

const props = defineProps<{
  visible: boolean;
  templateId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved', template: AllowanceTemplate): void;
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const toast = useToast();

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const currentStep = ref(0);
const steps = WIZARD_STEPS;
const loadingTemplate = ref(false);
const saving = ref(false);
const showUnsavedDialog = ref(false);

// Criteria state (kept for assignment panel compatibility)
const criteriaData = ref<CriteriaSet>({
  groupOperator: 'AND',
  groups: []
});

// Assignment state
const selectedUserIds = ref<string[]>([]);
const assignmentMode = ref<'MANUAL' | 'CRITERIA'>('MANUAL');
const assignUsersPanelRef = ref();

// Form validation - initialized with null, will be reset when drawer opens
const validationEditingId = ref<string | null>(null);

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
  touchAll
} = useFormValidation(validationEditingId.value);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const isEditMode = computed(() => !!props.templateId);

const templateId = computed(() => props.templateId || null);

const isCurrentStepValid = computed(() => {
  if (currentStep.value === 0) {
    const result = validateStep(0);
    return result.isValid && codeCheckResult.value !== false;
  }
  // Step 1 (Assign Employee) is always valid
  return true;
});

const isFormValid = computed(() => {
  const result = validateAll();
  return result.isValid;
});

const hasUnsavedChanges = computed(() => isDirty.value);

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
  if (stepIndex < currentStep.value) return true;
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

// ---------------------------------------------------------------------------
// METHODS - Close Handling
// ---------------------------------------------------------------------------

function handleClose(): void {
  if (hasUnsavedChanges.value) {
    showUnsavedDialog.value = true;
  } else {
    closeDrawer();
  }
}

function discardAndClose(): void {
  showUnsavedDialog.value = false;
  resetAndClose();
}

function closeDrawer(): void {
  isVisible.value = false;
}

function resetAndClose(): void {
  resetForm();
  currentStep.value = 0;
  criteriaData.value = { groupOperator: 'AND', groups: [] };
  selectedUserIds.value = [];
  assignmentMode.value = 'MANUAL';
  closeDrawer();
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
// METHODS - Save Operations
// ---------------------------------------------------------------------------

async function handleSave(): Promise<void> {
  touchAll();
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fix the errors before saving',
      life: 3000
    });
    return;
  }

  saving.value = true;
  try {
    const template = await saveTemplate('ACTIVE');

    if (selectedUserIds.value.length > 0 && template.id) {
      await allowanceTemplateService.assignUsers(template.id, {
        userIds: selectedUserIds.value,
        source: assignmentMode.value
      });
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: isEditMode.value ? 'Template updated successfully' : 'Template created successfully',
      life: 3000
    });

    emit('saved', template);
    resetAndClose();
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
    ratePerDay: formData.value.ratePerDay || undefined,
    includeNonWorkingDays: formData.value.includeNonWorkingDays,
    prorateByJoinDate: formData.value.prorateByJoinDate,
    prorateByLeaveDate: formData.value.prorateByLeaveDate,
    payoutDate: formData.value.payoutDate?.toISOString().split('T')[0] || undefined,
    payoutMonth: formData.value.payoutMonth || undefined,
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
      enabled: false,
      groupOperator: CriteriaGroupOperator.AND,
      groups: []
    };

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
      prorate: template.prorate,
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
      prorateByJoinDate: template.prorateByJoinDate || false,
      prorateByLeaveDate: template.prorateByLeaveDate || false,
      payoutDate: template.payoutDate ? new Date(template.payoutDate) : null,
      payoutMonth: template.payoutMonth || '',
      effectiveStart: template.effectiveStart ? new Date(template.effectiveStart) : null,
      effectiveEnd: template.effectiveEnd ? new Date(template.effectiveEnd) : null,
      status: template.status,
      attendanceCriteria: template.attendanceCriteria || defaultAttendanceCriteria
    });

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
    closeDrawer();
  } finally {
    loadingTemplate.value = false;
  }
}

// ---------------------------------------------------------------------------
// WATCHERS
// ---------------------------------------------------------------------------

watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    // Reset state when opening
    currentStep.value = 0;
    criteriaData.value = { groupOperator: 'AND', groups: [] };
    selectedUserIds.value = [];
    assignmentMode.value = 'MANUAL';

    await nextTick();

    if (props.templateId) {
      validationEditingId.value = props.templateId;
      loadTemplate();
    } else {
      validationEditingId.value = null;
      resetForm();
    }
  }
});
</script>

<style scoped>
.allowance-template-drawer {
  width: 700px !important;
}

/* Drawer Header */
.drawer-header {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.back-btn {
  color: #1e293b;
  width: 40px;
  height: 40px;
}

.back-btn:hover {
  background-color: #f1f5f9 !important;
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
  text-align: left;
  padding-left: 1rem;
}

.drawer-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: #64748b;
}

/* Drawer Content */
.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Stepper Section */
.stepper-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: default;
  transition: opacity 0.2s;
}

.step-item:not(.step-active):not(.step-completed) {
  opacity: 0.5;
}

.step-item.step-clickable {
  cursor: pointer;
}

.step-item.step-clickable:hover .step-indicator {
  transform: scale(1.05);
}

.step-indicator {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.8125rem;
  background-color: transparent;
  border: 2px solid #cbd5e1;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.2s;
}

.step-active .step-indicator {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.step-completed .step-indicator {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.step-label {
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
  white-space: nowrap;
}

.step-active .step-label {
  color: #1e293b;
}

.step-completed .step-label {
  color: #1e293b;
}

/* Step Connector */
.step-connector {
  flex: 1;
  height: 2px;
  background-color: #e2e8f0;
  margin: 0 1rem;
  min-width: 60px;
  max-width: 120px;
}

.step-connector.connector-completed {
  background-color: #3b82f6;
}

/* Step Body - padding handled in global styles */

/* Drawer Footer */
.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

/* Unsaved Dialog */
.unsaved-dialog {
  max-width: 400px;
}
</style>

<style>
/* Global styles for drawer - must be unscoped to override PrimeVue */
.allowance-template-drawer.p-sidebar {
  width: 700px !important;
  max-width: 100vw;
}

.allowance-template-drawer .p-sidebar-header {
  padding: 1.5rem 2.5rem !important;
  border-bottom: 1px solid #e2e8f0;
}

.allowance-template-drawer .p-sidebar-content {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Content wrapper inside drawer */
.allowance-template-drawer .drawer-content {
  padding: 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.allowance-template-drawer .loading-container {
  padding: 4rem 2.5rem;
}

.allowance-template-drawer .scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.allowance-template-drawer .basic-info-section {
  margin-bottom: 1rem;
}

.allowance-template-drawer .stepper-section {
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}


.allowance-template-drawer .drawer-footer {
  flex-shrink: 0;
  padding-top: 1rem;
  margin-top: auto;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .allowance-template-drawer.p-sidebar {
    width: 100% !important;
  }

  .allowance-template-drawer .p-sidebar-header {
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }

  .allowance-template-drawer .drawer-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>

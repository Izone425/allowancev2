<template>
  <div class="template-info-form">
    <!-- Type & Amount Section -->
    <div class="form-card">
      <div class="card-header">
        <h3 class="card-title">Allowance Type & Amount</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <!-- Type Selection -->
          <div class="form-field">
            <label for="type" class="field-label required">Allowance Type</label>
            <Dropdown
              id="type"
              :modelValue="formData.type"
              @update:modelValue="emit('update', 'type', $event)"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select allowance type"
              :class="{ 'p-invalid': errors.get('type') }"
              class="w-full"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="type-dropdown-value">
                  <i :class="getTypeIcon(slotProps.value)" class="type-icon-small"></i>
                  <span>{{ getTypeLabel(slotProps.value) }}</span>
                </div>
                <span v-else class="placeholder-text">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="type-dropdown-option">
                  <i :class="slotProps.option.icon" class="type-option-icon"></i>
                  <div class="type-option-content">
                    <span class="type-option-label">{{ slotProps.option.label }}</span>
                    <span class="type-option-desc">{{ slotProps.option.description }}</span>
                  </div>
                </div>
              </template>
            </Dropdown>
            <small v-if="errors.get('type')" class="p-error">{{ errors.get('type') }}</small>
          </div>

          <!-- Calculation Mode for Daily type -->
          <div v-if="formData.type === 'DAILY'" class="form-field">
            <label class="field-label required">Calculation Mode</label>
            <div class="calc-mode-selector">
              <label
                v-for="mode in dailyCalculationModeOptions"
                :key="mode.value"
                class="calc-mode-option"
                :class="{ selected: formData.dailyCalculationMode === mode.value }"
              >
                <input
                  type="radio"
                  :value="mode.value"
                  :checked="formData.dailyCalculationMode === mode.value"
                  @change="emit('update', 'dailyCalculationMode', mode.value)"
                  class="hidden-radio"
                />
                <i :class="mode.icon" class="mode-icon"></i>
                <div class="mode-content">
                  <span class="mode-label">{{ mode.label }}</span>
                  <span class="mode-desc">{{ mode.description }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Fixed Daily Amount (when FIXED_DAILY mode) -->
        <div v-if="formData.type === 'DAILY' && formData.dailyCalculationMode === DailyCalculationMode.FIXED_DAILY" class="form-row">
          <div class="form-field">
            <label for="amount" class="field-label required">Amount (per day)</label>
            <div class="input-with-prefix">
              <span class="input-prefix">RM</span>
              <InputNumber
                id="amount"
                :modelValue="formData.amount"
                @update:modelValue="emit('update', 'amount', $event)"
                @blur="emit('blur', 'amount')"
                mode="decimal"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :class="{ 'p-invalid': errors.get('amount') }"
                class="w-full"
              />
            </div>
            <small v-if="errors.get('amount')" class="p-error">{{ errors.get('amount') }}</small>
          </div>
        </div>

        <!-- Hourly Rate Configuration (when HOURLY_RATE mode) - Inline -->
        <HourlyRateSectionInline
          v-if="formData.type === 'DAILY' && formData.dailyCalculationMode === DailyCalculationMode.HOURLY_RATE"
          :modelValue="formData.hourlyRateConfig"
          @update:modelValue="emit('update', 'hourlyRateConfig', $event)"
          :currency="formData.currency"
        />

        <!-- Fields for Non-Daily types -->
        <template v-if="formData.type && formData.type !== 'DAILY'">
          <div class="form-row">
            <!-- Amount Mode -->
            <div class="form-field">
              <label class="field-label required">Amount Mode</label>
              <SelectButton
                :modelValue="formData.amountMode"
                @update:modelValue="emit('update', 'amountMode', $event)"
                :options="amountModeOptions"
                optionLabel="label"
                optionValue="value"
                class="amount-mode-buttons"
              />
            </div>

            <!-- Fixed Amount -->
            <div v-if="formData.amountMode === 'FIXED'" class="form-field">
              <label for="amount" class="field-label required">Amount</label>
              <div class="input-with-prefix">
                <span class="input-prefix">RM</span>
                <InputNumber
                  id="amount"
                  :modelValue="formData.amount"
                  @update:modelValue="emit('update', 'amount', $event)"
                  @blur="emit('blur', 'amount')"
                  mode="decimal"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  :class="{ 'p-invalid': errors.get('amount') }"
                  class="w-full"
                />
              </div>
              <small v-if="errors.get('amount')" class="p-error">{{ errors.get('amount') }}</small>
            </div>
          </div>

          <!-- Formula Expression -->
          <div v-if="formData.amountMode === 'FORMULA'" class="form-row">
            <div class="form-field full-width">
              <label for="formulaExpression" class="field-label required">Formula Expression</label>
              <Textarea
                id="formulaExpression"
                :modelValue="formData.formulaExpression"
                @update:modelValue="emit('update', 'formulaExpression', $event)"
                @blur="emit('blur', 'formulaExpression')"
                placeholder="e.g., basicSalary * 0.1"
                rows="2"
                :class="{ 'p-invalid': errors.get('formulaExpression') }"
                class="w-full formula-input"
              />
              <small v-if="errors.get('formulaExpression')" class="p-error">{{ errors.get('formulaExpression') }}</small>
              <div class="formula-variables">
                <span class="variables-label">Available variables:</span>
                <div class="variables-list">
                  <code v-for="v in ['basicSalary', 'workingDays', 'attendedDays', 'tenure', 'jobGrade']" :key="v">{{ v }}</code>
                </div>
              </div>
            </div>
          </div>

          <!-- Tax & Prorate Options -->
          <div class="options-row">
            <label class="toggle-option">
              <Checkbox
                id="taxable"
                :modelValue="formData.taxable"
                @update:modelValue="emit('update', 'taxable', $event)"
                binary
              />
              <span class="toggle-label">Taxable</span>
            </label>
            <label class="toggle-option">
              <Checkbox
                id="prorate"
                :modelValue="formData.prorate"
                @update:modelValue="emit('update', 'prorate', $event)"
                binary
              />
              <span class="toggle-label">Enable Proration</span>
            </label>
          </div>
        </template>
      </div>
    </div>

    <!-- Type-Specific Options -->
    <div v-if="formData.type" class="form-card">
      <div class="card-header">
        <h3 class="card-title">{{ getTypeLabel(formData.type) }} Options</h3>
      </div>
      <div class="card-body">
        <!-- DAILY Options -->
        <template v-if="formData.type === 'DAILY'">
          <!-- Day Type Selection -->
          <div class="daily-options-grid">
            <!-- Apply On Day Type -->
            <div class="option-section">
              <label class="section-label">Apply on Day Type</label>
              <div class="day-type-grid">
                <label
                  class="day-type-item"
                  :class="{ selected: formData.applyOnNormalWorkday }"
                >
                  <Checkbox
                    :modelValue="formData.applyOnNormalWorkday"
                    @update:modelValue="emit('update', 'applyOnNormalWorkday', $event)"
                    binary
                    class="hidden-checkbox"
                  />
                  <span class="day-type-icon">
                    <i class="pi pi-briefcase"></i>
                  </span>
                  <span class="day-type-text">Normal Workday</span>
                </label>
                <label
                  class="day-type-item"
                  :class="{ selected: formData.applyOnRestday }"
                >
                  <Checkbox
                    :modelValue="formData.applyOnRestday"
                    @update:modelValue="emit('update', 'applyOnRestday', $event)"
                    binary
                    class="hidden-checkbox"
                  />
                  <span class="day-type-icon">
                    <span class="letter-icon">R</span>
                  </span>
                  <span class="day-type-text">Rest Day</span>
                </label>
                <label
                  class="day-type-item"
                  :class="{ selected: formData.applyOnOffday }"
                >
                  <Checkbox
                    :modelValue="formData.applyOnOffday"
                    @update:modelValue="emit('update', 'applyOnOffday', $event)"
                    binary
                    class="hidden-checkbox"
                  />
                  <span class="day-type-icon">
                    <span class="letter-icon">O</span>
                  </span>
                  <span class="day-type-text">Off Day</span>
                </label>
                <label
                  class="day-type-item"
                  :class="{ selected: formData.applyOnHoliday }"
                >
                  <Checkbox
                    :modelValue="formData.applyOnHoliday"
                    @update:modelValue="emit('update', 'applyOnHoliday', $event)"
                    binary
                    class="hidden-checkbox"
                  />
                  <span class="day-type-icon">
                    <span class="beach-icon">🏖️</span>
                  </span>
                  <span class="day-type-text">Holiday</span>
                </label>
              </div>
            </div>

            <!-- Apply On Shift -->
            <div class="option-section">
              <label class="section-label">Apply on Shift</label>
              <MultiSelect
                :modelValue="formData.applyOnShifts"
                @update:modelValue="emit('update', 'applyOnShifts', $event)"
                :options="shiftOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All shifts (no filter)"
                display="chip"
                class="w-full compact-select"
              />
            </div>

            <!-- Apply On Work Location -->
            <div class="option-section">
              <label class="section-label">Apply on Work Location</label>
              <MultiSelect
                :modelValue="formData.applyOnWorkLocations"
                @update:modelValue="emit('update', 'applyOnWorkLocations', $event)"
                :options="workLocationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All locations (no filter)"
                display="chip"
                class="w-full compact-select"
              />
            </div>
          </div>
        </template>

        <!-- MONTHLY Options -->
        <template v-if="formData.type === 'MONTHLY'">
          <div class="options-row">
            <label class="toggle-option">
              <Checkbox
                id="prorateByJoinDate"
                :modelValue="formData.prorateByJoinDate"
                @update:modelValue="emit('update', 'prorateByJoinDate', $event)"
                binary
              />
              <span class="toggle-label">Prorate by join date</span>
            </label>
            <label class="toggle-option">
              <Checkbox
                id="prorateByLeaveDate"
                :modelValue="formData.prorateByLeaveDate"
                @update:modelValue="emit('update', 'prorateByLeaveDate', $event)"
                binary
              />
              <span class="toggle-label">Prorate by resignation date</span>
            </label>
          </div>
        </template>

        <!-- ONE_OFF Options -->
        <template v-if="formData.type === 'ONE_OFF'">
          <div class="form-row">
            <div class="form-field">
              <label for="payoutDate" class="field-label">Payout Date</label>
              <Calendar
                id="payoutDate"
                :modelValue="formData.payoutDate"
                @update:modelValue="emit('update', 'payoutDate', $event)"
                dateFormat="dd M yy"
                showIcon
                :class="{ 'p-invalid': errors.get('payoutDate') }"
                class="w-full"
              />
              <small v-if="errors.get('payoutDate')" class="p-error">{{ errors.get('payoutDate') }}</small>
            </div>

            <div class="form-field">
              <label for="payoutMonth" class="field-label">Or Payout Month</label>
              <InputMask
                id="payoutMonth"
                :modelValue="formData.payoutMonth"
                @update:modelValue="emit('update', 'payoutMonth', $event)"
                mask="9999-99"
                placeholder="YYYY-MM"
                class="w-full"
              />
              <small class="field-hint">Either date or month required</small>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Effective Period Section -->
    <div class="form-card">
      <div class="card-header">
        <h3 class="card-title">Effective Period</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-field">
            <label for="effectiveStart" class="field-label required">Start Date</label>
            <Calendar
              id="effectiveStart"
              :modelValue="formData.effectiveStart"
              @update:modelValue="emit('update', 'effectiveStart', $event)"
              @blur="emit('blur', 'effectiveStart')"
              dateFormat="dd M yy"
              showIcon
              :class="{ 'p-invalid': errors.get('effectiveStart') }"
              class="w-full"
            />
            <small v-if="errors.get('effectiveStart')" class="p-error">{{ errors.get('effectiveStart') }}</small>
          </div>

          <div class="form-field">
            <label for="effectiveEnd" class="field-label">End Date <span class="optional-tag">Optional</span></label>
            <Calendar
              id="effectiveEnd"
              :modelValue="formData.effectiveEnd"
              @update:modelValue="emit('update', 'effectiveEnd', $event)"
              @blur="emit('blur', 'effectiveEnd')"
              dateFormat="dd M yy"
              showIcon
              :minDate="formData.effectiveStart || undefined"
              :class="{ 'p-invalid': errors.get('effectiveEnd') }"
              class="w-full"
            />
            <small v-if="errors.get('effectiveEnd')" class="p-error">{{ errors.get('effectiveEnd') }}</small>
            <small v-else class="field-hint">Leave empty for ongoing allowance</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Condition Section (only for DAILY type) -->
    <div v-if="formData.type === 'DAILY'" class="form-card">
      <div class="card-header">
        <h3 class="card-title">Condition</h3>
      </div>
      <div class="card-body">
        <AttendanceCriteriaBuilder
          :modelValue="formData.attendanceCriteria"
          @update:modelValue="emit('update', 'attendanceCriteria', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// PrimeVue Components
import InputNumber from 'primevue/inputnumber';
import InputMask from 'primevue/inputmask';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import SelectButton from 'primevue/selectbutton';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import MultiSelect from 'primevue/multiselect';
// Custom Components
import AttendanceCriteriaBuilder from './AttendanceCriteriaBuilder.vue';
import HourlyRateSectionInline from './HourlyRateSectionInline.vue';
// Constants
import {
  ALLOWANCE_TYPE_OPTIONS,
  AMOUNT_MODE_OPTIONS,
  SHIFT_OPTIONS,
  WORK_LOCATION_OPTIONS,
  DAILY_CALCULATION_MODE_OPTIONS
} from '../../constants';
// Types
import type { TemplateInfoFormData, AllowanceType } from '../../types';
import { DailyCalculationMode } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  formData: TemplateInfoFormData;
  errors: Map<string, string>;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', field: keyof TemplateInfoFormData, value: any): void;
  (e: 'blur', field: string): void;
}>();

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

const typeOptions = ALLOWANCE_TYPE_OPTIONS;
const amountModeOptions = AMOUNT_MODE_OPTIONS;
const shiftOptions = SHIFT_OPTIONS;
const workLocationOptions = WORK_LOCATION_OPTIONS;
const dailyCalculationModeOptions = DAILY_CALCULATION_MODE_OPTIONS;

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function getTypeLabel(type: AllowanceType): string {
  return typeOptions.find((t) => t.value === type)?.label || type;
}

function getTypeIcon(type: AllowanceType): string {
  return typeOptions.find((t) => t.value === type)?.icon || 'pi pi-tag';
}

</script>

<style scoped>
.template-info-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Form Card */
.form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  padding: 0.625rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-body {
  padding: 1rem;
}

/* Form Row */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 0.875rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

/* Form Field */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

/* Labels */
.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.field-label.required::after {
  content: ' *';
  color: #ef4444;
}

.optional-tag {
  font-size: 0.625rem;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 0.25rem;
}

.field-hint {
  font-size: 0.6875rem;
  color: #94a3b8;
}

/* Input with prefix */
.input-with-prefix {
  display: flex;
  align-items: stretch;
}

.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
}

.input-with-prefix :deep(.p-inputnumber) {
  flex: 1;
}

.input-with-prefix :deep(.p-inputtext) {
  border-radius: 0 6px 6px 0;
}

/* Type Dropdown */
.type-dropdown-value {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.type-icon-small {
  font-size: 0.8125rem;
  color: #3b82f6;
}

.placeholder-text {
  color: #94a3b8;
}

.type-dropdown-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.type-option-icon {
  font-size: 0.875rem;
  color: #3b82f6;
  margin-top: 0.0625rem;
}

.type-option-content {
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
}

.type-option-label {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.8125rem;
}

.type-option-desc {
  font-size: 0.6875rem;
  color: #64748b;
}

/* Amount Mode Buttons */
.amount-mode-buttons {
  display: flex;
}

.amount-mode-buttons :deep(.p-button) {
  flex: 1;
}

/* Formula Variables */
.formula-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
}

.formula-variables {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.variables-label {
  font-size: 0.6875rem;
  color: #64748b;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.variables-list code {
  font-size: 0.625rem;
  padding: 0.0625rem 0.375rem;
  background: #f1f5f9;
  border-radius: 4px;
  color: #7c3aed;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Options Row */
.options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}

/* Toggle Option */
.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-label {
  font-size: 0.8125rem;
  color: #374151;
}

/* Daily Options Grid */
.daily-options-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

/* Day Type Grid */
.day-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.day-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.day-type-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.day-type-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.day-type-item.selected .day-type-icon {
  background: #3b82f6;
  color: #ffffff;
}

.day-type-item.selected .day-type-text {
  color: #1d4ed8;
  font-weight: 500;
}

.hidden-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.day-type-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.15s ease;
}

.day-type-icon i {
  font-size: 0.8125rem;
}

.letter-icon {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
}

.beach-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.day-type-text {
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.2;
  transition: all 0.15s ease;
}

/* Compact Select */
.compact-select :deep(.p-multiselect) {
  min-height: 2.25rem;
}

.compact-select :deep(.p-multiselect-label) {
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
}

.compact-select :deep(.p-multiselect-token) {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
}

/* Calculation Mode Selector */
.calc-mode-selector {
  display: flex;
  gap: 0.75rem;
}

.calc-mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.calc-mode-option:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.calc-mode-option.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.hidden-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1rem;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.calc-mode-option.selected .mode-icon {
  background: #3b82f6;
  color: #ffffff;
}

.mode-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.mode-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
}

.calc-mode-option.selected .mode-label {
  color: #1d4ed8;
}

.mode-desc {
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.3;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .card-header {
    padding: 0.75rem 1rem;
  }

  .card-body {
    padding: 1rem;
  }

  .day-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .options-row {
    flex-direction: column;
    gap: 1rem;
  }

  .calc-mode-selector {
    flex-direction: column;
  }

  .calc-mode-option {
    flex: none;
  }
}
</style>

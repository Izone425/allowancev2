<template>
  <div class="monthly-criteria-section">
    <!-- Total Attendance Days -->
    <div class="criteria-row">
      <label class="toggle-option">
        <Checkbox
          :modelValue="isAttendanceDaysEnabled"
          @update:modelValue="toggleAttendanceDays($event)"
          binary
        />
        <span class="toggle-label">Minimum Attendance Days</span>
      </label>
      <div v-if="isAttendanceDaysEnabled" class="criteria-inputs">
        <Dropdown
          :modelValue="modelValue.attendanceDaysCondition"
          @update:modelValue="updateField('attendanceDaysCondition', $event)"
          :options="conditionOptions"
          optionLabel="label"
          optionValue="value"
          class="condition-dropdown"
        />
        <InputNumber
          :modelValue="modelValue.minAttendanceDays"
          @update:modelValue="updateField('minAttendanceDays', $event)"
          :min="0"
          :max="31"
          placeholder="Days"
          class="value-input"
        />
        <span class="unit-label">days</span>
      </div>
    </div>

    <!-- Maximum Late Times -->
    <div class="criteria-row">
      <label class="toggle-option">
        <Checkbox
          :modelValue="isLateTimesEnabled"
          @update:modelValue="toggleLateTimes($event)"
          binary
        />
        <span class="toggle-label">Maximum Late Occurrences</span>
      </label>
      <div v-if="isLateTimesEnabled" class="criteria-inputs">
        <Dropdown
          :modelValue="modelValue.lateTimesCondition"
          @update:modelValue="updateField('lateTimesCondition', $event)"
          :options="conditionOptions"
          optionLabel="label"
          optionValue="value"
          class="condition-dropdown"
        />
        <InputNumber
          :modelValue="modelValue.maxLateTimes"
          @update:modelValue="updateField('maxLateTimes', $event)"
          :min="0"
          placeholder="Times"
          class="value-input"
        />
        <span class="unit-label">times</span>
      </div>
    </div>

    <!-- Maximum Absent Days -->
    <div class="criteria-row">
      <label class="toggle-option">
        <Checkbox
          :modelValue="isAbsentDaysEnabled"
          @update:modelValue="toggleAbsentDays($event)"
          binary
        />
        <span class="toggle-label">Maximum Absent Days</span>
      </label>
      <div v-if="isAbsentDaysEnabled" class="criteria-inputs">
        <Dropdown
          :modelValue="modelValue.absentDaysCondition"
          @update:modelValue="updateField('absentDaysCondition', $event)"
          :options="conditionOptions"
          optionLabel="label"
          optionValue="value"
          class="condition-dropdown"
        />
        <InputNumber
          :modelValue="modelValue.maxAbsentDays"
          @update:modelValue="updateField('maxAbsentDays', $event)"
          :min="0"
          placeholder="Days"
          class="value-input"
        />
        <span class="unit-label">days</span>
      </div>
    </div>

    <!-- Perfect Attendance -->
    <div class="criteria-row">
      <label class="toggle-option">
        <Checkbox
          :modelValue="modelValue.requirePerfectAttendance"
          @update:modelValue="updateField('requirePerfectAttendance', $event)"
          binary
        />
        <span class="toggle-label">Require Perfect Attendance</span>
      </label>
      <span v-if="modelValue.requirePerfectAttendance" class="perfect-attendance-hint">
        (No late, no absent, no early out)
      </span>
    </div>

    <!-- No criteria message -->
    <div v-if="!hasAnyCriteria" class="no-criteria-message">
      <i class="pi pi-info-circle"></i>
      <span>No conditions set - allowance will be granted to all assigned employees</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import type { MonthlyCriteria } from '../../types';
import { MonthlyCriteriaCondition } from '../../types';
import { MONTHLY_CRITERIA_CONDITION_OPTIONS } from '../../constants';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  modelValue: MonthlyCriteria;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: MonthlyCriteria): void;
}>();

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

const conditionOptions = MONTHLY_CRITERIA_CONDITION_OPTIONS;

// ---------------------------------------------------------------------------
// COMPUTED - Enabled States
// ---------------------------------------------------------------------------

const isAttendanceDaysEnabled = computed(() => props.modelValue.minAttendanceDays !== null);
const isLateTimesEnabled = computed(() => props.modelValue.maxLateTimes !== null);
const isAbsentDaysEnabled = computed(() => props.modelValue.maxAbsentDays !== null);

const hasAnyCriteria = computed(() => {
  return isAttendanceDaysEnabled.value ||
         isLateTimesEnabled.value ||
         isAbsentDaysEnabled.value ||
         props.modelValue.requirePerfectAttendance;
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function updateField<K extends keyof MonthlyCriteria>(field: K, value: MonthlyCriteria[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  });
}

function toggleAttendanceDays(enabled: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    minAttendanceDays: enabled ? 22 : null, // Default to 22 days
    attendanceDaysCondition: enabled ? MonthlyCriteriaCondition.GREATER_THAN_OR_EQUALS : props.modelValue.attendanceDaysCondition
  });
}

function toggleLateTimes(enabled: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    maxLateTimes: enabled ? 3 : null, // Default to 3 times max
    lateTimesCondition: enabled ? MonthlyCriteriaCondition.LESS_THAN_OR_EQUALS : props.modelValue.lateTimesCondition
  });
}

function toggleAbsentDays(enabled: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    maxAbsentDays: enabled ? 0 : null, // Default to 0 days max
    absentDaysCondition: enabled ? MonthlyCriteriaCondition.LESS_THAN_OR_EQUALS : props.modelValue.absentDaysCondition
  });
}
</script>

<style scoped>
.monthly-criteria-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.criteria-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  min-width: 200px;
}

.toggle-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.criteria-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.condition-dropdown {
  width: 120px;
}

.condition-dropdown :deep(.p-dropdown) {
  font-size: 0.8125rem;
}

.value-input {
  width: 80px;
}

.value-input :deep(.p-inputtext) {
  font-size: 0.8125rem;
  text-align: center;
}

.unit-label {
  font-size: 0.75rem;
  color: #64748b;
  min-width: 40px;
}

.perfect-attendance-hint {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.no-criteria-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #0369a1;
}

.no-criteria-message i {
  color: #0ea5e9;
}

/* Responsive */
@media (max-width: 768px) {
  .criteria-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .criteria-inputs {
    margin-left: 0;
    width: 100%;
    padding-left: 1.75rem;
  }

  .toggle-option {
    min-width: auto;
  }
}
</style>

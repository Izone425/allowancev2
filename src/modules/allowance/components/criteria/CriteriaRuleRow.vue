<template>
  <div class="criteria-rule-row" :class="{ 'has-error': error }">
    <!-- Rule Connector -->
    <div v-if="showConnector" class="rule-connector">
      <span class="connector-label">{{ groupOperator }}</span>
    </div>

    <!-- Rule Content -->
    <div class="rule-content">
      <!-- Field Selector -->
      <div class="rule-field field-selector">
        <Dropdown
          :modelValue="rule.field"
          @update:modelValue="handleFieldChange"
          :options="fieldOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select field"
          class="w-full"
        />
      </div>

      <!-- Operator Selector -->
      <div class="rule-field operator-selector">
        <Dropdown
          :modelValue="rule.operator"
          @update:modelValue="handleOperatorChange"
          :options="availableOperators"
          optionLabel="label"
          optionValue="value"
          placeholder="Select condition"
          class="w-full"
        />
      </div>

      <!-- Value Input (conditional based on field type) -->
      <div class="rule-field value-selector">
        <!-- MultiSelect for list values -->
        <MultiSelect
          v-if="valueType === 'multiselect'"
          :modelValue="rule.value as string[]"
          @update:modelValue="handleValueChange"
          :options="valueOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Select values"
          filter
          :class="{ 'p-invalid': error }"
          class="w-full"
          display="chip"
          :maxSelectedLabels="2"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="valueType === 'number' && !isRangeOperator"
          :modelValue="rule.value as number"
          @update:modelValue="handleValueChange"
          placeholder="Enter value"
          :class="{ 'p-invalid': error }"
          class="w-full"
        />

        <!-- Range Input -->
        <div v-else-if="valueType === 'number' && isRangeOperator" class="range-input">
          <InputNumber
            :modelValue="(rule.value as any)?.min"
            @update:modelValue="(v) => handleRangeChange('min', v)"
            placeholder="Min"
            :class="{ 'p-invalid': error }"
            class="range-field"
          />
          <span class="range-separator">to</span>
          <InputNumber
            :modelValue="(rule.value as any)?.max"
            @update:modelValue="(v) => handleRangeChange('max', v)"
            placeholder="Max"
            :class="{ 'p-invalid': error }"
            class="range-field"
          />
        </div>

        <!-- Tags Input -->
        <Chips
          v-else-if="valueType === 'tags'"
          :modelValue="rule.value as string[]"
          @update:modelValue="handleValueChange"
          placeholder="Enter tags"
          separator=","
          :class="{ 'p-invalid': error }"
          class="w-full"
        />

        <!-- Boolean (already handled by operator) -->
        <div v-else-if="valueType === 'boolean'" class="boolean-indicator">
          <Tag
            :value="rule.operator === 'IS_TRUE' ? 'Confirmed' : 'Not Confirmed'"
            :severity="rule.operator === 'IS_TRUE' ? 'success' : 'warning'"
          />
        </div>
      </div>

      <!-- Remove Button -->
      <Button
        icon="pi pi-times"
        class="p-button-text p-button-danger p-button-sm remove-button"
        @click="emit('remove')"
        v-tooltip.top="'Remove rule'"
      />
    </div>

    <!-- Error Message -->
    <small v-if="error" class="error-message">
      {{ error }}
    </small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// PrimeVue Components
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';
import Chips from 'primevue/chips';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
// Constants
import {
  CRITERIA_FIELD_OPTIONS,
  CRITERIA_OPERATOR_LABELS
} from '../../constants';
// Types
import type {
  CriteriaRule,
  CriteriaField,
  CriteriaOperator,
  CriteriaGroupOperator,
  CriteriaValue,
  LookupData
} from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  rule: CriteriaRule;
  ruleIndex: number;
  showConnector: boolean;
  groupOperator: CriteriaGroupOperator;
  lookupData: LookupData | null;
  error?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', updates: Partial<CriteriaRule>): void;
  (e: 'remove'): void;
}>();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const fieldConfig = computed(() =>
  CRITERIA_FIELD_OPTIONS.find((f) => f.value === props.rule.field)
);

const fieldOptions = computed(() =>
  CRITERIA_FIELD_OPTIONS.map((f) => ({
    label: f.label,
    value: f.value
  }))
);

const availableOperators = computed(() => {
  if (!fieldConfig.value) return [];
  return fieldConfig.value.operators.map((op) => ({
    label: CRITERIA_OPERATOR_LABELS[op],
    value: op
  }));
});

const valueType = computed(() => fieldConfig.value?.valueType || 'multiselect');

const isRangeOperator = computed(() => props.rule.operator === 'BETWEEN');

const valueOptions = computed(() => {
  if (!fieldConfig.value?.lookupKey || !props.lookupData) return [];
  const key = fieldConfig.value.lookupKey as keyof LookupData;
  return props.lookupData[key] || [];
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function handleFieldChange(newField: CriteriaField): void {
  const newFieldConfig = CRITERIA_FIELD_OPTIONS.find((f) => f.value === newField);
  const defaultOperator = newFieldConfig?.operators[0] || props.rule.operator;
  const defaultValue = getDefaultValue(newFieldConfig?.valueType || 'multiselect');

  emit('update', {
    field: newField,
    operator: defaultOperator,
    value: defaultValue
  });
}

function handleOperatorChange(newOperator: CriteriaOperator): void {
  let newValue = props.rule.value;

  // Reset value if switching to/from BETWEEN
  if (newOperator === 'BETWEEN' && typeof props.rule.value !== 'object') {
    newValue = { min: 0, max: 0 };
  } else if (props.rule.operator === 'BETWEEN' && newOperator !== 'BETWEEN') {
    newValue = 0;
  }

  emit('update', { operator: newOperator, value: newValue });
}

function handleValueChange(newValue: CriteriaValue): void {
  emit('update', { value: newValue });
}

function handleRangeChange(key: 'min' | 'max', value: number | null): void {
  const currentValue = props.rule.value as { min: number; max: number };
  emit('update', {
    value: {
      ...currentValue,
      [key]: value || 0
    }
  });
}

function getDefaultValue(type: string): CriteriaValue {
  switch (type) {
    case 'multiselect':
      return [];
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'tags':
      return [];
    default:
      return [];
  }
}
</script>

<style scoped>
.criteria-rule-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.criteria-rule-row.has-error {
  padding-bottom: 0.25rem;
}

/* Rule Connector */
.rule-connector {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  margin-left: 1rem;
}

.connector-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  background-color: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

/* Rule Content */
.rule-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.has-error .rule-content {
  border-color: #fca5a5;
  background-color: #fef2f2;
}

/* Rule Fields */
.rule-field {
  flex: 1;
}

.field-selector {
  min-width: 150px;
  max-width: 180px;
}

.operator-selector {
  min-width: 140px;
  max-width: 160px;
}

.value-selector {
  min-width: 200px;
  flex: 2;
}

/* Range Input */
.range-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-field {
  flex: 1;
}

.range-separator {
  font-size: 0.75rem;
  color: #64748b;
}

/* Boolean Indicator */
.boolean-indicator {
  display: flex;
  align-items: center;
  padding: 0.375rem;
}

/* Remove Button */
.remove-button {
  flex-shrink: 0;
}

/* Error Message */
.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  padding-left: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .rule-content {
    flex-wrap: wrap;
  }

  .rule-field {
    min-width: 100% !important;
    max-width: 100% !important;
  }

  .field-selector,
  .operator-selector {
    flex: 1 1 45%;
  }

  .value-selector {
    flex: 1 1 100%;
  }
}
</style>

<template>
  <div class="hourly-rate-inline">
    <div class="hourly-rate-grid">
      <!-- Rate Per Hour -->
      <div class="form-field">
        <label class="field-label required">Rate Per Hour</label>
        <div class="input-with-prefix">
          <span class="input-prefix">{{ currencySymbol }}</span>
          <InputNumber
            :modelValue="modelValue.ratePerHour"
            @update:modelValue="updateField('ratePerHour', $event ?? 0)"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="w-full"
          />
          <span class="input-suffix">/ hour</span>
        </div>
        <small class="field-hint">Amount paid for each hour worked</small>
      </div>

      <!-- Daily Cap -->
      <div class="form-field">
        <label class="field-label">
          Daily Cap
          <span class="optional-tag">(Optional)</span>
        </label>
        <div class="toggle-input-group">
          <div class="toggle-row">
            <Checkbox
              :modelValue="hasDailyCap"
              @update:modelValue="toggleDailyCap"
              :binary="true"
              inputId="hasDailyCap"
            />
            <label for="hasDailyCap" class="toggle-label">Enable daily maximum</label>
          </div>
          <div v-if="hasDailyCap" class="input-with-prefix mt-sm">
            <span class="input-prefix">{{ currencySymbol }}</span>
            <InputNumber
              :modelValue="modelValue.dailyCap"
              @update:modelValue="updateField('dailyCap', $event)"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              class="w-full"
            />
          </div>
        </div>
        <small class="field-hint">{{ hasDailyCap ? `Maximum ${currencySymbol} ${modelValue.dailyCap?.toFixed(2) || '0.00'} per day` : 'No daily limit applied' }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import type { HourlyRateConfig } from '../../types';
import { CURRENCY_OPTIONS } from '../../constants';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  modelValue: HourlyRateConfig;
  currency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'MYR'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: HourlyRateConfig): void;
}>();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const currencySymbol = computed(() => {
  const curr = CURRENCY_OPTIONS.find(c => c.value === props.currency);
  return curr?.symbol || 'RM';
});

const hasDailyCap = computed(() => props.modelValue.dailyCap !== null);

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function updateField<K extends keyof HourlyRateConfig>(
  field: K,
  value: HourlyRateConfig[K]
): void {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  });
}

function toggleDailyCap(enabled: boolean): void {
  emit('update:modelValue', {
    ...props.modelValue,
    dailyCap: enabled ? 0 : null
  });
}
</script>

<style scoped>
.hourly-rate-inline {
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
  margin-top: 0.5rem;
}

/* Main Grid Layout */
.hourly-rate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Form Field */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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
}

.field-hint {
  font-size: 0.6875rem;
  color: #94a3b8;
}

/* Input with prefix/suffix */
.input-with-prefix {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  max-width: 220px;
}

.input-with-prefix:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  border-right: 1px solid #e2e8f0;
}

.input-suffix {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  color: #94a3b8;
  font-size: 0.75rem;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
}

.input-with-prefix :deep(.p-inputnumber) {
  flex: 1;
}

.input-with-prefix :deep(.p-inputtext) {
  border: none;
  border-radius: 0;
}

.input-with-prefix :deep(.p-inputtext:focus) {
  box-shadow: none;
}

/* Toggle Input Group */
.toggle-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-label {
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
}

.mt-sm {
  margin-top: 0.375rem;
}

/* Responsive */
@media (max-width: 768px) {
  .hourly-rate-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .input-with-prefix {
    max-width: 100%;
  }
}
</style>

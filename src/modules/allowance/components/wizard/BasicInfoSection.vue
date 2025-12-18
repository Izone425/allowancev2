<template>
  <div class="basic-info-section">
    <div class="form-card">
      <div class="card-header">
        <h3 class="card-title">Basic Information</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <!-- Name -->
          <div class="form-field">
            <label for="name" class="field-label required">Allowance Name</label>
            <InputText
              id="name"
              :modelValue="formData.name"
              @update:modelValue="emit('update', 'name', $event)"
              @blur="emit('blur', 'name')"
              placeholder="e.g., Transport Allowance"
              :class="{ 'p-invalid': errors.get('name') }"
              class="w-full"
            />
            <small v-if="errors.get('name')" class="p-error">{{ errors.get('name') }}</small>
          </div>

          <!-- Code -->
          <div class="form-field">
            <label for="code" class="field-label required">Allowance Code</label>
            <div class="code-input-wrapper">
              <InputText
                id="code"
                :modelValue="formData.code"
                @update:modelValue="handleCodeChange"
                @blur="emit('blur', 'code')"
                placeholder="e.g., TRANS-001"
                :class="{ 'p-invalid': errors.get('code') }"
                :disabled="isEditMode"
                class="w-full code-input"
              />
              <div class="code-status">
                <i v-if="codeCheckLoading" class="pi pi-spin pi-spinner status-icon loading"></i>
                <i v-else-if="codeCheckResult === true" class="pi pi-check-circle status-icon valid"></i>
                <i v-else-if="codeCheckResult === false" class="pi pi-times-circle status-icon invalid"></i>
              </div>
            </div>
            <small v-if="errors.get('code')" class="p-error">{{ errors.get('code') }}</small>
            <small v-else class="field-hint">Unique identifier for this allowance</small>
          </div>
        </div>

        <!-- Description -->
        <div class="form-row">
          <div class="form-field full-width">
            <label for="description" class="field-label">
              Description
              <span class="optional-tag">Optional</span>
            </label>
            <Textarea
              id="description"
              :modelValue="formData.description"
              @update:modelValue="emit('update', 'description', $event)"
              placeholder="Brief description of this allowance..."
              rows="2"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// PrimeVue Components
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
// Types
import type { TemplateInfoFormData } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  formData: TemplateInfoFormData;
  errors: Map<string, string>;
  codeCheckLoading: boolean;
  codeCheckResult: boolean | null;
  isEditMode: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', field: keyof TemplateInfoFormData, value: any): void;
  (e: 'blur', field: string): void;
}>();

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function handleCodeChange(value: string): void {
  const upperValue = value.toUpperCase();
  emit('update', 'code', upperValue);
}
</script>

<style scoped>
.basic-info-section {
  margin-bottom: 1rem;
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

/* Code Input */
.code-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.code-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-status {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 1rem;
}

.status-icon.loading {
  color: #64748b;
}

.status-icon.valid {
  color: #22c55e;
}

.status-icon.invalid {
  color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .card-header {
    padding: 1rem;
  }

  .card-body {
    padding: 1rem;
  }
}
</style>

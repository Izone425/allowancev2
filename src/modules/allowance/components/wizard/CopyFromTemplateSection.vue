<template>
  <Card class="copy-from-section" v-if="!disabled">
    <template #content>
      <div class="section-content">
        <div class="section-header">
          <i class="pi pi-copy"></i>
          <span class="section-title">Copy From Existing Template</span>
          <span class="optional-badge">Optional</span>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading templates...</span>
        </div>

        <!-- No templates available -->
        <div v-else-if="templates.length === 0" class="no-templates">
          <span>No existing templates available to copy from.</span>
        </div>

        <!-- Dropdown when templates exist -->
        <div v-else class="dropdown-wrapper">
          <Dropdown
            v-model="selectedTemplateId"
            :options="templates"
            optionLabel="name"
            optionValue="id"
            placeholder="Select a template to copy from..."
            :loading="loading"
            showClear
            filter
            filterPlaceholder="Search templates..."
            class="template-dropdown"
            @change="handleSelection"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="selected-template">
                <span class="template-name">{{ getTemplateName(slotProps.value) }}</span>
                <Tag :value="getTemplateType(slotProps.value)" size="small" :severity="getTypeSeverity(getTemplateType(slotProps.value))" />
              </div>
              <span v-else class="placeholder-text">{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="template-option">
                <div class="template-info">
                  <span class="template-name">{{ slotProps.option.name }}</span>
                  <span class="template-code">({{ slotProps.option.code }})</span>
                </div>
                <Tag :value="slotProps.option.type" size="small" :severity="getTypeSeverity(slotProps.option.type)" />
              </div>
            </template>
            <template #empty>
              <div class="empty-message">No templates available</div>
            </template>
          </Dropdown>

          <small class="hint-text">
            <i class="pi pi-info-circle"></i>
            Selecting a template will populate all form fields. You can then modify as needed.
          </small>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import type { AllowanceTemplate } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  templates: AllowanceTemplate[];
  loading?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false
});

const emit = defineEmits<{
  (e: 'select', templateId: string | null): void;
}>();

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const selectedTemplateId = ref<string | null>(null);

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const templatesMap = computed(() => {
  const map = new Map<string, AllowanceTemplate>();
  props.templates.forEach(t => map.set(t.id, t));
  return map;
});

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function getTemplateName(id: string): string {
  return templatesMap.value.get(id)?.name || '';
}

function getTemplateType(id: string): string {
  return templatesMap.value.get(id)?.type || '';
}

function getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  switch (type) {
    case 'DAILY':
      return 'success';
    case 'MONTHLY':
      return 'info';
    case 'ONE_OFF':
      return 'warn';
    default:
      return 'secondary';
  }
}

function handleSelection(event: { value: string | null }): void {
  emit('select', event.value);
}

// ---------------------------------------------------------------------------
// EXPOSE
// ---------------------------------------------------------------------------

function reset(): void {
  selectedTemplateId.value = null;
}

defineExpose({
  reset
});
</script>

<style scoped>
.copy-from-section {
  margin-bottom: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.5rem;
  background-color: #f8fafc;
}

.copy-from-section :deep(.p-card-content) {
  padding: 1rem;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header i {
  color: #3b82f6;
  font-size: 1rem;
}

.section-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #334155;
}

.optional-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  background-color: #e2e8f0;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  margin-left: auto;
}

.dropdown-wrapper {
  width: 100%;
}

.template-dropdown {
  width: 100%;
}

.template-dropdown :deep(.p-dropdown-label) {
  padding: 0.5rem 0.75rem;
}

.selected-template {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.placeholder-text {
  color: #94a3b8;
}

.template-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.25rem 0;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.template-name {
  font-weight: 500;
  font-size: 0.8125rem;
  color: #1e293b;
}

.template-code {
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
}

/* Standardize tag sizes in dropdown */
.template-option :deep(.p-tag) {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  min-width: 4rem;
  text-align: center;
  justify-content: center;
}

.selected-template :deep(.p-tag) {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  min-width: 4rem;
  text-align: center;
  justify-content: center;
}

.empty-message {
  padding: 0.5rem;
  color: #64748b;
  font-style: italic;
  text-align: center;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #64748b;
  font-size: 0.75rem;
}

.hint-text i {
  font-size: 0.75rem;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.8125rem;
  padding: 0.5rem 0;
}

.loading-state i {
  color: #3b82f6;
}

.no-templates {
  color: #94a3b8;
  font-size: 0.8125rem;
  font-style: italic;
  padding: 0.25rem 0;
}
</style>

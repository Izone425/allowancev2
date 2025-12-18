<template>
  <div class="criteria-builder">
    <!-- Header -->
    <div class="builder-header">
      <div class="header-content">
        <h3 class="header-title">Eligibility Criteria</h3>
        <p class="header-description">
          Define rules to automatically determine which employees are eligible for this allowance.
          Leave empty to make all employees eligible.
        </p>
      </div>
      <div class="header-actions">
        <Button
          label="Preview Eligible Users"
          icon="pi pi-eye"
          class="p-button-outlined"
          :loading="previewLoading"
          :disabled="!hasRules"
          @click="handlePreview"
        />
      </div>
    </div>

    <!-- Global Operator (between groups) -->
    <div v-if="criteria.groups.length > 1" class="global-operator">
      <span class="operator-label">Match groups with:</span>
      <SelectButton
        :modelValue="criteria.groupOperator"
        @update:modelValue="setGlobalOperator"
        :options="groupOperatorOptions"
        optionLabel="label"
        optionValue="value"
        class="operator-select"
      />
    </div>

    <!-- Criteria Groups -->
    <div class="criteria-groups">
      <TransitionGroup name="group">
        <CriteriaGroup
          v-for="(group, groupIndex) in criteria.groups"
          :key="group.id"
          :group="group"
          :group-index="groupIndex"
          :show-group-operator="groupIndex > 0"
          :global-operator="criteria.groupOperator"
          :lookup-data="lookupData"
          @update-group-operator="(op) => setGroupOperator(group.id, op)"
          @add-rule="addRule(group.id)"
          @remove-rule="(ruleId) => removeRule(group.id, ruleId)"
          @update-rule="(ruleId, updates) => updateRule(group.id, ruleId, updates)"
          @remove-group="removeGroup(group.id)"
          :validation-errors="validationErrors"
        />
      </TransitionGroup>

      <!-- Empty State -->
      <div v-if="criteria.groups.length === 0" class="empty-state">
        <i class="pi pi-filter-slash empty-icon"></i>
        <h4 class="empty-title">No criteria defined</h4>
        <p class="empty-description">
          Without criteria, all employees will be eligible for this allowance.
          Add criteria to limit eligibility.
        </p>
      </div>
    </div>

    <!-- Add Group Button -->
    <div class="add-group-container">
      <Button
        :label="criteria.groups.length === 0 ? 'Add Criteria' : 'Add Another Group'"
        icon="pi pi-plus"
        class="p-button-outlined p-button-sm add-group-button"
        @click="handleAddGroup"
      />
      <span v-if="criteria.groups.length > 0" class="group-hint">
        Groups are combined using {{ criteria.groupOperator }} logic
      </span>
    </div>

    <!-- Preview Panel -->
    <Card v-if="previewResult" class="preview-panel">
      <template #header>
        <div class="preview-header">
          <div class="preview-header-left">
            <i class="pi pi-users preview-icon"></i>
            <span class="preview-title">Preview Results</span>
          </div>
          <Button
            icon="pi pi-times"
            class="p-button-text p-button-rounded p-button-sm"
            @click="clearPreview"
          />
        </div>
      </template>
      <template #content>
        <div class="preview-content">
          <div class="preview-stat">
            <span class="stat-value">{{ previewResult.eligibleCount }}</span>
            <span class="stat-label">Eligible Employees</span>
          </div>
          <Divider layout="vertical" />
          <div class="preview-users" v-if="previewResult.eligibleUsers?.length">
            <span class="users-label">Sample:</span>
            <div class="user-chips">
              <Chip
                v-for="user in previewResult.eligibleUsers.slice(0, 5)"
                :key="user.id"
                :label="user.name"
              />
              <span
                v-if="previewResult.eligibleUsers.length > 5"
                class="more-users"
              >
                +{{ previewResult.eligibleUsers.length - 5 }} more
              </span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Criteria Description -->
    <div v-if="hasRules" class="criteria-description">
      <i class="pi pi-info-circle"></i>
      <span>{{ criteriaDescription }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
// PrimeVue Components
import Button from 'primevue/button';
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import Divider from 'primevue/divider';
import Chip from 'primevue/chip';
// Components
import CriteriaGroup from './CriteriaGroup.vue';
// Composables
import { useCriteriaBuilder } from '../../composables';
// Constants
import { GROUP_OPERATOR_LABELS } from '../../constants';
// Types
import type { CriteriaSet, CriteriaGroupOperator } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  templateId?: string | null;
  initialCriteria?: CriteriaSet;
}

const props = withDefaults(defineProps<Props>(), {
  templateId: null,
  initialCriteria: undefined
});

const emit = defineEmits<{
  (e: 'update', criteria: CriteriaSet): void;
}>();

// ---------------------------------------------------------------------------
// COMPOSABLES
// ---------------------------------------------------------------------------

const {
  criteria,
  lookupData,
  previewLoading,
  previewResult,
  validationErrors,
  hasRules,
  criteriaDescription,
  addGroup,
  removeGroup,
  setGroupOperator,
  setGlobalOperator,
  addRule,
  removeRule,
  updateRule,
  previewEligibleUsers,
  clearPreview,
  setCriteria,
  getCriteria
} = useCriteriaBuilder(props.templateId);

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

const groupOperatorOptions = Object.entries(GROUP_OPERATOR_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function handleAddGroup(): void {
  addGroup();
  emitUpdate();
}

function handlePreview(): void {
  previewEligibleUsers();
}

function emitUpdate(): void {
  emit('update', getCriteria());
}

// ---------------------------------------------------------------------------
// WATCHERS
// ---------------------------------------------------------------------------

// Watch for criteria changes and emit updates
watch(
  criteria,
  () => {
    emitUpdate();
  },
  { deep: true }
);

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

onMounted(() => {
  // Initialize with provided criteria
  if (props.initialCriteria) {
    setCriteria(props.initialCriteria);
  }
});

// Expose methods for parent
defineExpose({
  getCriteria,
  setCriteria,
  previewEligibleUsers
});
</script>

<style scoped>
.criteria-builder {
  max-width: 900px;
}

/* Header */
.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Global Operator */
.global-operator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
}

.operator-label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.operator-select :deep(.p-selectbutton) {
  border-radius: 0.375rem;
}

/* Groups Container */
.criteria-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 0.5rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
  max-width: 400px;
}

/* Add Group */
.add-group-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.add-group-button {
  border-style: dashed;
}

.group-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Preview Panel */
.preview-panel {
  margin-top: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.preview-panel :deep(.p-card-header) {
  padding: 0;
}

.preview-panel :deep(.p-card-body) {
  padding: 0;
}

.preview-panel :deep(.p-card-content) {
  padding: 1rem 1.25rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
}

.preview-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-icon {
  color: #22c55e;
}

.preview-title {
  font-weight: 600;
  color: #166534;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.preview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
}

.preview-users {
  flex: 1;
}

.users-label {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.5rem;
}

.user-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.more-users {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
  padding: 0 0.5rem;
}

/* Criteria Description */
.criteria-description {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #eff6ff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.criteria-description i {
  margin-top: 0.125rem;
}

/* Transitions */
.group-enter-active,
.group-leave-active {
  transition: all 0.3s ease;
}

.group-enter-from,
.group-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .builder-header {
    flex-direction: column;
  }

  .preview-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preview-content :deep(.p-divider-vertical) {
    display: none;
  }
}
</style>

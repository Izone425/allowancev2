<template>
  <div class="criteria-group">
    <!-- Group Connector -->
    <div v-if="showGroupOperator" class="group-connector">
      <div class="connector-line"></div>
      <Tag
        :value="globalOperator"
        severity="secondary"
        class="connector-tag"
      />
      <div class="connector-line"></div>
    </div>

    <!-- Group Card -->
    <Card class="group-card">
      <template #header>
        <div class="group-header">
          <div class="group-header-left">
            <span class="group-label">Group {{ groupIndex + 1 }}</span>
            <span class="group-rule-count">
              {{ group.rules.length }} rule{{ group.rules.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="group-header-right">
            <span v-if="group.rules.length > 1" class="operator-label">
              Rules match:
            </span>
            <SelectButton
              v-if="group.rules.length > 1"
              :modelValue="group.operator"
              @update:modelValue="emit('updateGroupOperator', $event)"
              :options="groupOperatorOptions"
              optionLabel="label"
              optionValue="value"
              class="operator-select"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-text p-button-danger p-button-sm"
              @click="emit('removeGroup')"
              v-tooltip.top="'Remove group'"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="rules-container">
          <TransitionGroup name="rule">
            <CriteriaRuleRow
              v-for="(rule, ruleIndex) in group.rules"
              :key="rule.id"
              :rule="rule"
              :rule-index="ruleIndex"
              :show-connector="ruleIndex > 0"
              :group-operator="group.operator"
              :lookup-data="lookupData"
              :error="validationErrors.get(rule.id)"
              @update="(updates) => emit('updateRule', rule.id, updates)"
              @remove="emit('removeRule', rule.id)"
            />
          </TransitionGroup>

          <!-- Empty State -->
          <div v-if="group.rules.length === 0" class="rules-empty">
            <span>No rules in this group</span>
          </div>
        </div>

        <!-- Add Rule Button -->
        <div class="add-rule-container">
          <Button
            label="Add Rule"
            icon="pi pi-plus"
            class="p-button-text p-button-sm add-rule-button"
            @click="emit('addRule')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
// PrimeVue Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
// Components
import CriteriaRuleRow from './CriteriaRuleRow.vue';
// Constants
import { GROUP_OPERATOR_LABELS } from '../../constants';
// Types
import type { CriteriaGroup, CriteriaGroupOperator, LookupData } from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  group: CriteriaGroup;
  groupIndex: number;
  showGroupOperator: boolean;
  globalOperator: CriteriaGroupOperator;
  lookupData: LookupData | null;
  validationErrors: Map<string, string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'updateGroupOperator', operator: CriteriaGroupOperator): void;
  (e: 'addRule'): void;
  (e: 'removeRule', ruleId: string): void;
  (e: 'updateRule', ruleId: string, updates: Partial<any>): void;
  (e: 'removeGroup'): void;
}>();

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

const groupOperatorOptions = Object.entries(GROUP_OPERATOR_LABELS).map(
  ([value, label]) => ({ value, label })
);
</script>

<style scoped>
.criteria-group {
  display: flex;
  flex-direction: column;
}

/* Group Connector */
.group-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
}

.connector-line {
  flex: 1;
  height: 1px;
  background-color: #e2e8f0;
  max-width: 100px;
}

.connector-tag {
  margin: 0 0.75rem;
  font-weight: 600;
}

/* Group Card */
.group-card {
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.group-card :deep(.p-card-header) {
  padding: 0;
}

.group-card :deep(.p-card-body) {
  padding: 0;
}

.group-card :deep(.p-card-content) {
  padding: 1rem;
}

/* Group Header */
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.group-rule-count {
  font-size: 0.75rem;
  color: #64748b;
  background-color: #e2e8f0;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
}

.group-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.operator-label {
  font-size: 0.75rem;
  color: #64748b;
}

.operator-select :deep(.p-selectbutton) {
  border-radius: 0.375rem;
}

.operator-select :deep(.p-button) {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

/* Rules Container */
.rules-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rules-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* Add Rule */
.add-rule-container {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.add-rule-button {
  width: 100%;
  justify-content: center;
}

/* Transitions */
.rule-enter-active,
.rule-leave-active {
  transition: all 0.2s ease;
}

.rule-enter-from,
.rule-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>

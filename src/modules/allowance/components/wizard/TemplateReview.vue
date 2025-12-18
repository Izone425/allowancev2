<template>
  <div class="template-review">
    <div class="review-header">
      <h3 class="review-title">Review Your Allowance Template</h3>
      <p class="review-subtitle">
        Please review all details before saving. Click on any section to edit.
      </p>
    </div>

    <!-- Template Info Section -->
    <Card class="review-section">
      <template #header>
        <div class="section-header" @click="emit('editStep', 0)">
          <div class="section-header-left">
            <i class="pi pi-file-edit section-icon"></i>
            <span class="section-title">Template Information</span>
          </div>
          <Button
            icon="pi pi-pencil"
            class="p-button-text p-button-sm edit-button"
            @click.stop="emit('editStep', 0)"
          />
        </div>
      </template>
      <template #content>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name</span>
            <span class="info-value">{{ formData.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Code</span>
            <span class="info-value code">{{ formData.code || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Type</span>
            <Tag
              :value="getTypeLabel(formData.type)"
              :style="{ backgroundColor: getTypeColor(formData.type) }"
            />
          </div>
          <div class="info-item">
            <span class="info-label">Amount</span>
            <span class="info-value">
              {{ formData.amountMode === 'FIXED' ? formatAmount() : 'Formula' }}
            </span>
          </div>
          <div v-if="formData.description" class="info-item full-width">
            <span class="info-label">Description</span>
            <span class="info-value">{{ formData.description }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Effective Period</span>
            <span class="info-value">
              {{ formatDate(formData.effectiveStart) }}
              →
              {{ formData.effectiveEnd ? formatDate(formData.effectiveEnd) : 'Ongoing' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Options</span>
            <div class="info-tags">
              <Tag
                :value="formData.taxable ? 'Taxable' : 'Non-taxable'"
                :severity="formData.taxable ? 'warning' : 'secondary'"
              />
              <Tag
                v-if="formData.prorate"
                value="Prorated"
                severity="info"
              />
            </div>
          </div>
        </div>

        <!-- Type-specific info -->
        <div v-if="hasTypeSpecificInfo" class="type-specific-info">
          <Divider />
          <h4 class="subsection-title">{{ getTypeLabel(formData.type) }} Settings</h4>
          <div class="info-grid">
            <template v-if="formData.type === 'DAILY'">
              <div v-if="formData.ratePerDay" class="info-item">
                <span class="info-label">Rate Per Day</span>
                <span class="info-value">
                  {{ formatCurrency(formData.ratePerDay) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Include Non-working Days</span>
                <Tag
                  :value="formData.includeNonWorkingDays ? 'Yes' : 'No'"
                  :severity="formData.includeNonWorkingDays ? 'success' : 'secondary'"
                />
              </div>
            </template>
            <template v-if="formData.type === 'MONTHLY'">
              <div class="info-item">
                <span class="info-label">Prorate by Join Date</span>
                <Tag
                  :value="formData.prorateByJoinDate ? 'Yes' : 'No'"
                  :severity="formData.prorateByJoinDate ? 'success' : 'secondary'"
                />
              </div>
              <div class="info-item">
                <span class="info-label">Prorate by Resignation</span>
                <Tag
                  :value="formData.prorateByLeaveDate ? 'Yes' : 'No'"
                  :severity="formData.prorateByLeaveDate ? 'success' : 'secondary'"
                />
              </div>
            </template>
            <template v-if="formData.type === 'ONE_OFF'">
              <div class="info-item">
                <span class="info-label">Payout</span>
                <span class="info-value">
                  {{ formData.payoutDate
                    ? formatDate(formData.payoutDate)
                    : formData.payoutMonth || '-'
                  }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </template>
    </Card>

    <!-- Criteria Section -->
    <Card class="review-section">
      <template #header>
        <div class="section-header" @click="emit('editStep', 1)">
          <div class="section-header-left">
            <i class="pi pi-filter section-icon"></i>
            <span class="section-title">Eligibility Criteria</span>
          </div>
          <Button
            icon="pi pi-pencil"
            class="p-button-text p-button-sm edit-button"
            @click.stop="emit('editStep', 1)"
          />
        </div>
      </template>
      <template #content>
        <div v-if="!hasCriteria" class="empty-section">
          <i class="pi pi-info-circle empty-icon"></i>
          <span>No criteria defined. All users will be eligible.</span>
        </div>
        <div v-else class="criteria-summary">
          <div
            v-for="(group, gIndex) in criteria.groups"
            :key="group.id"
            class="criteria-group"
          >
            <div v-if="gIndex > 0" class="group-connector">
              <Tag :value="criteria.groupOperator" severity="secondary" />
            </div>
            <div class="criteria-rules">
              <div
                v-for="(rule, rIndex) in group.rules"
                :key="rule.id"
                class="criteria-rule"
              >
                <span v-if="rIndex > 0" class="rule-connector">
                  {{ group.operator }}
                </span>
                <span class="rule-text">
                  <strong>{{ getFieldLabel(rule.field) }}</strong>
                  {{ getOperatorLabel(rule.operator) }}
                  <em>{{ formatRuleValue(rule.value) }}</em>
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Assignments Section -->
    <Card class="review-section">
      <template #header>
        <div class="section-header" @click="emit('editStep', 2)">
          <div class="section-header-left">
            <i class="pi pi-users section-icon"></i>
            <span class="section-title">User Assignments</span>
          </div>
          <Button
            icon="pi pi-pencil"
            class="p-button-text p-button-sm edit-button"
            @click.stop="emit('editStep', 2)"
          />
        </div>
      </template>
      <template #content>
        <div v-if="selectedUserIds.length === 0" class="empty-section">
          <i class="pi pi-info-circle empty-icon"></i>
          <span>No users assigned yet. You can assign users after saving.</span>
        </div>
        <div v-else class="assignment-summary">
          <div class="assignment-stat">
            <Badge :value="selectedUserIds.length" size="large" severity="info" />
            <span class="stat-label">users to be assigned</span>
          </div>
          <div class="assignment-mode">
            <Tag
              :value="assignmentMode === 'CRITERIA' ? 'By Criteria' : 'Manual Selection'"
              :severity="assignmentMode === 'CRITERIA' ? 'success' : 'info'"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Summary Alert -->
    <Message
      v-if="hasWarnings"
      severity="warn"
      :closable="false"
      class="summary-message"
    >
      <template #messageicon>
        <i class="pi pi-exclamation-triangle"></i>
      </template>
      <div class="message-content">
        <strong>Please note:</strong>
        <ul class="warning-list">
          <li v-if="!hasCriteria && selectedUserIds.length === 0">
            No eligibility criteria and no users assigned. You can add these after saving.
          </li>
        </ul>
      </div>
    </Message>

    <!-- Ready Message -->
    <Message
      v-if="isReadyToActivate"
      severity="success"
      :closable="false"
      class="summary-message"
    >
      <template #messageicon>
        <i class="pi pi-check-circle"></i>
      </template>
      Your template is ready to be activated!
    </Message>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// PrimeVue Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import Message from 'primevue/message';
// Constants
import {
  ALLOWANCE_TYPE_OPTIONS,
  CRITERIA_FIELD_OPTIONS,
  CRITERIA_OPERATOR_LABELS,
  CURRENCY_OPTIONS
} from '../../constants';
// Types
import type {
  TemplateInfoFormData,
  CriteriaSet,
  CriteriaField,
  CriteriaOperator,
  CriteriaValue,
  AllowanceType
} from '../../types';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  formData: TemplateInfoFormData;
  criteria: CriteriaSet;
  selectedUserIds: string[];
  assignmentMode: 'MANUAL' | 'CRITERIA';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'editStep', step: number): void;
}>();

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const hasCriteria = computed(
  () => props.criteria.groups.some((g) => g.rules.length > 0)
);

const hasTypeSpecificInfo = computed(() => {
  if (!props.formData.type) return false;
  if (props.formData.type === 'DAILY') {
    return props.formData.ratePerDay || props.formData.includeNonWorkingDays !== undefined;
  }
  if (props.formData.type === 'MONTHLY') {
    return props.formData.prorateByJoinDate || props.formData.prorateByLeaveDate;
  }
  if (props.formData.type === 'ONE_OFF') {
    return props.formData.payoutDate || props.formData.payoutMonth;
  }
  return false;
});

const hasWarnings = computed(
  () => (!hasCriteria.value && props.selectedUserIds.length === 0)
);

const isReadyToActivate = computed(
  () => props.formData.name &&
    props.formData.code &&
    props.formData.type &&
    props.formData.effectiveStart &&
    (props.formData.amountMode === 'FORMULA' || props.formData.amount)
);

// ---------------------------------------------------------------------------
// FORMATTERS
// ---------------------------------------------------------------------------

function getTypeLabel(type: AllowanceType | null): string {
  if (!type) return '-';
  return ALLOWANCE_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

function getTypeColor(type: AllowanceType | null): string {
  if (!type) return '#6B7280';
  return ALLOWANCE_TYPE_OPTIONS.find((t) => t.value === type)?.color || '#6B7280';
}

function formatAmount(): string {
  if (!props.formData.amount) return '-';
  const currencyOption = CURRENCY_OPTIONS.find(
    (c) => c.value === props.formData.currency
  );
  const symbol = currencyOption?.symbol || props.formData.currency;
  return `${symbol} ${props.formData.amount.toLocaleString()}`;
}

function formatCurrency(value: number | null): string {
  if (!value) return '-';
  const currencyOption = CURRENCY_OPTIONS.find(
    (c) => c.value === props.formData.currency
  );
  const symbol = currencyOption?.symbol || props.formData.currency;
  return `${symbol} ${value.toLocaleString()}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getFieldLabel(field: CriteriaField): string {
  return CRITERIA_FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
}

function getOperatorLabel(operator: CriteriaOperator): string {
  return CRITERIA_OPERATOR_LABELS[operator] || operator;
}

function formatRuleValue(value: CriteriaValue): string {
  if (Array.isArray(value)) {
    return value.length > 3
      ? `${value.slice(0, 3).join(', ')} +${value.length - 3} more`
      : value.join(', ');
  }
  if (typeof value === 'object' && 'min' in value) {
    return `${value.min} - ${value.max}`;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}
</script>

<style scoped>
.template-review {
  max-width: 900px;
}

/* Header */
.review-header {
  margin-bottom: 1.5rem;
}

.review-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.review-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Sections */
.review-section {
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.review-section :deep(.p-card-header) {
  padding: 0;
}

.review-section :deep(.p-card-body) {
  padding: 0;
}

.review-section :deep(.p-card-content) {
  padding: 1rem 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background-color: #f8fafc;
  cursor: pointer;
  transition: background-color 0.2s;
}

.section-header:hover {
  background-color: #f1f5f9;
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.25rem;
  color: #3b82f6;
}

.section-title {
  font-weight: 600;
  color: #1e293b;
}

.edit-button {
  opacity: 0;
  transition: opacity 0.2s;
}

.section-header:hover .edit-button {
  opacity: 1;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.info-value {
  font-size: 0.875rem;
  color: #1e293b;
}

.info-value.code {
  font-family: monospace;
}

.info-tags {
  display: flex;
  gap: 0.5rem;
}

/* Subsection */
.subsection-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 1rem 0;
}

/* Empty Section */
.empty-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  color: #64748b;
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 1.25rem;
  color: #94a3b8;
}

/* Criteria Summary */
.criteria-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criteria-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-connector {
  display: flex;
  justify-content: center;
  padding: 0.25rem 0;
}

.criteria-rules {
  background-color: #f8fafc;
  border-radius: 0.375rem;
  padding: 1rem;
}

.criteria-rule {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.rule-connector {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.rule-text {
  font-size: 0.875rem;
  color: #475569;
}

.rule-text strong {
  color: #1e293b;
}

.rule-text em {
  color: #3b82f6;
  font-style: normal;
  font-weight: 500;
}

/* Assignment Summary */
.assignment-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.375rem;
}

.assignment-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

/* Summary Message */
.summary-message {
  margin-top: 1rem;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
}

.warning-list li {
  margin-bottom: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .assignment-summary {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>

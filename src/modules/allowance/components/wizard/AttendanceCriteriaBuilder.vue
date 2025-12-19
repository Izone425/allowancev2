<template>
  <div class="condition-builder">
    <!-- Header -->
    <div class="builder-header">
      <div class="header-info">
        <span v-if="modelValue.groups.length > 0" class="condition-count">
          {{ totalRulesCount }} condition{{ totalRulesCount !== 1 ? 's' : '' }}
        </span>
      </div>
      <Button
        label="Add Condition"
        icon="pi pi-plus"
        size="small"
        class="add-btn"
        @click="addCondition"
      />
    </div>

    <!-- Conditions List -->
    <div v-if="modelValue.groups.length > 0" class="conditions-container">
      <template v-for="(group, groupIndex) in modelValue.groups" :key="group.id">
        <!-- Group Operator (between groups) -->
        <div v-if="groupIndex > 0" class="group-operator-row">
          <div class="operator-line"></div>
          <div class="operator-switch" @click="toggleGroupOperator">
            <span class="switch-option" :class="{ active: modelValue.groupOperator === 'AND' }">AND</span>
            <span class="switch-option" :class="{ active: modelValue.groupOperator === 'OR' }">OR</span>
            <span class="switch-slider" :class="{ 'is-or': modelValue.groupOperator === 'OR' }"></span>
          </div>
          <div class="operator-line"></div>
        </div>

        <!-- Condition Group -->
        <div class="condition-group" :class="{ 'has-multiple': group.rules.length > 1, 'has-badge': modelValue.groups.length > 1 }">
          <!-- Group Header with Badge (only show if multiple groups) -->
          <div v-if="modelValue.groups.length > 1" class="group-header">
            <div class="group-badge" :style="{ '--group-color': getGroupColor(groupIndex) }">
              <span class="badge-number">{{ groupIndex + 1 }}</span>
            </div>
            <button
              class="badge-remove"
              @click="removeGroup(groupIndex)"
              title="Remove group"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Rules -->
          <div class="rules-list">
            <template v-for="(rule, ruleIndex) in group.rules" :key="rule.id">
              <!-- Rule Operator (within group) -->
              <div v-if="ruleIndex > 0" class="rule-operator-row">
                <div class="operator-switch small" @click="toggleRuleOperator(groupIndex)">
                  <span class="switch-option" :class="{ active: group.operator === 'AND' }">AND</span>
                  <span class="switch-option" :class="{ active: group.operator === 'OR' }">OR</span>
                  <span class="switch-slider" :class="{ 'is-or': group.operator === 'OR' }"></span>
                </div>
              </div>

              <!-- Rule Row -->
              <div class="rule-row">
                <div class="rule-content">
                  <!-- Field Dropdown -->
                  <div class="field-group field-select">
                    <label class="field-label">Field</label>
                    <Dropdown
                      :modelValue="rule.field"
                      @update:modelValue="(val) => updateRule(groupIndex, ruleIndex, 'field', val)"
                      :options="criteriaFieldOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select field"
                      class="custom-dropdown"
                    />
                  </div>

                  <!-- Leave Type Selection (shown before operator for LEAVE_TIMES) -->
                  <div v-if="isLeaveField(rule.field)" class="field-group leave-type-select-group">
                    <label class="field-label">Leave Type</label>
                    <Dropdown
                      :modelValue="getLeaveValue(rule.value).leaveType || null"
                      @update:modelValue="(val) => updateLeaveValue(groupIndex, ruleIndex, 'leaveType', val ?? '')"
                      :options="leaveTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="All Leave Types"
                      class="custom-dropdown leave-type-dropdown"
                      showClear
                    />
                  </div>

                  <!-- Operator Dropdown (hidden for time range fields) -->
                  <div v-if="!isTimeRangeField(rule.field)" class="field-group operator-select">
                    <label class="field-label">Operator</label>
                    <Dropdown
                      :modelValue="rule.condition"
                      @update:modelValue="(val) => updateRule(groupIndex, ruleIndex, 'condition', val)"
                      :options="conditionOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Op"
                      class="custom-dropdown operator-dropdown"
                    />
                  </div>

                  <!-- Simple Count Value (LATE_IN_TIMES, ABSENT_TIMES, etc.) -->
                  <div v-if="isCountField(rule.field)" class="field-group value-input-simple">
                    <label class="field-label">Value</label>
                    <div class="simple-value-group">
                      <InputNumber
                        :modelValue="getSimpleTimeValue(rule.value).hours"
                        @update:modelValue="(val) => updateRuleValue(groupIndex, ruleIndex, 'hours', val ?? 0)"
                        :min="0"
                        :max="999"
                        class="simple-number"
                        :inputClass="'simple-input-field'"
                      />
                      <span class="value-unit">times</span>
                    </div>
                  </div>

                  <!-- Leave Value (count only, leave types moved above) -->
                  <div v-else-if="isLeaveField(rule.field)" class="field-group value-input-simple">
                    <label class="field-label">Value</label>
                    <div class="simple-value-group">
                      <InputNumber
                        :modelValue="getLeaveValue(rule.value).count"
                        @update:modelValue="(val) => updateLeaveValue(groupIndex, ruleIndex, 'count', val ?? 0)"
                        :min="0"
                        :max="999"
                        class="simple-number"
                        :inputClass="'simple-input-field'"
                      />
                      <span class="value-unit">times</span>
                    </div>
                  </div>

                  <!-- Simple Minutes Value (LATE_IN_MINUTES) -->
                  <div v-else-if="isMinutesOnlyField(rule.field)" class="field-group value-input-simple">
                    <label class="field-label">Value</label>
                    <div class="simple-value-group">
                      <InputNumber
                        :modelValue="getSimpleTimeValue(rule.value).minutes"
                        @update:modelValue="(val) => updateRuleValue(groupIndex, ruleIndex, 'minutes', val ?? 0)"
                        :min="0"
                        :max="9999"
                        class="simple-number"
                        :inputClass="'simple-input-field'"
                      />
                      <span class="value-unit">minutes</span>
                    </div>
                  </div>

                  <!-- Time Duration Value (hours:minutes for regular fields) -->
                  <div v-else-if="!isTimeRangeField(rule.field)" class="field-group value-input">
                    <label class="field-label">Value</label>
                    <div class="time-value-group">
                      <div class="time-segment">
                        <InputNumber
                          :modelValue="getSimpleTimeValue(rule.value).hours"
                          @update:modelValue="(val) => updateRuleValue(groupIndex, ruleIndex, 'hours', val ?? 0)"
                          :min="0"
                          :max="99"
                          class="time-number"
                          :inputClass="'time-input-field'"
                        />
                        <span class="time-label">hrs</span>
                      </div>
                      <span class="time-colon">:</span>
                      <div class="time-segment">
                        <InputNumber
                          :modelValue="getSimpleTimeValue(rule.value).minutes"
                          @update:modelValue="(val) => updateRuleValue(groupIndex, ruleIndex, 'minutes', val ?? 0)"
                          :min="0"
                          :max="59"
                          class="time-number"
                          :inputClass="'time-input-field'"
                        />
                        <span class="time-label">min</span>
                      </div>
                    </div>
                  </div>

                  <!-- Time Range Value (WORKING_TIME and OVERTIME_TIME fields) -->
                  <div v-else class="field-group value-input-wide">
                    <label class="field-label">{{ getTimeRangeLabel(rule.field) }}</label>
                    <div class="time-range-group">
                      <!-- Start Time -->
                      <div class="time-range-segment">
                        <span class="time-range-label">START</span>
                        <div class="time-picker-24h">
                          <input
                            type="text"
                            :value="formatTime24(getTimeRangeValue(rule.value).startTime)"
                            @input="(e) => handleTimeInput(e, groupIndex, ruleIndex, 'startTime')"
                            @blur="(e) => handleTimeBlur(e, groupIndex, ruleIndex, 'startTime')"
                            class="time-input-24h"
                            placeholder="00:00"
                            maxlength="5"
                          />
                        </div>
                      </div>
                      <span class="time-range-separator">to</span>
                      <!-- End Time -->
                      <div class="time-range-segment">
                        <span class="time-range-label">END</span>
                        <div class="time-picker-24h">
                          <input
                            type="text"
                            :value="formatTime24(getTimeRangeValue(rule.value).endTime)"
                            @input="(e) => handleTimeInput(e, groupIndex, ruleIndex, 'endTime')"
                            @blur="(e) => handleTimeBlur(e, groupIndex, ruleIndex, 'endTime')"
                            class="time-input-24h"
                            placeholder="00:00"
                            maxlength="5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="rule-actions">
                  <button
                    class="action-btn add-rule-btn"
                    @click="addRule(groupIndex)"
                    title="Add rule to group"
                  >
                    <i class="pi pi-plus"></i>
                  </button>
                  <button
                    class="action-btn remove-rule-btn"
                    @click="removeRule(groupIndex, ruleIndex)"
                    :disabled="group.rules.length === 1 && modelValue.groups.length === 1"
                    title="Remove rule"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-filter"></i>
      </div>
      <p class="empty-title">No conditions defined</p>
      <p class="empty-desc">Click "Add Condition" to create attendance-based rules</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// PrimeVue Components
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
// Types
import type {
  AttendanceCriteriaSet,
  AttendanceCriteriaGroup,
  AttendanceCriteriaRule,
  AttendanceCriteriaField,
  AttendanceCriteriaCondition,
  AttendanceTimeValue,
  AttendanceTimeRangeValue,
  AttendanceLeaveValue
} from '../../types';
import { CriteriaGroupOperator, AttendanceCriteriaField as AttendanceFieldEnum } from '../../types';
// Constants
import {
  ATTENDANCE_CRITERIA_FIELD_OPTIONS,
  ATTENDANCE_CRITERIA_CONDITION_OPTIONS,
  LEAVE_TYPE_OPTIONS
} from '../../constants';

// ---------------------------------------------------------------------------
// PROPS & EMITS
// ---------------------------------------------------------------------------

interface Props {
  modelValue: AttendanceCriteriaSet;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: AttendanceCriteriaSet): void;
}>();

// ---------------------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------------------

const criteriaFieldOptions = ATTENDANCE_CRITERIA_FIELD_OPTIONS;
const conditionOptions = ATTENDANCE_CRITERIA_CONDITION_OPTIONS;
const leaveTypeOptions = LEAVE_TYPE_OPTIONS;

const groupColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

// ---------------------------------------------------------------------------
// COMPUTED
// ---------------------------------------------------------------------------

const totalRulesCount = computed(() => {
  return props.modelValue.groups.reduce((sum, group) => sum + group.rules.length, 0);
});

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getGroupColor(index: number): string {
  return groupColors[index % groupColors.length];
}

// Type guards for time values
function isTimeRangeValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): value is AttendanceTimeRangeValue {
  return 'startTime' in value && 'endTime' in value;
}

// Type guard for leave values
function isLeaveValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): value is AttendanceLeaveValue {
  return 'count' in value && 'leaveType' in value;
}

// Check if field uses time range input (start & end)
function isTimeRangeField(field: AttendanceCriteriaField): boolean {
  return field === AttendanceFieldEnum.WORKING_TIME || field === AttendanceFieldEnum.OVERTIME_TIME;
}

// Check if field is a simple count field (just a number)
function isCountField(field: AttendanceCriteriaField): boolean {
  return field === AttendanceFieldEnum.LATE_IN_TIMES ||
         field === AttendanceFieldEnum.EARLY_OUT_TIMES ||
         field === AttendanceFieldEnum.EXTENDED_BREAK_TIMES ||
         field === AttendanceFieldEnum.SHORT_HOURS_TIMES ||
         field === AttendanceFieldEnum.ABSENT_TIMES;
}

// Check if field is a leave field (has leave type selection)
function isLeaveField(field: AttendanceCriteriaField): boolean {
  return field === AttendanceFieldEnum.LEAVE_TIMES;
}

// Check if field is a minutes-only field
function isMinutesOnlyField(field: AttendanceCriteriaField): boolean {
  return field === AttendanceFieldEnum.LATE_IN_MINUTES ||
         field === AttendanceFieldEnum.EARLY_OUT_MINUTES ||
         field === AttendanceFieldEnum.EXTENDED_BREAK_MINUTES ||
         field === AttendanceFieldEnum.SHORT_HOURS_MINUTES;
}

// Get label for time range fields
function getTimeRangeLabel(field: AttendanceCriteriaField): string {
  if (field === AttendanceFieldEnum.OVERTIME_TIME) {
    return 'Overtime Start & End';
  }
  return 'Time Start & End';
}

// Get simple time value (for regular fields)
function getSimpleTimeValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): AttendanceTimeValue {
  if (isTimeRangeValue(value) || isLeaveValue(value)) {
    return { hours: 0, minutes: 0 };
  }
  return value;
}

// Get leave value (for LEAVE_TIMES field)
function getLeaveValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): AttendanceLeaveValue {
  if (isLeaveValue(value)) {
    return value;
  }
  return { count: 0, leaveType: '' };
}

// Create default leave value
function createDefaultLeaveValue(): AttendanceLeaveValue {
  return { count: 0, leaveType: '' };
}

// Get time range value (for WORKING_TIME field)
function getTimeRangeValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): AttendanceTimeRangeValue {
  if (isTimeRangeValue(value)) {
    return value;
  }
  return {
    startTime: { hours: 0, minutes: 0 },
    endTime: { hours: 0, minutes: 0 }
  };
}

// Create default time range value
function createDefaultTimeRangeValue(): AttendanceTimeRangeValue {
  return {
    startTime: { hours: 0, minutes: 0 },
    endTime: { hours: 0, minutes: 0 }
  };
}

// Format time as HH:MM (24-hour format)
function formatTime24(time: AttendanceTimeValue): string {
  const hours = String(time.hours).padStart(2, '0');
  const minutes = String(time.minutes).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Parse time string to hours and minutes
function parseTime24(timeStr: string): { hours: number; minutes: number } {
  const cleaned = timeStr.replace(/[^\d:]/g, '');
  const parts = cleaned.split(':');

  let hours = 0;
  let minutes = 0;

  if (parts.length >= 1 && parts[0]) {
    hours = Math.min(23, Math.max(0, parseInt(parts[0]) || 0));
  }
  if (parts.length >= 2 && parts[1]) {
    minutes = Math.min(59, Math.max(0, parseInt(parts[1]) || 0));
  }

  return { hours, minutes };
}

// Handle time input with auto-formatting
function handleTimeInput(
  event: Event,
  groupIndex: number,
  ruleIndex: number,
  timeType: 'startTime' | 'endTime'
): void {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^\d:]/g, '');

  // Auto-insert colon after 2 digits if not present
  if (value.length === 2 && !value.includes(':')) {
    value = value + ':';
    input.value = value;
  }

  // Limit to HH:MM format
  if (value.length > 5) {
    value = value.substring(0, 5);
    input.value = value;
  }
}

// Handle time blur - validate and update (for time range fields)
function handleTimeBlur(
  event: Event,
  groupIndex: number,
  ruleIndex: number,
  timeType: 'startTime' | 'endTime'
): void {
  const input = event.target as HTMLInputElement;
  const parsed = parseTime24(input.value);

  // Update the value in the model
  const newGroups = [...props.modelValue.groups];
  const newRules = [...newGroups[groupIndex].rules];
  const currentValue = getTimeRangeValue(newRules[ruleIndex].value);

  newRules[ruleIndex] = {
    ...newRules[ruleIndex],
    value: {
      ...currentValue,
      [timeType]: parsed
    }
  };
  newGroups[groupIndex] = { ...newGroups[groupIndex], rules: newRules };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });

  // Update input display to formatted value
  input.value = formatTime24(parsed);
}

function createDefaultRule(): AttendanceCriteriaRule {
  return {
    id: generateId(),
    field: criteriaFieldOptions[0].value as AttendanceCriteriaField,
    condition: conditionOptions[0].value as AttendanceCriteriaCondition,
    value: { hours: 0, minutes: 0 }
  };
}

function createDefaultGroup(): AttendanceCriteriaGroup {
  return {
    id: generateId(),
    operator: CriteriaGroupOperator.AND,
    rules: [createDefaultRule()]
  };
}

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------

function toggleGroupOperator(): void {
  const newOp = props.modelValue.groupOperator === CriteriaGroupOperator.AND
    ? CriteriaGroupOperator.OR
    : CriteriaGroupOperator.AND;
  emit('update:modelValue', { ...props.modelValue, groupOperator: newOp });
}

function toggleRuleOperator(groupIndex: number): void {
  const newGroups = [...props.modelValue.groups];
  const currentOp = newGroups[groupIndex].operator;
  const newOp = currentOp === CriteriaGroupOperator.AND
    ? CriteriaGroupOperator.OR
    : CriteriaGroupOperator.AND;
  newGroups[groupIndex] = { ...newGroups[groupIndex], operator: newOp };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function addCondition(): void {
  const newGroups = [...props.modelValue.groups, createDefaultGroup()];
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function removeGroup(groupIndex: number): void {
  const newGroups = props.modelValue.groups.filter((_, i) => i !== groupIndex);
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function addRule(groupIndex: number): void {
  const newGroups = [...props.modelValue.groups];
  newGroups[groupIndex] = {
    ...newGroups[groupIndex],
    rules: [...newGroups[groupIndex].rules, createDefaultRule()]
  };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function removeRule(groupIndex: number, ruleIndex: number): void {
  const newGroups = [...props.modelValue.groups];
  const group = newGroups[groupIndex];

  if (group.rules.length === 1) {
    if (props.modelValue.groups.length > 1) {
      newGroups.splice(groupIndex, 1);
    }
  } else {
    newGroups[groupIndex] = {
      ...group,
      rules: group.rules.filter((_, i) => i !== ruleIndex)
    };
  }

  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function updateRule(
  groupIndex: number,
  ruleIndex: number,
  field: 'field' | 'condition',
  value: AttendanceCriteriaField | AttendanceCriteriaCondition
): void {
  const newGroups = [...props.modelValue.groups];
  const newRules = [...newGroups[groupIndex].rules];
  const currentRule = newRules[ruleIndex];

  // When changing field, also update the value type accordingly
  if (field === 'field') {
    const newField = value as AttendanceCriteriaField;
    const isNewTimeRange = isTimeRangeField(newField);
    const wasTimeRange = isTimeRangeField(currentRule.field);
    const isNewLeave = isLeaveField(newField);
    const wasLeave = isLeaveField(currentRule.field);

    // Reset value when switching between different field types
    if (isNewTimeRange && !wasTimeRange) {
      newRules[ruleIndex] = {
        ...currentRule,
        field: newField,
        value: createDefaultTimeRangeValue()
      };
    } else if (isNewLeave && !wasLeave) {
      newRules[ruleIndex] = {
        ...currentRule,
        field: newField,
        value: createDefaultLeaveValue()
      };
    } else if (!isNewTimeRange && !isNewLeave && (wasTimeRange || wasLeave)) {
      newRules[ruleIndex] = {
        ...currentRule,
        field: newField,
        value: { hours: 0, minutes: 0 }
      };
    } else {
      newRules[ruleIndex] = { ...currentRule, [field]: value };
    }
  } else {
    newRules[ruleIndex] = { ...currentRule, [field]: value };
  }

  newGroups[groupIndex] = { ...newGroups[groupIndex], rules: newRules };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function updateRuleValue(
  groupIndex: number,
  ruleIndex: number,
  field: 'hours' | 'minutes',
  value: number
): void {
  const newGroups = [...props.modelValue.groups];
  const newRules = [...newGroups[groupIndex].rules];
  const currentValue = getSimpleTimeValue(newRules[ruleIndex].value);
  newRules[ruleIndex] = {
    ...newRules[ruleIndex],
    value: { ...currentValue, [field]: value }
  };
  newGroups[groupIndex] = { ...newGroups[groupIndex], rules: newRules };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function updateTimeRangeValue(
  groupIndex: number,
  ruleIndex: number,
  timeType: 'startTime' | 'endTime',
  field: 'hours' | 'minutes',
  value: number
): void {
  const newGroups = [...props.modelValue.groups];
  const newRules = [...newGroups[groupIndex].rules];
  const currentValue = getTimeRangeValue(newRules[ruleIndex].value);
  newRules[ruleIndex] = {
    ...newRules[ruleIndex],
    value: {
      ...currentValue,
      [timeType]: {
        ...currentValue[timeType],
        [field]: value
      }
    }
  };
  newGroups[groupIndex] = { ...newGroups[groupIndex], rules: newRules };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}

function updateLeaveValue(
  groupIndex: number,
  ruleIndex: number,
  field: 'count' | 'leaveType',
  value: number | string
): void {
  const newGroups = [...props.modelValue.groups];
  const newRules = [...newGroups[groupIndex].rules];
  const currentValue = getLeaveValue(newRules[ruleIndex].value);
  newRules[ruleIndex] = {
    ...newRules[ruleIndex],
    value: {
      ...currentValue,
      [field]: value
    }
  };
  newGroups[groupIndex] = { ...newGroups[groupIndex], rules: newRules };
  emit('update:modelValue', { ...props.modelValue, groups: newGroups });
}
</script>

<style scoped>
.condition-builder {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 1rem;
}

/* Header */
.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.condition-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  background: #ffffff;
  padding: 0.25rem 0.625rem;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
}

.add-btn {
  font-weight: 500;
}

.add-btn :deep(.p-button) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.add-btn :deep(.p-button:hover) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

/* Conditions Container */
.conditions-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Group Operator Row */
.group-operator-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;
}

.operator-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
}

/* Operator Switch */
.operator-switch {
  position: relative;
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  user-select: none;
}

.operator-switch .switch-option {
  position: relative;
  z-index: 1;
  padding: 0.25rem 0.625rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.2s ease;
}

.operator-switch .switch-option.active {
  color: #ffffff;
}

.operator-switch .switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px;
  transition: transform 0.2s ease, background 0.2s ease;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.operator-switch .switch-slider.is-or {
  transform: translateX(100%);
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
}

.operator-switch.small {
  padding: 1px;
}

.operator-switch.small .switch-option {
  padding: 0.125rem 0.5rem;
  font-size: 0.5625rem;
}

.operator-switch.small .switch-slider {
  top: 1px;
  left: 1px;
  width: calc(50% - 1px);
  height: calc(100% - 2px);
}

/* Condition Group */
.condition-group {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.condition-group.has-multiple {
  border-left: 3px solid var(--group-color, #6366f1);
}

/* Group Header */
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

/* Group Badge */
.group-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-number {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--group-color, #6366f1);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.badge-remove {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.625rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
}

.condition-group:hover .badge-remove {
  opacity: 1;
}

.badge-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Rules List */
.rules-list {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Rule Operator Row */
.rule-operator-row {
  display: flex;
  align-items: center;
  padding: 0.375rem 0 0.375rem 2.5rem;
}


/* Rule Row */
.rule-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #fafbfc;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.rule-row:hover {
  background: #f5f7fa;
}

.rule-content {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  flex: 1;
}

/* Field Groups */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 0.125rem;
}

.field-select {
  flex: 1;
  min-width: 140px;
}

.operator-select {
  min-width: 180px;
}

.value-input {
  min-width: 150px;
}

.value-input-wide {
  min-width: 280px;
}

/* Time Range Group (for WORKING_TIME) */
.time-range-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  height: 34px;
}

.time-range-segment {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.time-range-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  min-width: 32px;
}

/* 24-hour Time Picker */
.time-picker-24h {
  display: flex;
  align-items: center;
}

.time-input-24h {
  width: 54px;
  height: 26px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  padding: 0.25rem 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  color: #1e293b;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}

.time-input-24h::placeholder {
  color: #cbd5e1;
  font-weight: 400;
}

.time-input-24h:hover {
  border-color: #cbd5e1;
}

.time-input-24h:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.time-range-separator {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #94a3b8;
  padding: 0 0.25rem;
}

/* Custom Dropdown Styles */
.custom-dropdown :deep(.p-dropdown) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  height: 34px;
  transition: all 0.15s ease;
}

.custom-dropdown :deep(.p-dropdown:hover) {
  border-color: #cbd5e1;
}

.custom-dropdown :deep(.p-dropdown:focus),
.custom-dropdown :deep(.p-dropdown.p-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.custom-dropdown :deep(.p-dropdown-label) {
  font-size: 0.8125rem;
  padding: 0.5rem 0.625rem;
  color: #1e293b;
}

.operator-dropdown :deep(.p-dropdown-label) {
  font-weight: 600;
  text-align: center;
}

/* Time Value Group */
.time-value-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.25rem 0.625rem;
  height: 34px;
}

.time-segment {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.time-number {
  width: 50px;
}

.time-number :deep(.p-inputnumber) {
  width: 100%;
}

.time-number :deep(.p-inputnumber-input) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  padding: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  height: 24px;
  width: 100%;
}

.time-number :deep(.p-inputnumber-input:focus) {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.time-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  text-transform: lowercase;
}

.time-colon {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0.125rem;
}

/* Rule Actions */
.rule-actions {
  display: flex;
  gap: 0.25rem;
  padding-bottom: 0.125rem;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}

.add-rule-btn {
  background: #f0fdf4;
  color: #22c55e;
}

.add-rule-btn:hover {
  background: #dcfce7;
  color: #16a34a;
}

.remove-rule-btn {
  background: transparent;
  color: #94a3b8;
}

.remove-rule-btn:hover:not(:disabled) {
  background: #fef2f2;
  color: #ef4444;
}

.remove-rule-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Simple Value Input (for count and minutes-only fields) */
.value-input-simple {
  min-width: 140px;
}

.simple-value-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.25rem 0.625rem;
  height: 34px;
}

.simple-number {
  width: 70px;
}

.simple-number :deep(.p-inputnumber) {
  width: 100%;
}

.simple-number :deep(.p-inputnumber-input) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  padding: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  height: 26px;
  width: 100%;
}

.simple-number :deep(.p-inputnumber-input:focus) {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.value-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

/* Leave Type Selection Group */
.leave-type-select-group {
  min-width: 180px;
  flex: 1;
  max-width: 220px;
}

.leave-type-dropdown :deep(.p-dropdown) {
  min-width: 180px;
}

.leave-type-dropdown :deep(.p-dropdown-clear-icon) {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  margin-top: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1.5rem;
  background: #ffffff;
  border: 2px dashed #e2e8f0;
  border-radius: 10px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.875rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon i {
  font-size: 1.25rem;
  color: #94a3b8;
}

.empty-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.25rem 0;
}

.empty-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .rule-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .rule-content {
    flex-direction: column;
    align-items: stretch;
  }

  .field-group {
    width: 100%;
  }

  .field-select,
  .operator-select,
  .value-input,
  .value-input-wide,
  .value-input-simple,
  .leave-type-select-group {
    min-width: 100%;
    width: 100%;
    max-width: 100%;
  }

  .time-range-group {
    flex-wrap: wrap;
    height: auto;
    padding: 0.5rem;
  }

  .time-range-segment {
    flex-wrap: wrap;
  }

  .rule-actions {
    justify-content: flex-end;
    padding-top: 0.5rem;
    border-top: 1px solid #f1f5f9;
  }

  .group-header {
    padding: 0.375rem 0.5rem;
  }

  .rule-operator-row {
    padding-left: 0.5rem;
  }
}
</style>

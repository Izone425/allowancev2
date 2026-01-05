<template>
  <div v-if="isReadyToShow" class="summary-card">
    <div class="summary-header">
      <i class="pi pi-file-edit"></i>
      <span>Summary</span>
    </div>
    <div class="summary-content">
      <!-- Main description sentence -->
      <p class="summary-main" v-html="mainDescription"></p>

      <!-- Applies on section (Daily only) - combines day types, shifts, locations -->
      <div v-if="formData.type === 'DAILY'" class="summary-applies-on">
        <strong>Applies on:</strong>
        <ul class="applies-on-list">
          <!-- Day types -->
          <li v-if="dayTypesSentence">
            <i class="pi pi-calendar"></i>
            <span>{{ dayTypesSentence }}</span>
          </li>
          <li v-else class="warning-item">
            <i class="pi pi-exclamation-triangle"></i>
            <span>No day types selected - allowance won't apply to any days</span>
          </li>
          <!-- Shifts -->
          <li v-if="shiftsInfo.show && !shiftsInfo.hasWarning">
            <i class="pi pi-clock"></i>
            <span>{{ shiftsInfo.isFiltered ? 'Only for shifts: ' : '' }}{{ shiftsInfo.text }}</span>
          </li>
          <li v-else-if="shiftsInfo.hasWarning" class="warning-item">
            <i class="pi pi-exclamation-triangle"></i>
            <span>No shifts selected</span>
          </li>
          <!-- Work Locations -->
          <li v-if="locationsInfo.show && !locationsInfo.hasWarning">
            <i class="pi pi-map-marker"></i>
            <span>{{ locationsInfo.isFiltered ? 'Only at locations: ' : '' }}{{ locationsInfo.text }}</span>
          </li>
          <li v-else-if="locationsInfo.hasWarning" class="warning-item">
            <i class="pi pi-exclamation-triangle"></i>
            <span>No work locations selected</span>
          </li>
        </ul>
      </div>

      <!-- Conditions (Daily only) -->
      <div v-if="hasConditions" class="summary-conditions">
        <strong>Conditions:</strong>
        <ul>
          <li v-for="(condition, index) in conditionsList" :key="index">
            {{ condition }}
          </li>
        </ul>
      </div>

      <!-- No conditions message (Daily and Monthly) -->
      <p v-else-if="formData.type === 'DAILY' || formData.type === 'MONTHLY'" class="summary-line summary-info">
        <i class="pi pi-info-circle"></i>
        <span>No conditions - applies to all eligible {{ formData.type === 'DAILY' ? 'days' : 'months' }}</span>
      </p>

      <!-- Monthly prorate info -->
      <p v-if="prorateInfo" class="summary-line">
        <strong>Prorate:</strong> {{ prorateInfo }}
      </p>

      <!-- Effective period -->
      <p class="summary-line">
        <strong>Effective:</strong> {{ effectivePeriod }}
      </p>

      <!-- Payroll item (Daily only) -->
      <p v-if="payrollItemLabel" class="summary-line">
        <strong>Payroll Item:</strong> {{ payrollItemLabel }}
      </p>

      <!-- Assignment count -->
      <p v-if="assignmentCount > 0" class="summary-line summary-assignment">
        <i class="pi pi-users"></i>
        <strong>{{ assignmentCount }}</strong> employee(s) will receive this allowance
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TemplateInfoFormData, AttendanceCriteriaRule, AttendanceTimeValue, AttendanceTimeRangeValue, AttendanceLeaveValue } from '../../types';
import { DailyCalculationMode, AttendanceCriteriaField } from '../../types';
import {
  CURRENCY_OPTIONS,
  PAYROLL_ADDITIONAL_ITEM_OPTIONS,
  SHIFT_OPTIONS,
  WORK_LOCATION_OPTIONS,
  ATTENDANCE_CRITERIA_FIELD_OPTIONS,
  ATTENDANCE_CRITERIA_CONDITION_OPTIONS,
  LEAVE_TYPE_OPTIONS
} from '../../constants';

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface Props {
  formData: TemplateInfoFormData;
  assignmentCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  assignmentCount: 0
});

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

function getCurrencySymbol(currency: string): string {
  return CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || currency;
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return '0';
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(time: AttendanceTimeValue): string {
  const hours = time.hours || 0;
  const minutes = time.minutes || 0;
  if (hours === 0 && minutes === 0) return '0';
  if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  if (hours === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  return `${hours}h ${minutes}m`;
}

// Layman-friendly field descriptions
function getLaymanFieldDescription(field: AttendanceCriteriaField): { subject: string; verb: string } {
  const fieldMap: Record<string, { subject: string; verb: string }> = {
    'TOTAL_WORKING_DAYS': { subject: 'Employee', verb: 'attends' },
    'TOTAL_WORKING_HOURS': { subject: 'Employee', verb: 'works for' },
    'TOTAL_ACTUAL_OVERTIME': { subject: 'Employee', verb: 'does overtime of' },
    'TOTAL_APPROVED_OVERTIME': { subject: 'Employee', verb: 'has approved overtime of' },
    'LATE_IN_TIMES': { subject: 'Employee', verb: 'comes late' },
    'LATE_IN_MINUTES': { subject: 'Employee', verb: 'is late by' },
    'EARLY_OUT_TIMES': { subject: 'Employee', verb: 'leaves early' },
    'EARLY_OUT_MINUTES': { subject: 'Employee', verb: 'leaves early by' },
    'ABSENT_TIMES': { subject: 'Employee', verb: 'is absent' },
    'LEAVE_TIMES': { subject: 'Employee', verb: 'takes leave' },
    'WORKING_TIME': { subject: 'Employee', verb: 'works during' },
    'OVERTIME_TIME': { subject: 'Employee', verb: 'does overtime during' },
  };
  return fieldMap[field] || { subject: 'Employee', verb: 'has' };
}

// Layman-friendly condition phrases
function getLaymanCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    'MORE_THAN': 'more than',
    'EQUAL_OR_MORE': 'at least',
    'LESS_THAN': 'less than',
    'EQUAL_OR_LESS': 'at most',
    'EQUAL': 'exactly',
    'BETWEEN': 'between',
  };
  return conditionMap[condition] || condition.toLowerCase().replace(/_/g, ' ');
}

function getLeaveTypeLabel(leaveType: string): string {
  if (!leaveType) return 'any type of leave';
  return LEAVE_TYPE_OPTIONS.find(l => l.value === leaveType)?.label || leaveType;
}

// Type guards
function isTimeRangeValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): value is AttendanceTimeRangeValue {
  return 'startTime' in value && 'endTime' in value;
}

function isLeaveValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): value is AttendanceLeaveValue {
  return 'count' in value && 'leaveType' in value;
}

function isTimeValue(value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue): value is AttendanceTimeValue {
  return 'hours' in value && 'minutes' in value && !('startTime' in value) && !('count' in value);
}

// ---------------------------------------------------------------------------
// COMPUTED - Visibility
// ---------------------------------------------------------------------------

const isReadyToShow = computed(() => {
  // Must have name and type to show summary
  if (!props.formData.name?.trim() || !props.formData.type) return false;

  // Show summary as soon as name and type are set
  // Amount/formula will be shown in description if available
  return true;
});

// ---------------------------------------------------------------------------
// COMPUTED - Main Description
// ---------------------------------------------------------------------------

const mainDescription = computed(() => {
  const name = props.formData.name || 'Untitled';
  const currency = props.formData.currency || 'MYR';

  switch (props.formData.type) {
    case 'DAILY':
      return generateDailyDescription(name, currency);
    case 'MONTHLY':
      return generateMonthlyDescription(name, currency);
    case 'ONE_OFF':
      return generateOneOffDescription(name, currency);
    default:
      return '';
  }
});

function generateDailyDescription(name: string, currency: string): string {
  if (props.formData.dailyCalculationMode === DailyCalculationMode.HOURLY_RATE) {
    const rate = props.formData.hourlyRateConfig?.ratePerHour || 0;
    const cap = props.formData.hourlyRateConfig?.dailyCap;
    const minHours = props.formData.hourlyRateConfig?.minWorkingHours;

    let desc = `"<strong>${name}</strong>" is a <strong>daily</strong> allowance at <strong>${formatAmount(rate, currency)}/hour</strong>`;

    if (cap !== null && cap !== undefined) {
      desc += ` (max <strong>${formatAmount(cap, currency)}</strong>/day)`;
    }
    desc += '.';

    if (minHours && (minHours.hours > 0 || minHours.minutes > 0)) {
      desc += ` Requires minimum <strong>${formatTime(minHours)}</strong> of work.`;
    }

    return desc;
  }

  // Fixed Daily
  const amount = props.formData.amount || 0;
  return `"<strong>${name}</strong>" is a <strong>daily</strong> allowance that pays <strong>${formatAmount(amount, currency)}</strong> per day.`;
}

function generateMonthlyDescription(name: string, currency: string): string {
  if (props.formData.amountMode === 'FORMULA') {
    return `"<strong>${name}</strong>" is a <strong>monthly</strong> allowance calculated by formula: <code>${props.formData.formulaExpression}</code>`;
  }

  const amount = props.formData.amount || 0;
  return `"<strong>${name}</strong>" is a <strong>monthly</strong> allowance of <strong>${formatAmount(amount, currency)}</strong>.`;
}

function generateOneOffDescription(name: string, currency: string): string {
  if (props.formData.amountMode === 'FORMULA') {
    return `"<strong>${name}</strong>" is a <strong>one-time</strong> payment calculated by formula: <code>${props.formData.formulaExpression}</code>`;
  }

  const amount = props.formData.amount || 0;
  let desc = `"<strong>${name}</strong>" is a <strong>one-time</strong> payment of <strong>${formatAmount(amount, currency)}</strong>.`;

  if (props.formData.payoutDate) {
    desc += ` Payout: <strong>${formatDate(props.formData.payoutDate)}</strong>`;
  } else if (props.formData.payoutMonth) {
    desc += ` Payout: <strong>${props.formData.payoutMonth}</strong>`;
  }

  return desc;
}

// ---------------------------------------------------------------------------
// COMPUTED - Day Types (Daily only)
// ---------------------------------------------------------------------------

const dayTypesSentence = computed(() => {
  if (props.formData.type !== 'DAILY') return '';

  const dayTypes: string[] = [];
  if (props.formData.applyOnNormalWorkday) dayTypes.push('Normal Workday');
  if (props.formData.applyOnRestday) dayTypes.push('Rest Day');
  if (props.formData.applyOnOffday) dayTypes.push('Off Day');
  if (props.formData.applyOnHoliday) dayTypes.push('Holiday');

  return dayTypes.join(', ');
});

// ---------------------------------------------------------------------------
// COMPUTED - Shifts & Locations (Daily only)
// ---------------------------------------------------------------------------

const shiftsInfo = computed(() => {
  if (props.formData.type !== 'DAILY') return { show: false, text: '', isFiltered: false, hasWarning: false };

  // Check if shifts are selected (filtering is based on array having items)
  const hasSelectedShifts = props.formData.applyOnShifts && props.formData.applyOnShifts.length > 0;

  if (!hasSelectedShifts) {
    // No shifts selected = applies to all shifts
    return { show: true, text: 'All shifts', isFiltered: false, hasWarning: false };
  }

  // Shifts are selected - show the filtered list
  const shiftLabels = props.formData.applyOnShifts
    .map(s => SHIFT_OPTIONS.find(opt => opt.value === s)?.label || s)
    .join(', ');

  return { show: true, text: shiftLabels, isFiltered: true, hasWarning: false };
});

const locationsInfo = computed(() => {
  if (props.formData.type !== 'DAILY') return { show: false, text: '', isFiltered: false, hasWarning: false };

  // Check if locations are selected (filtering is based on array having items)
  const hasSelectedLocations = props.formData.applyOnWorkLocations && props.formData.applyOnWorkLocations.length > 0;

  if (!hasSelectedLocations) {
    // No locations selected = applies to all locations
    return { show: true, text: 'All work locations', isFiltered: false, hasWarning: false };
  }

  // Locations are selected - show the filtered list
  const locationLabels = props.formData.applyOnWorkLocations
    .map(l => WORK_LOCATION_OPTIONS.find(opt => opt.value === l)?.label || l)
    .join(', ');

  return { show: true, text: locationLabels, isFiltered: true, hasWarning: false };
});

// Keep these for backward compatibility (used in template)
const shiftsSentence = computed(() => shiftsInfo.value.text);
const locationsSentence = computed(() => locationsInfo.value.text);

// ---------------------------------------------------------------------------
// COMPUTED - Conditions (Daily and Monthly)
// ---------------------------------------------------------------------------

const hasConditions = computed(() => {
  if (props.formData.type !== 'DAILY' && props.formData.type !== 'MONTHLY') return false;
  const criteria = props.formData.attendanceCriteria;
  if (!criteria?.groups?.length) return false;
  return criteria.groups.some(g => g.rules?.length > 0);
});

const conditionsList = computed(() => {
  if (!hasConditions.value) return [];

  const criteria = props.formData.attendanceCriteria;
  const sentences: string[] = [];

  criteria.groups.forEach((group, groupIndex) => {
    group.rules.forEach((rule, ruleIndex) => {
      const sentence = formatRuleToSentence(rule);

      // Add operator prefix for subsequent rules/groups
      if (groupIndex === 0 && ruleIndex === 0) {
        sentences.push(sentence);
      } else if (ruleIndex === 0) {
        // First rule of subsequent group - use group operator from criteria
        const groupOp = criteria.groupOperator || 'AND';
        sentences.push(`${groupOp} ${sentence}`);
      } else {
        // Subsequent rule within same group - use group's internal operator
        const ruleOp = group.operator || 'AND';
        sentences.push(`${ruleOp} ${sentence}`);
      }
    });
  });

  return sentences;
});

function formatRuleToSentence(rule: AttendanceCriteriaRule): string {
  const { subject, verb } = getLaymanFieldDescription(rule.field);
  const condition = getLaymanCondition(rule.condition);

  // Handle Total Working Days field (shows days count)
  if (rule.field === AttendanceCriteriaField.TOTAL_WORKING_DAYS) {
    if (isTimeValue(rule.value)) {
      const days = rule.value.hours; // days stored in hours field
      const dayWord = days === 1 ? 'day' : 'days';
      return `${subject} ${verb} ${condition} ${days} ${dayWord}`;
    }
  }

  // Handle time range fields (Working Time, Overtime Time)
  if (rule.field === AttendanceCriteriaField.WORKING_TIME || rule.field === AttendanceCriteriaField.OVERTIME_TIME) {
    if (isTimeRangeValue(rule.value)) {
      const start = `${String(rule.value.startTime.hours).padStart(2, '0')}:${String(rule.value.startTime.minutes).padStart(2, '0')}`;
      const end = `${String(rule.value.endTime.hours).padStart(2, '0')}:${String(rule.value.endTime.minutes).padStart(2, '0')}`;
      return `${subject} ${verb} ${start} to ${end}`;
    }
  }

  // Handle Leave Times
  if (rule.field === AttendanceCriteriaField.LEAVE_TIMES) {
    if (isLeaveValue(rule.value)) {
      const leaveType = getLeaveTypeLabel(rule.value.leaveType);
      const count = rule.value.count;
      if (count === 0) {
        return `${subject} does not take ${leaveType}`;
      }
      const timesWord = count === 1 ? 'time' : 'times';
      return `${subject} takes ${leaveType} ${condition} ${count} ${timesWord}`;
    }
  }

  // Handle Count fields (Late In Times, Early Out Times, Absent Times)
  if (rule.field.toString().endsWith('_TIMES') || rule.field === AttendanceCriteriaField.ABSENT_TIMES) {
    if (isTimeValue(rule.value)) {
      const count = rule.value.hours;
      if (count === 0) {
        // Special case for "exactly 0 times"
        if (rule.field === AttendanceCriteriaField.LATE_IN_TIMES) {
          return `${subject} is not late`;
        }
        if (rule.field === AttendanceCriteriaField.EARLY_OUT_TIMES) {
          return `${subject} does not leave early`;
        }
        if (rule.field === AttendanceCriteriaField.ABSENT_TIMES) {
          return `${subject} is not absent`;
        }
      }
      const timesWord = count === 1 ? 'time' : 'times';
      return `${subject} ${verb} ${condition} ${count} ${timesWord}`;
    }
  }

  // Handle Minutes fields (Late In Minutes, Early Out Minutes)
  if (rule.field.toString().endsWith('_MINUTES')) {
    if (isTimeValue(rule.value)) {
      const minutes = rule.value.minutes;
      const minuteWord = minutes === 1 ? 'minute' : 'minutes';
      return `${subject} ${verb} ${condition} ${minutes} ${minuteWord}`;
    }
  }

  // Handle Hours fields (Working Hours, Overtime)
  if (isTimeValue(rule.value)) {
    const timeStr = formatTime(rule.value);
    return `${subject} ${verb} ${condition} ${timeStr}`;
  }

  return `${subject} ${verb}`;
}

// ---------------------------------------------------------------------------
// COMPUTED - Prorate Info (Monthly only)
// ---------------------------------------------------------------------------

const prorateInfo = computed(() => {
  if (props.formData.type !== 'MONTHLY') return '';

  const parts: string[] = [];
  if (props.formData.prorateByJoinDate) parts.push('new joiners');
  if (props.formData.prorateByLeaveDate) parts.push('resignations');

  if (parts.length === 0) return 'Not prorated';
  return `Prorated for ${parts.join(' and ')}`;
});

// ---------------------------------------------------------------------------
// COMPUTED - Effective Period
// ---------------------------------------------------------------------------

const effectivePeriod = computed(() => {
  const start = props.formData.effectiveStart ? formatDate(props.formData.effectiveStart) : 'Not set';
  const end = props.formData.effectiveEnd ? formatDate(props.formData.effectiveEnd) : 'No end date (ongoing)';
  return `${start} → ${end}`;
});

// ---------------------------------------------------------------------------
// COMPUTED - Payroll Item (Daily only)
// ---------------------------------------------------------------------------

const payrollItemLabel = computed(() => {
  if (props.formData.type !== 'DAILY') return '';
  if (!props.formData.payrollAdditionalItem) return '';

  return PAYROLL_ADDITIONAL_ITEM_OPTIONS.find(
    p => p.value === props.formData.payrollAdditionalItem
  )?.label || props.formData.payrollAdditionalItem;
});
</script>

<style scoped>
.summary-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #0369a1;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #bae6fd;
}

.summary-header i {
  font-size: 1rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.summary-main {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #1e293b;
  margin: 0;
}

.summary-main :deep(strong) {
  color: #0c4a6e;
}

.summary-main :deep(code) {
  background: #e0f2fe;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8125rem;
}

.summary-line {
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.summary-line strong {
  color: #334155;
}

/* Applies on section */
.summary-applies-on {
  font-size: 0.875rem;
  color: #475569;
}

.summary-applies-on > strong {
  color: #334155;
  display: block;
  margin-bottom: 0.375rem;
}

.applies-on-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.applies-on-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  line-height: 1.4;
}

.applies-on-list li i {
  font-size: 0.875rem;
  color: #0369a1;
  flex-shrink: 0;
}

.applies-on-list li.warning-item {
  background: #fef3c7;
  color: #b45309;
}

.applies-on-list li.warning-item i {
  color: #d97706;
}

.summary-conditions {
  font-size: 0.875rem;
  color: #475569;
}

.summary-conditions strong {
  color: #334155;
  display: block;
  margin-bottom: 0.375rem;
}

.summary-conditions ul {
  margin: 0;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.summary-conditions li {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.summary-warning {
  color: #b45309;
  background: #fef3c7;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #fcd34d;
}

.summary-warning i {
  color: #d97706;
}

.summary-info {
  color: #0369a1;
  font-style: italic;
}

.summary-info i {
  color: #0ea5e9;
}

.summary-assignment {
  background: #dbeafe;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  border: 1px solid #93c5fd;
}

.summary-assignment i {
  color: #2563eb;
  font-size: 0.875rem;
}

.summary-assignment strong {
  color: #1d4ed8;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-card {
    padding: 1rem;
    margin-top: 1rem;
  }

  .summary-main {
    font-size: 0.875rem;
  }

  .summary-line,
  .summary-conditions {
    font-size: 0.8125rem;
  }
}
</style>

// ============================================================================
// USE CRITERIA BUILDER COMPOSABLE
// Manages criteria groups, rules, and preview functionality
// ============================================================================

import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { v4 as uuidv4 } from 'uuid';
import { allowanceTemplateService } from '../services/allowanceTemplateService';
import {
  CRITERIA_FIELD_OPTIONS,
  CRITERIA_OPERATOR_LABELS
} from '../constants';
import type {
  CriteriaSet,
  CriteriaGroup,
  CriteriaRule,
  CriteriaField,
  CriteriaOperator,
  CriteriaGroupOperator,
  CriteriaValue,
  CriteriaPreviewResponse,
  LookupData,
  User
} from '../types';

// Default empty criteria set
function createEmptyCriteriaSet(): CriteriaSet {
  return {
    groupOperator: 'AND' as CriteriaGroupOperator,
    groups: []
  };
}

// Create a new empty group
function createEmptyGroup(): CriteriaGroup {
  return {
    id: uuidv4(),
    operator: 'AND' as CriteriaGroupOperator,
    rules: []
  };
}

// Create a new empty rule
function createEmptyRule(field?: CriteriaField): CriteriaRule {
  const fieldConfig = field
    ? CRITERIA_FIELD_OPTIONS.find((f) => f.value === field)
    : CRITERIA_FIELD_OPTIONS[0];

  return {
    id: uuidv4(),
    field: fieldConfig?.value || ('DEPARTMENT' as CriteriaField),
    operator: fieldConfig?.operators[0] || ('IN' as CriteriaOperator),
    value: getDefaultValueForField(fieldConfig?.valueType || 'multiselect')
  };
}

// Get default value based on field type
function getDefaultValueForField(valueType: string): CriteriaValue {
  switch (valueType) {
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

export function useCriteriaBuilder(templateId?: string | null) {
  const toast = useToast();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const criteria = ref<CriteriaSet>(createEmptyCriteriaSet());
  const lookupData = ref<LookupData | null>(null);
  const loadingLookups = ref(false);

  // Preview state
  const previewLoading = ref(false);
  const previewResult = ref<CriteriaPreviewResponse | null>(null);
  const previewError = ref<string | null>(null);

  // Validation
  const validationErrors = ref<Map<string, string>>(new Map());

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  const hasGroups = computed(() => criteria.value.groups.length > 0);

  const hasRules = computed(() =>
    criteria.value.groups.some((g) => g.rules.length > 0)
  );

  const totalRuleCount = computed(() =>
    criteria.value.groups.reduce((sum, g) => sum + g.rules.length, 0)
  );

  const isValid = computed(() => {
    if (!hasRules.value) return true; // Empty criteria is valid (means no restrictions)
    return validationErrors.value.size === 0;
  });

  const criteriaDescription = computed(() => {
    if (!hasRules.value) return 'No criteria defined - all users are eligible';

    const groupDescriptions = criteria.value.groups.map((group, gIndex) => {
      const ruleDescriptions = group.rules.map((rule) => {
        const fieldConfig = CRITERIA_FIELD_OPTIONS.find(
          (f) => f.value === rule.field
        );
        const operatorLabel = CRITERIA_OPERATOR_LABELS[rule.operator];
        const valueStr = formatRuleValue(rule.value);
        return `${fieldConfig?.label || rule.field} ${operatorLabel} ${valueStr}`;
      });

      const joinedRules = ruleDescriptions.join(` ${group.operator} `);
      return criteria.value.groups.length > 1
        ? `(${joinedRules})`
        : joinedRules;
    });

    return groupDescriptions.join(` ${criteria.value.groupOperator} `);
  });

  // ---------------------------------------------------------------------------
  // METHODS - Group Management
  // ---------------------------------------------------------------------------

  function addGroup(): void {
    const newGroup = createEmptyGroup();
    // Auto-add one rule to new group
    newGroup.rules.push(createEmptyRule());
    criteria.value.groups.push(newGroup);
  }

  function removeGroup(groupId: string): void {
    const index = criteria.value.groups.findIndex((g) => g.id === groupId);
    if (index > -1) {
      criteria.value.groups.splice(index, 1);
      clearPreview();
    }
  }

  function setGroupOperator(
    groupId: string,
    operator: CriteriaGroupOperator
  ): void {
    const group = criteria.value.groups.find((g) => g.id === groupId);
    if (group) {
      group.operator = operator;
    }
  }

  function setGlobalOperator(operator: CriteriaGroupOperator): void {
    criteria.value.groupOperator = operator;
  }

  // ---------------------------------------------------------------------------
  // METHODS - Rule Management
  // ---------------------------------------------------------------------------

  function addRule(groupId: string): void {
    const group = criteria.value.groups.find((g) => g.id === groupId);
    if (group) {
      group.rules.push(createEmptyRule());
    }
  }

  function removeRule(groupId: string, ruleId: string): void {
    const group = criteria.value.groups.find((g) => g.id === groupId);
    if (group) {
      const ruleIndex = group.rules.findIndex((r) => r.id === ruleId);
      if (ruleIndex > -1) {
        group.rules.splice(ruleIndex, 1);
        validationErrors.value.delete(ruleId);
        clearPreview();
      }
    }
  }

  function updateRule(
    groupId: string,
    ruleId: string,
    updates: Partial<CriteriaRule>
  ): void {
    const group = criteria.value.groups.find((g) => g.id === groupId);
    if (group) {
      const rule = group.rules.find((r) => r.id === ruleId);
      if (rule) {
        // If field changed, reset operator and value
        if (updates.field && updates.field !== rule.field) {
          const fieldConfig = CRITERIA_FIELD_OPTIONS.find(
            (f) => f.value === updates.field
          );
          rule.field = updates.field;
          rule.operator = fieldConfig?.operators[0] || rule.operator;
          rule.value = getDefaultValueForField(fieldConfig?.valueType || 'multiselect');
        } else {
          Object.assign(rule, updates);
        }
        validateRule(rule);
        clearPreview();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // METHODS - Validation
  // ---------------------------------------------------------------------------

  function validateRule(rule: CriteriaRule): boolean {
    const fieldConfig = CRITERIA_FIELD_OPTIONS.find(
      (f) => f.value === rule.field
    );

    let isValid = true;
    let errorMessage = '';

    // Check if value is provided
    if (fieldConfig?.valueType === 'multiselect') {
      if (!Array.isArray(rule.value) || rule.value.length === 0) {
        isValid = false;
        errorMessage = 'Please select at least one value';
      }
    } else if (fieldConfig?.valueType === 'number') {
      if (
        rule.operator === 'BETWEEN' &&
        typeof rule.value === 'object' &&
        'min' in rule.value
      ) {
        const range = rule.value as { min: number; max: number };
        if (range.min >= range.max) {
          isValid = false;
          errorMessage = 'Min value must be less than max value';
        }
      } else if (typeof rule.value !== 'number' || isNaN(rule.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid number';
      }
    } else if (fieldConfig?.valueType === 'tags') {
      if (!Array.isArray(rule.value) || rule.value.length === 0) {
        isValid = false;
        errorMessage = 'Please enter at least one tag';
      }
    }

    if (isValid) {
      validationErrors.value.delete(rule.id);
    } else {
      validationErrors.value.set(rule.id, errorMessage);
    }

    return isValid;
  }

  function validateAll(): boolean {
    validationErrors.value.clear();

    if (!hasRules.value) return true;

    let allValid = true;
    for (const group of criteria.value.groups) {
      for (const rule of group.rules) {
        if (!validateRule(rule)) {
          allValid = false;
        }
      }
    }

    return allValid;
  }

  function getValidationError(ruleId: string): string | undefined {
    return validationErrors.value.get(ruleId);
  }

  // ---------------------------------------------------------------------------
  // METHODS - Preview
  // ---------------------------------------------------------------------------

  async function previewEligibleUsers(): Promise<void> {
    if (!validateAll()) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fix the errors in your criteria before previewing',
        life: 3000
      });
      return;
    }

    previewLoading.value = true;
    previewError.value = null;

    try {
      const response = await allowanceTemplateService.previewCriteria(
        templateId || null,
        { criteria: criteria.value }
      );
      previewResult.value = response;
    } catch (e) {
      previewError.value = (e as Error).message || 'Failed to preview criteria';
      toast.add({
        severity: 'error',
        summary: 'Preview Error',
        detail: previewError.value,
        life: 5000
      });
    } finally {
      previewLoading.value = false;
    }
  }

  function clearPreview(): void {
    previewResult.value = null;
    previewError.value = null;
  }

  // ---------------------------------------------------------------------------
  // METHODS - Lookups
  // ---------------------------------------------------------------------------

  async function fetchLookupData(): Promise<void> {
    if (lookupData.value) return; // Already loaded

    loadingLookups.value = true;
    try {
      lookupData.value = await allowanceTemplateService.getLookupData();
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load lookup data',
        life: 5000
      });
    } finally {
      loadingLookups.value = false;
    }
  }

  function getLookupOptions(lookupKey: string | null): Array<{ id: string; name: string }> {
    if (!lookupKey || !lookupData.value) return [];
    return (lookupData.value as Record<string, Array<{ id: string; name: string }>>)[lookupKey] || [];
  }

  // ---------------------------------------------------------------------------
  // METHODS - Import/Export
  // ---------------------------------------------------------------------------

  function setCriteria(newCriteria: CriteriaSet | null): void {
    criteria.value = newCriteria ? { ...newCriteria } : createEmptyCriteriaSet();
    validationErrors.value.clear();
    clearPreview();
  }

  function getCriteria(): CriteriaSet {
    return { ...criteria.value };
  }

  function clearCriteria(): void {
    criteria.value = createEmptyCriteriaSet();
    validationErrors.value.clear();
    clearPreview();
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  function formatRuleValue(value: CriteriaValue): string {
    if (Array.isArray(value)) {
      if (value.length === 0) return '(none)';
      if (value.length <= 3) return value.join(', ');
      return `${value.slice(0, 3).join(', ')} +${value.length - 3} more`;
    }
    if (typeof value === 'object' && 'min' in value) {
      return `${value.min} - ${value.max}`;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }

  function getFieldConfig(field: CriteriaField) {
    return CRITERIA_FIELD_OPTIONS.find((f) => f.value === field);
  }

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  // Auto-fetch lookups when composable is used
  fetchLookupData();

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    criteria,
    lookupData,
    loadingLookups,
    previewLoading,
    previewResult,
    previewError,
    validationErrors,

    // Computed
    hasGroups,
    hasRules,
    totalRuleCount,
    isValid,
    criteriaDescription,

    // Group methods
    addGroup,
    removeGroup,
    setGroupOperator,
    setGlobalOperator,

    // Rule methods
    addRule,
    removeRule,
    updateRule,

    // Validation
    validateRule,
    validateAll,
    getValidationError,

    // Preview
    previewEligibleUsers,
    clearPreview,

    // Lookups
    fetchLookupData,
    getLookupOptions,

    // Import/Export
    setCriteria,
    getCriteria,
    clearCriteria,

    // Helpers
    formatRuleValue,
    getFieldConfig
  };
}

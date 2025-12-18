// ============================================================================
// USE FORM VALIDATION COMPOSABLE
// Provides validation utilities for allowance template forms
// ============================================================================

import { ref, computed, watch } from 'vue';
import { allowanceTemplateService } from '../services/allowanceTemplateService';
import { AllowanceType, AllowanceAmountMode, AllowanceStatus, CriteriaGroupOperator } from '../types';
import type { TemplateInfoFormData, ValidationError, ValidationResult, AttendanceCriteriaSet } from '../types';
import { VALIDATION_MESSAGES } from '../constants';

// Default attendance criteria
function createDefaultAttendanceCriteria(): AttendanceCriteriaSet {
  return {
    groupOperator: CriteriaGroupOperator.AND,
    groups: []
  };
}

// Default form state
function createDefaultFormData(): TemplateInfoFormData {
  return {
    name: '',
    code: '',
    description: '',
    type: null,
    amountMode: AllowanceAmountMode.FIXED,
    amount: null,
    formulaExpression: '',
    formulaVariables: [],
    currency: 'MYR',
    taxable: true,
    prorate: false,
    ratePerDay: null,
    includeNonWorkingDays: false,
    applyOnNormalWorkday: true,
    applyOnRestday: false,
    applyOnOffday: false,
    applyOnHoliday: false,
    filterByShift: false,
    applyOnShifts: [],
    filterByWorkLocation: false,
    applyOnWorkLocations: [],
    prorateByJoinDate: true,
    prorateByLeaveDate: false,
    payoutDate: null,
    payoutMonth: '',
    effectiveStart: null,
    effectiveEnd: null,
    status: AllowanceStatus.ACTIVE,
    attendanceCriteria: createDefaultAttendanceCriteria()
  };
}

export function useFormValidation(editingId?: string | null) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const formData = ref<TemplateInfoFormData>(createDefaultFormData());
  const errors = ref<Map<string, string>>(new Map());
  const touched = ref<Set<string>>(new Set());
  const isDirty = ref(false);
  const isResetting = ref(false);

  // Async validation state
  const codeCheckLoading = ref(false);
  const codeCheckResult = ref<boolean | null>(null);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  const isValid = computed(() => {
    // Must validate first
    const result = validateAll();
    return result.isValid;
  });

  const hasErrors = computed(() => errors.value.size > 0);

  const errorList = computed(() => Array.from(errors.value.entries()));

  // Type-specific field visibility
  const showDailyFields = computed(
    () => formData.value.type === AllowanceType.DAILY
  );
  const showMonthlyFields = computed(
    () => formData.value.type === AllowanceType.MONTHLY
  );
  const showOneOffFields = computed(
    () => formData.value.type === AllowanceType.ONE_OFF
  );
  const showFormulaFields = computed(
    () => formData.value.amountMode === AllowanceAmountMode.FORMULA
  );

  // ---------------------------------------------------------------------------
  // VALIDATION RULES
  // ---------------------------------------------------------------------------

  function validateField(field: keyof TemplateInfoFormData): string | null {
    const value = formData.value[field];

    switch (field) {
      case 'name':
        if (!value || (value as string).trim() === '') {
          return VALIDATION_MESSAGES.required('Name');
        }
        if ((value as string).length < 3) {
          return VALIDATION_MESSAGES.minLength('Name', 3);
        }
        if ((value as string).length > 100) {
          return VALIDATION_MESSAGES.maxLength('Name', 100);
        }
        break;

      case 'code':
        if (!value || (value as string).trim() === '') {
          return VALIDATION_MESSAGES.required('Code');
        }
        if (!/^[A-Z0-9\-_]+$/i.test(value as string)) {
          return 'Code can only contain letters, numbers, hyphens, and underscores';
        }
        if ((value as string).length < 2) {
          return VALIDATION_MESSAGES.minLength('Code', 2);
        }
        if ((value as string).length > 50) {
          return VALIDATION_MESSAGES.maxLength('Code', 50);
        }
        // Note: Async uniqueness check done separately
        break;

      case 'type':
        if (!value) {
          return VALIDATION_MESSAGES.required('Allowance type');
        }
        break;

      case 'amount':
        if (formData.value.amountMode === AllowanceAmountMode.FIXED) {
          if (value === null || value === undefined) {
            return VALIDATION_MESSAGES.required('Amount');
          }
          if ((value as number) <= 0) {
            return VALIDATION_MESSAGES.minValue('Amount', 0);
          }
        }
        break;

      case 'formulaExpression':
        if (formData.value.amountMode === AllowanceAmountMode.FORMULA) {
          if (!value || (value as string).trim() === '') {
            return VALIDATION_MESSAGES.required('Formula expression');
          }
        }
        break;

      case 'ratePerDay':
        if (formData.value.type === AllowanceType.DAILY) {
          if (formData.value.amountMode === AllowanceAmountMode.FIXED) {
            // Either amount or ratePerDay should be filled
            if (
              (value === null || value === undefined) &&
              (formData.value.amount === null || formData.value.amount === undefined)
            ) {
              return 'Either Amount or Rate per Day is required for Daily allowance';
            }
          }
        }
        break;

      case 'payoutDate':
        if (formData.value.type === AllowanceType.ONE_OFF) {
          if (!value && !formData.value.payoutMonth) {
            return 'Either Payout Date or Payout Month is required for One-off allowance';
          }
        }
        break;

      case 'payoutMonth':
        if (formData.value.type === AllowanceType.ONE_OFF) {
          if (!value && !formData.value.payoutDate) {
            return 'Either Payout Date or Payout Month is required for One-off allowance';
          }
          if (value && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value as string)) {
            return 'Payout Month must be in YYYY-MM format';
          }
        }
        break;

      case 'effectiveStart':
        if (!value) {
          return VALIDATION_MESSAGES.required('Effective start date');
        }
        break;

      case 'effectiveEnd':
        if (value && formData.value.effectiveStart) {
          const startDate = new Date(formData.value.effectiveStart);
          const endDate = new Date(value as Date);
          if (endDate <= startDate) {
            return VALIDATION_MESSAGES.dateAfter('Effective end date', 'start date');
          }
        }
        break;
    }

    return null;
  }

  function validateAll(): ValidationResult {
    errors.value.clear();
    const validationErrors: ValidationError[] = [];

    // Required fields
    const requiredFields: (keyof TemplateInfoFormData)[] = [
      'name',
      'code',
      'type',
      'effectiveStart'
    ];

    // Add type-specific required fields
    if (formData.value.amountMode === AllowanceAmountMode.FIXED) {
      requiredFields.push('amount');
    } else {
      requiredFields.push('formulaExpression');
    }

    // Validate all required fields
    for (const field of requiredFields) {
      const error = validateField(field);
      if (error) {
        errors.value.set(field, error);
        validationErrors.push({ field, message: error });
      }
    }

    // Type-specific validation
    if (formData.value.type === AllowanceType.ONE_OFF) {
      const payoutError = validateField('payoutDate');
      if (payoutError) {
        errors.value.set('payoutDate', payoutError);
        validationErrors.push({ field: 'payoutDate', message: payoutError });
      }
    }

    // Date range validation
    const endDateError = validateField('effectiveEnd');
    if (endDateError) {
      errors.value.set('effectiveEnd', endDateError);
      validationErrors.push({ field: 'effectiveEnd', message: endDateError });
    }

    // Code uniqueness (only if basic validation passed)
    if (codeCheckResult.value === false) {
      const codeError = VALIDATION_MESSAGES.unique('Code');
      errors.value.set('code', codeError);
      validationErrors.push({ field: 'code', message: codeError });
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }

  // ---------------------------------------------------------------------------
  // ASYNC VALIDATION
  // ---------------------------------------------------------------------------

  let codeCheckTimeout: ReturnType<typeof setTimeout>;

  async function checkCodeUniqueness(code: string): Promise<void> {
    if (!code || code.length < 2) {
      codeCheckResult.value = null;
      return;
    }

    clearTimeout(codeCheckTimeout);
    codeCheckTimeout = setTimeout(async () => {
      codeCheckLoading.value = true;
      try {
        const result = await allowanceTemplateService.checkCodeUnique(
          code,
          editingId || undefined
        );
        codeCheckResult.value = result.isUnique;
        if (!result.isUnique) {
          errors.value.set('code', VALIDATION_MESSAGES.unique('Code'));
        } else {
          errors.value.delete('code');
        }
      } catch {
        // On error, assume valid to not block user
        codeCheckResult.value = true;
      } finally {
        codeCheckLoading.value = false;
      }
    }, 500);
  }

  // ---------------------------------------------------------------------------
  // FIELD HELPERS
  // ---------------------------------------------------------------------------

  function getError(field: string): string | undefined {
    return touched.value.has(field) ? errors.value.get(field) : undefined;
  }

  function setTouched(field: string): void {
    touched.value.add(field);
    const error = validateField(field as keyof TemplateInfoFormData);
    if (error) {
      errors.value.set(field, error);
    } else {
      errors.value.delete(field);
    }
  }

  function clearError(field: string): void {
    errors.value.delete(field);
  }

  function touchAll(): void {
    const fields: (keyof TemplateInfoFormData)[] = [
      'name',
      'code',
      'type',
      'amount',
      'effectiveStart',
      'effectiveEnd'
    ];
    fields.forEach((f) => touched.value.add(f));
  }

  // ---------------------------------------------------------------------------
  // FORM DATA HELPERS
  // ---------------------------------------------------------------------------

  function setFormData(data: Partial<TemplateInfoFormData>): void {
    formData.value = {
      ...createDefaultFormData(),
      ...data
    };
    isDirty.value = false;
    errors.value.clear();
    touched.value.clear();
    codeCheckResult.value = null;
  }

  function updateField<K extends keyof TemplateInfoFormData>(
    field: K,
    value: TemplateInfoFormData[K]
  ): void {
    formData.value[field] = value;
    isDirty.value = true;
    setTouched(field);

    // Trigger code uniqueness check
    if (field === 'code') {
      checkCodeUniqueness(value as string);
    }
  }

  function resetForm(): void {
    isResetting.value = true;
    formData.value = createDefaultFormData();
    errors.value.clear();
    touched.value.clear();
    isDirty.value = false;
    codeCheckResult.value = null;
    // Use nextTick-like timing to reset the flag after Vue processes the changes
    setTimeout(() => {
      isResetting.value = false;
    }, 0);
  }

  function getFormData(): TemplateInfoFormData {
    return { ...formData.value };
  }

  // ---------------------------------------------------------------------------
  // STEP VALIDATION (for wizard)
  // ---------------------------------------------------------------------------

  function validateStep(stepIndex: number): ValidationResult {
    const stepErrors: ValidationError[] = [];

    switch (stepIndex) {
      case 0: // Template Info
        const infoFields: (keyof TemplateInfoFormData)[] = [
          'name',
          'code',
          'type',
          'amount',
          'effectiveStart',
          'effectiveEnd'
        ];
        for (const field of infoFields) {
          const error = validateField(field);
          if (error) {
            stepErrors.push({ field, message: error });
          }
        }
        // Check code uniqueness
        if (codeCheckResult.value === false) {
          stepErrors.push({ field: 'code', message: VALIDATION_MESSAGES.unique('Code') });
        }
        break;

      case 1: // Criteria (validated in useCriteriaBuilder)
        // Criteria validation is optional - empty criteria means "all users"
        break;

      case 2: // Assignments (validated in useAssignments)
        // Assignment validation happens on action
        break;

      case 3: // Review
        // Full validation
        return validateAll();
    }

    return {
      isValid: stepErrors.length === 0,
      errors: stepErrors
    };
  }

  // ---------------------------------------------------------------------------
  // WATCHERS
  // ---------------------------------------------------------------------------

  // Mark dirty on any change (unless we're resetting)
  watch(formData, () => {
    if (!isResetting.value) {
      isDirty.value = true;
    }
  }, { deep: true });

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    formData,
    errors,
    touched,
    isDirty,
    codeCheckLoading,
    codeCheckResult,

    // Computed
    isValid,
    hasErrors,
    errorList,
    showDailyFields,
    showMonthlyFields,
    showOneOffFields,
    showFormulaFields,

    // Validation methods
    validateField,
    validateAll,
    validateStep,
    checkCodeUniqueness,

    // Field helpers
    getError,
    setTouched,
    clearError,
    touchAll,

    // Form data helpers
    setFormData,
    updateField,
    resetForm,
    getFormData
  };
}

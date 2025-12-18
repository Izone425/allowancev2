// ============================================================================
// ALLOWANCE MODULE - CONSTANTS
// ============================================================================

import {
  AllowanceType,
  AllowanceAmountMode,
  AllowanceStatus,
  CriteriaField,
  CriteriaOperator,
  CriteriaGroupOperator,
  AttendanceCriteriaField,
  AttendanceCriteriaCondition
} from '../types';

// -----------------------------------------------------------------------------
// ALLOWANCE TYPE OPTIONS
// -----------------------------------------------------------------------------

export const ALLOWANCE_TYPE_OPTIONS = [
  {
    value: AllowanceType.DAILY,
    label: 'Daily',
    description: 'Allowance calculated and paid on a daily basis',
    icon: 'pi pi-calendar',
    color: '#22C55E' // green
  },
  {
    value: AllowanceType.MONTHLY,
    label: 'Monthly',
    description: 'Allowance paid monthly, can be prorated',
    icon: 'pi pi-calendar-plus',
    color: '#3B82F6' // blue
  },
  {
    value: AllowanceType.ONE_OFF,
    label: 'One-off',
    description: 'Single payment allowance',
    icon: 'pi pi-dollar',
    color: '#F59E0B' // amber
  }
] as const;

// -----------------------------------------------------------------------------
// AMOUNT MODE OPTIONS
// -----------------------------------------------------------------------------

export const AMOUNT_MODE_OPTIONS = [
  {
    value: AllowanceAmountMode.FIXED,
    label: 'Fixed Amount',
    description: 'A fixed amount for all eligible users'
  },
  {
    value: AllowanceAmountMode.FORMULA,
    label: 'Formula',
    description: 'Calculate amount using a formula expression'
  }
] as const;

// -----------------------------------------------------------------------------
// STATUS OPTIONS
// -----------------------------------------------------------------------------

export const STATUS_OPTIONS = [
  {
    value: AllowanceStatus.ACTIVE,
    label: 'Active',
    severity: 'success',
    icon: 'pi pi-check-circle'
  },
  {
    value: AllowanceStatus.ARCHIVED,
    label: 'Archived',
    severity: 'warning',
    icon: 'pi pi-inbox'
  }
] as const;

// -----------------------------------------------------------------------------
// SHIFT OPTIONS (for Daily Allowance)
// -----------------------------------------------------------------------------

export const SHIFT_OPTIONS = [
  { value: 'MORNING', label: 'Morning Shift' },
  { value: 'AFTERNOON', label: 'Afternoon Shift' },
  { value: 'EVENING', label: 'Evening Shift' },
  { value: 'NIGHT', label: 'Night Shift' },
  { value: 'SPLIT', label: 'Split Shift' },
  { value: 'FLEXI', label: 'Flexi Shift' }
] as const;

// -----------------------------------------------------------------------------
// WORK LOCATION OPTIONS (for Daily Allowance)
// -----------------------------------------------------------------------------

export const WORK_LOCATION_OPTIONS = [
  { value: 'OFFICE', label: 'Office' },
  { value: 'REMOTE', label: 'Remote / Work From Home' },
  { value: 'SITE', label: 'Site / Field Work' },
  { value: 'BRANCH', label: 'Branch Office' },
  { value: 'CLIENT', label: 'Client Location' }
] as const;

// -----------------------------------------------------------------------------
// CRITERIA FIELD DEFINITIONS
// -----------------------------------------------------------------------------

export const CRITERIA_FIELD_OPTIONS = [
  {
    value: CriteriaField.DEPARTMENT,
    label: 'Department',
    valueType: 'multiselect',
    lookupKey: 'departments',
    operators: [CriteriaOperator.IN, CriteriaOperator.NOT_IN]
  },
  {
    value: CriteriaField.BRANCH,
    label: 'Branch',
    valueType: 'multiselect',
    lookupKey: 'branches',
    operators: [CriteriaOperator.IN, CriteriaOperator.NOT_IN]
  },
  {
    value: CriteriaField.JOB_GRADE,
    label: 'Job Grade',
    valueType: 'multiselect',
    lookupKey: 'jobGrades',
    operators: [
      CriteriaOperator.IN,
      CriteriaOperator.NOT_IN,
      CriteriaOperator.GREATER_THAN_OR_EQUALS,
      CriteriaOperator.LESS_THAN_OR_EQUALS,
      CriteriaOperator.BETWEEN
    ]
  },
  {
    value: CriteriaField.EMPLOYMENT_TYPE,
    label: 'Employment Type',
    valueType: 'multiselect',
    lookupKey: 'employmentTypes',
    operators: [CriteriaOperator.IN, CriteriaOperator.NOT_IN]
  },
  {
    value: CriteriaField.TENURE_MONTHS,
    label: 'Tenure (Months)',
    valueType: 'number',
    lookupKey: null,
    operators: [
      CriteriaOperator.GREATER_THAN_OR_EQUALS,
      CriteriaOperator.LESS_THAN_OR_EQUALS,
      CriteriaOperator.EQUALS,
      CriteriaOperator.BETWEEN
    ]
  },
  {
    value: CriteriaField.CONFIRMATION_STATUS,
    label: 'Confirmation Status',
    valueType: 'boolean',
    lookupKey: null,
    operators: [CriteriaOperator.IS_TRUE, CriteriaOperator.IS_FALSE]
  },
  {
    value: CriteriaField.CUSTOM_TAGS,
    label: 'Custom Tags',
    valueType: 'tags',
    lookupKey: null,
    operators: [CriteriaOperator.CONTAINS_ANY]
  },
  {
    value: CriteriaField.POSITION,
    label: 'Position',
    valueType: 'multiselect',
    lookupKey: 'positions',
    operators: [CriteriaOperator.IN, CriteriaOperator.NOT_IN]
  },
  {
    value: CriteriaField.COST_CENTER,
    label: 'Cost Center',
    valueType: 'multiselect',
    lookupKey: 'costCenters',
    operators: [CriteriaOperator.IN, CriteriaOperator.NOT_IN]
  }
] as const;

// -----------------------------------------------------------------------------
// CRITERIA OPERATOR LABELS
// -----------------------------------------------------------------------------

export const CRITERIA_OPERATOR_LABELS: Record<CriteriaOperator, string> = {
  [CriteriaOperator.IN]: 'is any of',
  [CriteriaOperator.NOT_IN]: 'is not any of',
  [CriteriaOperator.EQUALS]: 'equals',
  [CriteriaOperator.NOT_EQUALS]: 'does not equal',
  [CriteriaOperator.GREATER_THAN]: 'is greater than',
  [CriteriaOperator.GREATER_THAN_OR_EQUALS]: 'is at least',
  [CriteriaOperator.LESS_THAN]: 'is less than',
  [CriteriaOperator.LESS_THAN_OR_EQUALS]: 'is at most',
  [CriteriaOperator.BETWEEN]: 'is between',
  [CriteriaOperator.CONTAINS]: 'contains',
  [CriteriaOperator.CONTAINS_ANY]: 'contains any of',
  [CriteriaOperator.IS_TRUE]: 'is Yes (Confirmed)',
  [CriteriaOperator.IS_FALSE]: 'is No (Not Confirmed)'
};

export const GROUP_OPERATOR_LABELS: Record<CriteriaGroupOperator, string> = {
  [CriteriaGroupOperator.AND]: 'AND',
  [CriteriaGroupOperator.OR]: 'OR'
};

// -----------------------------------------------------------------------------
// ATTENDANCE CRITERIA OPTIONS
// -----------------------------------------------------------------------------

export const ATTENDANCE_CRITERIA_FIELD_OPTIONS = [
  {
    value: AttendanceCriteriaField.WORKING_HOUR,
    label: 'Working Hour'
  },
  {
    value: AttendanceCriteriaField.OVERTIME,
    label: 'Overtime'
  },
  {
    value: AttendanceCriteriaField.LATE_IN,
    label: 'Late In'
  },
  {
    value: AttendanceCriteriaField.EARLY_OUT,
    label: 'Early Out'
  },
  {
    value: AttendanceCriteriaField.BREAK_DURATION,
    label: 'Break Duration'
  },
  {
    value: AttendanceCriteriaField.TIME_IN,
    label: 'Time In'
  },
  {
    value: AttendanceCriteriaField.TIME_OUT,
    label: 'Time Out'
  }
] as const;

export const ATTENDANCE_CRITERIA_CONDITION_OPTIONS = [
  {
    value: AttendanceCriteriaCondition.GREATER_THAN,
    label: 'More than'
  },
  {
    value: AttendanceCriteriaCondition.GREATER_THAN_OR_EQUALS,
    label: 'Equal & More than'
  },
  {
    value: AttendanceCriteriaCondition.LESS_THAN,
    label: 'Less than'
  },
  {
    value: AttendanceCriteriaCondition.LESS_THAN_OR_EQUALS,
    label: 'Less than & Equal'
  },
  {
    value: AttendanceCriteriaCondition.EQUALS,
    label: 'Equals'
  }
] as const;

export const ATTENDANCE_CONDITION_LABELS: Record<AttendanceCriteriaCondition, string> = {
  [AttendanceCriteriaCondition.GREATER_THAN]: '>',
  [AttendanceCriteriaCondition.GREATER_THAN_OR_EQUALS]: '>=',
  [AttendanceCriteriaCondition.LESS_THAN]: '<',
  [AttendanceCriteriaCondition.LESS_THAN_OR_EQUALS]: '<=',
  [AttendanceCriteriaCondition.EQUALS]: '=',
  [AttendanceCriteriaCondition.NOT_EQUALS]: '!=',
  [AttendanceCriteriaCondition.BETWEEN]: 'Between'
};

// -----------------------------------------------------------------------------
// CURRENCY OPTIONS
// -----------------------------------------------------------------------------

export const CURRENCY_OPTIONS = [
  { value: 'MYR', label: 'MYR - Malaysian Ringgit', symbol: 'RM' },
  { value: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { value: 'THB', label: 'THB - Thai Baht', symbol: '฿' },
  { value: 'PHP', label: 'PHP - Philippine Peso', symbol: '₱' },
  { value: 'VND', label: 'VND - Vietnamese Dong', symbol: '₫' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' }
] as const;

export const DEFAULT_CURRENCY = 'MYR';

// -----------------------------------------------------------------------------
// FORMULA VARIABLES (available for formula mode)
// -----------------------------------------------------------------------------

export const FORMULA_VARIABLES = [
  { name: 'basicSalary', field: 'basicSalary', description: 'Employee basic salary' },
  { name: 'workingDays', field: 'workingDays', description: 'Number of working days in period' },
  { name: 'attendedDays', field: 'attendedDays', description: 'Days actually attended' },
  { name: 'tenure', field: 'tenureMonths', description: 'Tenure in months' },
  { name: 'jobGrade', field: 'jobGrade', description: 'Job grade level (numeric)' }
] as const;

// -----------------------------------------------------------------------------
// WIZARD STEPS
// -----------------------------------------------------------------------------

export const WIZARD_STEPS = [
  {
    index: 0,
    key: 'general',
    label: 'General',
    description: 'Basic allowance details',
    icon: 'pi pi-file-edit'
  },
  {
    index: 1,
    key: 'assign',
    label: 'Assign Employee',
    description: 'Select employees',
    icon: 'pi pi-users'
  }
] as const;

// -----------------------------------------------------------------------------
// TABLE DEFAULTS
// -----------------------------------------------------------------------------

export const TABLE_DEFAULTS = {
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  sortField: 'updatedAt',
  sortOrder: -1 // descending
} as const;

// -----------------------------------------------------------------------------
// VALIDATION MESSAGES
// -----------------------------------------------------------------------------

export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  minValue: (field: string, min: number) => `${field} must be at least ${min}`,
  maxValue: (field: string, max: number) => `${field} must not exceed ${max}`,
  unique: (field: string) => `${field} already exists`,
  invalidFormat: (field: string) => `${field} format is invalid`,
  dateAfter: (field: string, after: string) => `${field} must be after ${after}`,
  dateBefore: (field: string, before: string) => `${field} must be before ${before}`
} as const;

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

export const API_ENDPOINTS = {
  templates: '/api/allowance-templates',
  template: (id: string) => `/api/allowance-templates/${id}`,
  duplicate: (id: string) => `/api/allowance-templates/${id}/duplicate`,
  archive: (id: string) => `/api/allowance-templates/${id}/archive`,
  unarchive: (id: string) => `/api/allowance-templates/${id}/unarchive`,
  criteriaPreview: (id: string) => `/api/allowance-templates/${id}/criteria/preview`,
  assignments: (id: string) => `/api/allowance-templates/${id}/assignments`,
  assignment: (templateId: string, assignmentId: string) =>
    `/api/allowance-templates/${templateId}/assignments/${assignmentId}`,
  checkCode: '/api/allowance-templates/check-code',
  lookups: '/api/lookups',
  users: '/api/users'
} as const;

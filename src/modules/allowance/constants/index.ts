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
  AttendanceCriteriaCondition,
  DailyCalculationMode,
  MonthlyCriteriaCondition,
  OneOffFrequency,
  ServicePeriodUnit
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
// DAILY CALCULATION MODE OPTIONS
// -----------------------------------------------------------------------------

export const DAILY_CALCULATION_MODE_OPTIONS = [
  {
    value: DailyCalculationMode.FIXED_DAILY,
    label: 'Fixed Daily',
    description: 'Fixed amount per eligible day',
    icon: 'pi pi-wallet'
  },
  {
    value: DailyCalculationMode.HOURLY_RATE,
    label: 'Hourly Rate',
    description: 'Rate per hour with time conditions and daily cap',
    icon: 'pi pi-clock'
  }
] as const;

// -----------------------------------------------------------------------------
// PAYROLL ADDITIONAL ITEM OPTIONS (for Daily Allowance)
// -----------------------------------------------------------------------------

export const PAYROLL_ADDITIONAL_ITEM_OPTIONS = [
  { value: 'ATTENDANCE_ALLOWANCE', label: 'Attendance Allowance' },
  { value: 'TRANSPORT_ALLOWANCE', label: 'Transport Allowance' },
  { value: 'MEAL_ALLOWANCE', label: 'Meal Allowance' },
  { value: 'SHIFT_ALLOWANCE', label: 'Shift Allowance' },
  { value: 'SITE_ALLOWANCE', label: 'Site Allowance' },
  { value: 'OUTSTATION_ALLOWANCE', label: 'Outstation Allowance' },
  { value: 'HAZARD_ALLOWANCE', label: 'Hazard Allowance' },
  { value: 'HOUSING_ALLOWANCE', label: 'Housing Allowance' },
  { value: 'PHONE_ALLOWANCE', label: 'Phone Allowance' },
  { value: 'PETROL_ALLOWANCE', label: 'Petrol Allowance' },
  { value: 'PARKING_ALLOWANCE', label: 'Parking Allowance' },
  { value: 'OTHER_ALLOWANCE', label: 'Other Allowance' }
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
    value: AttendanceCriteriaField.TOTAL_WORKING_DAYS,
    label: 'Total Working Days'
  },
  {
    value: AttendanceCriteriaField.TOTAL_WORKING_HOURS,
    label: 'Total Working Hours'
  },
  {
    value: AttendanceCriteriaField.TOTAL_ACTUAL_OVERTIME,
    label: 'Total Actual Overtime'
  },
  {
    value: AttendanceCriteriaField.TOTAL_APPROVED_OVERTIME,
    label: 'Total Approved Overtime'
  },
  {
    value: AttendanceCriteriaField.LATE_IN_TIMES,
    label: 'Late In (Times)'
  },
  {
    value: AttendanceCriteriaField.LATE_IN_MINUTES,
    label: 'Late In (Minutes)'
  },
  {
    value: AttendanceCriteriaField.EARLY_OUT_TIMES,
    label: 'Early Out (Times)'
  },
  {
    value: AttendanceCriteriaField.EARLY_OUT_MINUTES,
    label: 'Early Out (Minutes)'
  },
  {
    value: AttendanceCriteriaField.EXTENDED_BREAK_TIMES,
    label: 'Extended Break (Times)'
  },
  {
    value: AttendanceCriteriaField.EXTENDED_BREAK_MINUTES,
    label: 'Extended Break (Minutes)'
  },
  {
    value: AttendanceCriteriaField.SHORT_HOURS_TIMES,
    label: 'Short Hours (Times)'
  },
  {
    value: AttendanceCriteriaField.SHORT_HOURS_MINUTES,
    label: 'Short Hours (Minutes)'
  },
  {
    value: AttendanceCriteriaField.ABSENT_TIMES,
    label: 'Absent (Times)'
  },
  {
    value: AttendanceCriteriaField.LEAVE_TIMES,
    label: 'Leave (Times)'
  },
  {
    value: AttendanceCriteriaField.WORKING_TIME,
    label: 'Working Starts & Working Ends'
  },
  {
    value: AttendanceCriteriaField.OVERTIME_TIME,
    label: 'Overtime Starts & Overtime Ends'
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
// MONTHLY CRITERIA OPTIONS
// -----------------------------------------------------------------------------

export const MONTHLY_CRITERIA_CONDITION_OPTIONS = [
  {
    value: MonthlyCriteriaCondition.GREATER_THAN_OR_EQUALS,
    label: 'At least'
  },
  {
    value: MonthlyCriteriaCondition.GREATER_THAN,
    label: 'More than'
  },
  {
    value: MonthlyCriteriaCondition.LESS_THAN_OR_EQUALS,
    label: 'At most'
  },
  {
    value: MonthlyCriteriaCondition.LESS_THAN,
    label: 'Less than'
  },
  {
    value: MonthlyCriteriaCondition.EQUALS,
    label: 'Exactly'
  }
] as const;

// -----------------------------------------------------------------------------
// ONE-OFF FREQUENCY OPTIONS
// -----------------------------------------------------------------------------

export const ONE_OFF_FREQUENCY_OPTIONS = [
  {
    value: OneOffFrequency.YEARLY,
    label: 'Yearly',
    description: 'Paid once every year (e.g., Annual Bonus, Hari Raya Bonus)',
    icon: 'pi pi-calendar'
  },
  {
    value: OneOffFrequency.ENTIRE_SERVICE,
    label: 'Entire Year of Service',
    description: 'Paid once in entire employment (e.g., Long Service Award)',
    icon: 'pi pi-star'
  }
] as const;

// -----------------------------------------------------------------------------
// SERVICE PERIOD UNIT OPTIONS
// -----------------------------------------------------------------------------

export const SERVICE_PERIOD_UNIT_OPTIONS = [
  { value: ServicePeriodUnit.MONTHS, label: 'Months' },
  { value: ServicePeriodUnit.YEARS, label: 'Years' }
] as const;

// -----------------------------------------------------------------------------
// SERVICE MILESTONE OPTIONS (for Long Service Award)
// -----------------------------------------------------------------------------

export const SERVICE_MILESTONE_OPTIONS = [
  { value: 5, label: '5 Years' },
  { value: 10, label: '10 Years' },
  { value: 15, label: '15 Years' },
  { value: 20, label: '20 Years' },
  { value: 25, label: '25 Years' },
  { value: 30, label: '30 Years' }
] as const;

// -----------------------------------------------------------------------------
// LEAVE TYPE OPTIONS (for Leave criteria)
// -----------------------------------------------------------------------------

export const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'MEDICAL', label: 'Medical Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
  { value: 'COMPASSIONATE', label: 'Compassionate Leave' },
  { value: 'MARRIAGE', label: 'Marriage Leave' },
  { value: 'STUDY', label: 'Study Leave' },
  { value: 'REPLACEMENT', label: 'Replacement Leave' },
  { value: 'HOSPITALIZATION', label: 'Hospitalization Leave' }
] as const;

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

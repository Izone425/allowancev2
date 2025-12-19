// ============================================================================
// ALLOWANCE MODULE - TYPE DEFINITIONS
// ============================================================================

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export enum AllowanceType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  ONE_OFF = 'ONE_OFF'
}

export enum AllowanceAmountMode {
  FIXED = 'FIXED',
  FORMULA = 'FORMULA'
}

// Daily allowance calculation mode
export enum DailyCalculationMode {
  FIXED_DAILY = 'FIXED_DAILY',       // Fixed amount per day
  HOURLY_RATE = 'HOURLY_RATE'        // Rate per hour with conditions
}

export enum AllowanceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum CriteriaOperator {
  // List operators
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  // Comparison operators
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  // Range operator
  BETWEEN = 'BETWEEN',
  // String operators
  CONTAINS = 'CONTAINS',
  CONTAINS_ANY = 'CONTAINS_ANY',
  // Boolean
  IS_TRUE = 'IS_TRUE',
  IS_FALSE = 'IS_FALSE'
}

export enum CriteriaField {
  DEPARTMENT = 'DEPARTMENT',
  BRANCH = 'BRANCH',
  JOB_GRADE = 'JOB_GRADE',
  EMPLOYMENT_TYPE = 'EMPLOYMENT_TYPE',
  TENURE_MONTHS = 'TENURE_MONTHS',
  CONFIRMATION_STATUS = 'CONFIRMATION_STATUS',
  CUSTOM_TAGS = 'CUSTOM_TAGS',
  POSITION = 'POSITION',
  COST_CENTER = 'COST_CENTER'
}

export enum CriteriaGroupOperator {
  AND = 'AND',
  OR = 'OR'
}

// -----------------------------------------------------------------------------
// ATTENDANCE CRITERIA ENUMS
// -----------------------------------------------------------------------------

export enum AttendanceCriteriaField {
  TOTAL_WORKING_HOURS = 'TOTAL_WORKING_HOURS',
  TOTAL_ACTUAL_OVERTIME = 'TOTAL_ACTUAL_OVERTIME',
  TOTAL_APPROVED_OVERTIME = 'TOTAL_APPROVED_OVERTIME',
  LATE_IN_TIMES = 'LATE_IN_TIMES',               // Number of times late
  LATE_IN_MINUTES = 'LATE_IN_MINUTES',           // Total late minutes
  EARLY_OUT_TIMES = 'EARLY_OUT_TIMES',           // Number of times early out
  EARLY_OUT_MINUTES = 'EARLY_OUT_MINUTES',       // Total early out minutes
  EXTENDED_BREAK_TIMES = 'EXTENDED_BREAK_TIMES',     // Number of extended breaks
  EXTENDED_BREAK_MINUTES = 'EXTENDED_BREAK_MINUTES', // Total extended break minutes
  SHORT_HOURS_TIMES = 'SHORT_HOURS_TIMES',           // Number of short hour days
  SHORT_HOURS_MINUTES = 'SHORT_HOURS_MINUTES',       // Total short hours minutes
  ABSENT_TIMES = 'ABSENT_TIMES',                     // Number of absent days
  LEAVE_TIMES = 'LEAVE_TIMES',                       // Number of leave days
  WORKING_TIME = 'WORKING_TIME',        // Combined start & end time range
  OVERTIME_TIME = 'OVERTIME_TIME'       // Overtime start & end time range
}

export enum AttendanceCriteriaCondition {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  BETWEEN = 'BETWEEN'
}

// -----------------------------------------------------------------------------
// ALLOWANCE TEMPLATE INTERFACES
// -----------------------------------------------------------------------------

export interface AllowanceTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: AllowanceType;
  amountMode: AllowanceAmountMode;
  amount: number;
  formulaExpression?: string;
  formulaVariables?: FormulaVariable[];
  currency: string;
  taxable: boolean;
  prorate: boolean;

  // Type-specific fields
  // DAILY
  dailyCalculationMode?: DailyCalculationMode;
  ratePerDay?: number;
  includeNonWorkingDays?: boolean;
  applyOnNormalWorkday?: boolean;
  applyOnRestday?: boolean;
  applyOnOffday?: boolean;
  applyOnHoliday?: boolean;
  filterByShift?: boolean;
  applyOnShifts?: string[];
  filterByWorkLocation?: boolean;
  applyOnWorkLocations?: string[];
  // Hourly rate configuration (when dailyCalculationMode = HOURLY_RATE)
  hourlyRateConfig?: HourlyRateConfig;
  // Payroll Additional Item (for Daily type)
  payrollAdditionalItem?: string;

  // MONTHLY
  prorateByJoinDate?: boolean;
  prorateByLeaveDate?: boolean;

  // ONE_OFF
  payoutDate?: string; // ISO date string
  payoutMonth?: string; // YYYY-MM format

  // Effective dates
  effectiveStart: string; // ISO date string
  effectiveEnd?: string; // ISO date string

  // Status
  status: AllowanceStatus;

  // Criteria (embedded for convenience, also separate endpoint)
  criteria?: CriteriaSet;

  // Attendance Criteria (for Daily type)
  attendanceCriteria?: AttendanceCriteriaSet;

  // Audit fields
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;

  // Stats (computed)
  assignmentCount?: number;
}

export interface FormulaVariable {
  name: string;
  field: string; // e.g., 'basicSalary', 'workingDays', etc.
  description?: string;
}

// -----------------------------------------------------------------------------
// CRITERIA INTERFACES
// -----------------------------------------------------------------------------

export interface CriteriaRule {
  id: string;
  field: CriteriaField;
  operator: CriteriaOperator;
  value: CriteriaValue;
}

// Value can be different types based on operator
export type CriteriaValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { min: number; max: number }; // For BETWEEN operator

export interface CriteriaGroup {
  id: string;
  operator: CriteriaGroupOperator; // AND/OR within the group
  rules: CriteriaRule[];
}

export interface CriteriaSet {
  id?: string;
  templateId?: string;
  groupOperator: CriteriaGroupOperator; // AND/OR between groups
  groups: CriteriaGroup[];
}

// -----------------------------------------------------------------------------
// ATTENDANCE CRITERIA INTERFACES
// -----------------------------------------------------------------------------

export interface AttendanceTimeValue {
  hours: number;
  minutes: number;
}

export interface AttendanceTimeRangeValue {
  startTime: AttendanceTimeValue;
  endTime: AttendanceTimeValue;
}

// Leave criteria value with leave type selection
export interface AttendanceLeaveValue {
  count: number;           // Number of times (leave days)
  leaveType: string;       // Selected leave type ID (empty string = all leave types)
}

export interface AttendanceCriteriaRule {
  id: string;
  field: AttendanceCriteriaField;
  condition: AttendanceCriteriaCondition;
  value: AttendanceTimeValue | AttendanceTimeRangeValue | AttendanceLeaveValue;  // TimeRange for WORKING_TIME field, LeaveValue for LEAVE_TIMES
}

export interface AttendanceCriteriaGroup {
  id: string;
  operator: CriteriaGroupOperator; // AND/OR within the group
  rules: AttendanceCriteriaRule[];
}

export interface AttendanceCriteriaSet {
  groupOperator: CriteriaGroupOperator; // AND/OR between groups
  groups: AttendanceCriteriaGroup[];
}

// -----------------------------------------------------------------------------
// HOURLY RATE CONFIGURATION (for Daily Allowance)
// -----------------------------------------------------------------------------

export interface HourlyRateConfig {
  ratePerHour: number;                    // e.g., RM 5 per hour
  dailyCap: number | null;                // e.g., RM 20 max per day (null = no cap)
  minWorkingHours: AttendanceTimeValue | null;  // Minimum hours to qualify (null = no minimum)
}

// -----------------------------------------------------------------------------
// ASSIGNMENT INTERFACES
// -----------------------------------------------------------------------------

export interface AllowanceAssignment {
  id: string;
  templateId: string;
  userId: string;
  userName?: string;
  userCode?: string;
  userDepartment?: string;
  userPosition?: string;

  // Optional per-assignment overrides
  effectiveStartOverride?: string;
  effectiveEndOverride?: string;
  amountOverride?: number;

  // Assignment metadata
  assignedAt: string;
  assignedBy: string;
  assignmentSource: 'MANUAL' | 'CRITERIA';
}

// -----------------------------------------------------------------------------
// USER INTERFACES (for assignment selection)
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  branch: string;
  branchId: string;
  position: string;
  positionId: string;
  jobGrade: number;
  employmentType: string;
  tenureMonths: number;
  isConfirmed: boolean;
  tags: string[];
  joinDate: string;
  avatar?: string;
}

// -----------------------------------------------------------------------------
// API REQUEST/RESPONSE INTERFACES
// -----------------------------------------------------------------------------

// List request
export interface AllowanceTemplateListRequest {
  page?: number;
  limit?: number;
  search?: string;
  type?: AllowanceType;
  status?: AllowanceStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create/Update request
export interface CreateAllowanceTemplateRequest {
  name: string;
  code: string;
  description?: string;
  type: AllowanceType;
  amountMode: AllowanceAmountMode;
  amount: number;
  formulaExpression?: string;
  formulaVariables?: FormulaVariable[];
  currency?: string;
  taxable: boolean;
  prorate?: boolean;
  // Daily specific
  dailyCalculationMode?: DailyCalculationMode;
  ratePerDay?: number;
  includeNonWorkingDays?: boolean;
  applyOnNormalWorkday?: boolean;
  applyOnRestday?: boolean;
  applyOnOffday?: boolean;
  applyOnHoliday?: boolean;
  filterByShift?: boolean;
  applyOnShifts?: string[];
  filterByWorkLocation?: boolean;
  applyOnWorkLocations?: string[];
  hourlyRateConfig?: HourlyRateConfig;
  payrollAdditionalItem?: string;
  attendanceCriteria?: AttendanceCriteriaSet;
  // Monthly specific
  prorateByJoinDate?: boolean;
  prorateByLeaveDate?: boolean;
  // One-off specific
  payoutDate?: string;
  payoutMonth?: string;
  // Common
  effectiveStart: string;
  effectiveEnd?: string;
  status?: AllowanceStatus;
  criteria?: Omit<CriteriaSet, 'id' | 'templateId'>;
}

export interface UpdateAllowanceTemplateRequest extends Partial<CreateAllowanceTemplateRequest> {
  id: string;
}

// Criteria preview
export interface CriteriaPreviewRequest {
  criteria: Omit<CriteriaSet, 'id' | 'templateId'>;
}

export interface CriteriaPreviewResponse {
  eligibleCount: number;
  eligibleUserIds: string[];
  eligibleUsers?: User[]; // Optional: full user details
}

// Assignment requests
export interface BulkAssignRequest {
  userIds: string[];
  effectiveStartOverride?: string;
  effectiveEndOverride?: string;
  source: 'MANUAL' | 'CRITERIA';
}

export interface AssignmentListRequest {
  page?: number;
  limit?: number;
  search?: string;
}

// -----------------------------------------------------------------------------
// FORM STATE INTERFACES
// -----------------------------------------------------------------------------

export interface TemplateFormState {
  step: number;
  templateInfo: TemplateInfoFormData;
  criteria: CriteriaSet;
  assignments: {
    selectedUserIds: string[];
    assignmentMode: 'MANUAL' | 'CRITERIA';
  };
  isDirty: boolean;
  isValid: boolean;
}

export interface TemplateInfoFormData {
  name: string;
  code: string;
  description: string;
  type: AllowanceType | null;
  amountMode: AllowanceAmountMode;
  amount: number | null;
  formulaExpression: string;
  formulaVariables: FormulaVariable[];
  currency: string;
  taxable: boolean;
  prorate: boolean;
  // Daily specific
  dailyCalculationMode: DailyCalculationMode;
  ratePerDay: number | null;
  includeNonWorkingDays: boolean;
  applyOnNormalWorkday: boolean;
  applyOnRestday: boolean;
  applyOnOffday: boolean;
  applyOnHoliday: boolean;
  filterByShift: boolean;
  applyOnShifts: string[];
  filterByWorkLocation: boolean;
  applyOnWorkLocations: string[];
  // Hourly rate config (when dailyCalculationMode = HOURLY_RATE)
  hourlyRateConfig: HourlyRateConfig;
  // Payroll Additional Item (for Daily type)
  payrollAdditionalItem: string;
  // Monthly specific
  prorateByJoinDate: boolean;
  prorateByLeaveDate: boolean;
  // One-off specific
  payoutDate: Date | null;
  payoutMonth: string;
  // Common
  effectiveStart: Date | null;
  effectiveEnd: Date | null;
  status: AllowanceStatus;
  // Attendance Criteria
  attendanceCriteria: AttendanceCriteriaSet;
}

// -----------------------------------------------------------------------------
// VALIDATION INTERFACES
// -----------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// -----------------------------------------------------------------------------
// LOOKUP DATA INTERFACES (for dropdowns)
// -----------------------------------------------------------------------------

export interface LookupItem {
  id: string;
  name: string;
  code?: string;
}

export interface LookupData {
  departments: LookupItem[];
  branches: LookupItem[];
  positions: LookupItem[];
  jobGrades: LookupItem[];
  employmentTypes: LookupItem[];
  costCenters: LookupItem[];
}

// -----------------------------------------------------------------------------
// AUDIT INTERFACES
// -----------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'UNARCHIVE' | 'DUPLICATE' | 'ASSIGN' | 'UNASSIGN';
  entityType: 'TEMPLATE' | 'ASSIGNMENT';
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  performedBy: string;
  performedByName: string;
  performedAt: string;
}

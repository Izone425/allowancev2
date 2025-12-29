// ============================================================================
// ALLOWANCE TEMPLATE SERVICE
// API communication layer for allowance templates
// ============================================================================

import { API_ENDPOINTS } from '../constants';
import type {
  AllowanceTemplate,
  AllowanceTemplateListRequest,
  PaginatedResponse,
  CreateAllowanceTemplateRequest,
  UpdateAllowanceTemplateRequest,
  CriteriaPreviewRequest,
  CriteriaPreviewResponse,
  AllowanceAssignment,
  BulkAssignRequest,
  AssignmentListRequest,
  User,
  LookupData
} from '../types';

// -----------------------------------------------------------------------------
// HTTP CLIENT ABSTRACTION
// In real app, this would be axios instance with interceptors
// -----------------------------------------------------------------------------

interface HttpClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, data?: unknown): Promise<T>;
  put<T>(url: string, data?: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// Placeholder - replace with actual axios instance
const httpClient: HttpClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    const response = await fetch(url + queryString, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      }
    });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    return response.json();
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    return response.json();
  },

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    return response.json();
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    return response.json();
  }
};

// -----------------------------------------------------------------------------
// MOCK DATA FOR DEVELOPMENT
// -----------------------------------------------------------------------------

const MOCK_TEMPLATES: AllowanceTemplate[] = [
  // DAILY Allowances
  {
    id: 'tpl_001',
    name: 'Daily Travel Allowance',
    code: 'DTA-001',
    description: 'Daily travel allowance for employees with fieldwork duties',
    type: 'DAILY',
    amountMode: 'FIXED',
    amount: 50,
    currency: 'MYR',
    taxable: false,
    effectiveStart: '2024-01-01',
    effectiveEnd: null,
    status: 'ACTIVE',
    includeNonWorkingDays: false,
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'DEPARTMENT', operator: 'IN', value: ['dept_sales', 'dept_marketing'] }
          ]
        }
      ]
    },
    assignmentCount: 25,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-03-15T10:30:00Z',
    updatedBy: 'admin'
  },
  {
    id: 'tpl_002',
    name: 'Site Allowance',
    code: 'SITE-001',
    description: 'Daily allowance for construction site workers',
    type: 'DAILY',
    amountMode: 'FIXED',
    amount: 35,
    currency: 'MYR',
    taxable: false,
    effectiveStart: '2024-02-01',
    effectiveEnd: '2024-12-31',
    status: 'ACTIVE',
    includeNonWorkingDays: true,
    criteria: {
      groupOperator: 'AND',
      groups: []
    },
    assignmentCount: 48,
    createdAt: '2024-02-01T00:00:00Z',
    createdBy: 'hr_manager',
    updatedAt: '2024-06-20T14:22:00Z',
    updatedBy: 'hr_manager'
  },
  {
    id: 'tpl_003',
    name: 'Outstation Allowance',
    code: 'OUT-001',
    description: 'Daily allowance for outstation assignments',
    type: 'DAILY',
    amountMode: 'FIXED',
    amount: 100,
    currency: 'MYR',
    taxable: true,
    effectiveStart: '2024-01-01',
    effectiveEnd: null,
    status: 'ACTIVE',
    includeNonWorkingDays: false,
    criteria: {
      groupOperator: 'AND',
      groups: []
    },
    assignmentCount: 0,
    createdAt: '2024-11-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-11-01T00:00:00Z',
    updatedBy: 'admin'
  },

  // MONTHLY Allowances
  {
    id: 'tpl_004',
    name: 'Transport Allowance',
    code: 'TRANS-001',
    description: 'Monthly transport allowance for all permanent staff',
    type: 'MONTHLY',
    amountMode: 'FIXED',
    amount: 500,
    currency: 'MYR',
    taxable: true,
    effectiveStart: '2024-01-01',
    effectiveEnd: null,
    status: 'ACTIVE',
    prorate: true,
    prorateByJoinDate: true,
    prorateByLeaveDate: true,
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'EMPLOYMENT_TYPE', operator: 'IN', value: ['PERMANENT'] },
            { id: 'rule_2', field: 'CONFIRMATION_STATUS', operator: 'IS_TRUE', value: true }
          ]
        }
      ]
    },
    assignmentCount: 156,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-08-10T09:15:00Z',
    updatedBy: 'admin'
  },
  {
    id: 'tpl_005',
    name: 'Housing Allowance',
    code: 'HOUSE-001',
    description: 'Monthly housing allowance for senior management',
    type: 'MONTHLY',
    amountMode: 'FIXED',
    amount: 2000,
    currency: 'MYR',
    taxable: true,
    effectiveStart: '2024-01-01',
    effectiveEnd: null,
    status: 'ACTIVE',
    prorate: false,
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'JOB_GRADE', operator: 'GREATER_THAN_OR_EQUALS', value: 8 }
          ]
        }
      ]
    },
    assignmentCount: 12,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'cfo',
    updatedAt: '2024-05-22T16:45:00Z',
    updatedBy: 'cfo'
  },
  {
    id: 'tpl_006',
    name: 'Phone Allowance',
    code: 'PHONE-001',
    description: 'Monthly mobile phone reimbursement',
    type: 'MONTHLY',
    amountMode: 'FIXED',
    amount: 150,
    currency: 'MYR',
    taxable: false,
    effectiveStart: '2024-03-01',
    effectiveEnd: null,
    status: 'ACTIVE',
    prorate: true,
    prorateByJoinDate: true,
    prorateByLeaveDate: false,
    criteria: {
      groupOperator: 'OR',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'DEPARTMENT', operator: 'IN', value: ['dept_sales'] }
          ]
        },
        {
          id: 'grp_2',
          operator: 'AND',
          rules: [
            { id: 'rule_2', field: 'JOB_GRADE', operator: 'GREATER_THAN_OR_EQUALS', value: 5 }
          ]
        }
      ]
    },
    assignmentCount: 67,
    createdAt: '2024-03-01T00:00:00Z',
    createdBy: 'hr_manager',
    updatedAt: '2024-09-18T11:30:00Z',
    updatedBy: 'hr_manager'
  },
  {
    id: 'tpl_007',
    name: 'Parking Allowance',
    code: 'PARK-001',
    description: 'Monthly parking subsidy for HQ employees',
    type: 'MONTHLY',
    amountMode: 'FIXED',
    amount: 100,
    currency: 'MYR',
    taxable: false,
    effectiveStart: '2024-01-01',
    effectiveEnd: null,
    status: 'ARCHIVED',
    prorate: false,
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'BRANCH', operator: 'IN', value: ['branch_hq'] }
          ]
        }
      ]
    },
    assignmentCount: 89,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-10-01T08:00:00Z',
    updatedBy: 'admin'
  },

  // ONE_OFF Allowances
  {
    id: 'tpl_008',
    name: 'Year End Bonus 2024',
    code: 'YEB-2024',
    description: 'Year-end performance bonus for 2024',
    type: 'ONE_OFF',
    amountMode: 'FIXED',
    amount: 3000,
    currency: 'MYR',
    taxable: true,
    effectiveStart: '2024-12-15',
    effectiveEnd: '2024-12-31',
    status: 'ACTIVE',
    payoutDate: '2024-12-20',
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'TENURE_MONTHS', operator: 'GREATER_THAN_OR_EQUALS', value: 12 },
            { id: 'rule_2', field: 'CONFIRMATION_STATUS', operator: 'IS_TRUE', value: true }
          ]
        }
      ]
    },
    assignmentCount: 134,
    createdAt: '2024-11-15T00:00:00Z',
    createdBy: 'ceo',
    updatedAt: '2024-12-01T10:00:00Z',
    updatedBy: 'cfo'
  },
  {
    id: 'tpl_009',
    name: 'Hari Raya Bonus',
    code: 'RAYA-2024',
    description: 'Festive allowance for Hari Raya Aidilfitri',
    type: 'ONE_OFF',
    amountMode: 'FIXED',
    amount: 500,
    currency: 'MYR',
    taxable: false,
    effectiveStart: '2024-04-01',
    effectiveEnd: '2024-04-10',
    status: 'ACTIVE',
    payoutDate: '2024-04-05',
    criteria: {
      groupOperator: 'AND',
      groups: []
    },
    assignmentCount: 200,
    createdAt: '2024-03-01T00:00:00Z',
    createdBy: 'hr_manager',
    updatedAt: '2024-03-28T14:00:00Z',
    updatedBy: 'hr_manager'
  },
  {
    id: 'tpl_010',
    name: 'Project Completion Bonus',
    code: 'PCB-001',
    description: 'One-time bonus for successful project completion',
    type: 'ONE_OFF',
    amountMode: 'FIXED',
    amount: 1500,
    currency: 'MYR',
    taxable: true,
    effectiveStart: '2024-09-01',
    effectiveEnd: '2024-09-30',
    status: 'ACTIVE',
    payoutDate: '2024-09-15',
    criteria: {
      groupOperator: 'AND',
      groups: [
        {
          id: 'grp_1',
          operator: 'AND',
          rules: [
            { id: 'rule_1', field: 'CUSTOM_TAGS', operator: 'CONTAINS_ANY', value: ['project-alpha', 'project-beta'] }
          ]
        }
      ]
    },
    assignmentCount: 0,
    createdAt: '2024-08-20T00:00:00Z',
    createdBy: 'project_manager',
    updatedAt: '2024-08-20T00:00:00Z',
    updatedBy: 'project_manager'
  }
];

const MOCK_USERS: User[] = [
  { id: 'user_001', name: 'Ahmad Bin Abdullah', code: 'EMP001', email: 'ahmad@company.com', department: 'Engineering', departmentId: 'dept_eng', branch: 'HQ', branchId: 'branch_hq', position: 'Senior Engineer', positionId: 'pos_se', jobGrade: 6, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2020-03-15', tenureMonths: 57, tags: [], assignedTemplates: [{ id: 'tpl_001', name: 'Daily Travel Allowance', code: 'DTA-001' }] },
  { id: 'user_002', name: 'Siti Nurhaliza', code: 'EMP002', email: 'siti@company.com', department: 'Sales', departmentId: 'dept_sales', branch: 'HQ', branchId: 'branch_hq', position: 'Sales Executive', positionId: 'pos_se', jobGrade: 4, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2021-06-01', tenureMonths: 42, tags: [], assignedTemplates: [{ id: 'tpl_001', name: 'Daily Travel Allowance', code: 'DTA-001' }, { id: 'tpl_003', name: 'Monthly Transport', code: 'MTR-001' }] },
  { id: 'user_003', name: 'Raj Kumar', code: 'EMP003', email: 'raj@company.com', department: 'IT', departmentId: 'dept_it', branch: 'HQ', branchId: 'branch_hq', position: 'System Administrator', positionId: 'pos_sa', jobGrade: 5, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2019-01-10', tenureMonths: 71, tags: [], assignedTemplates: [] },
  { id: 'user_004', name: 'Lee Wei Ming', code: 'EMP004', email: 'weiming@company.com', department: 'Finance', departmentId: 'dept_finance', branch: 'HQ', branchId: 'branch_hq', position: 'Accountant', positionId: 'pos_acc', jobGrade: 5, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2022-02-14', tenureMonths: 34, tags: [], assignedTemplates: [{ id: 'tpl_003', name: 'Monthly Transport', code: 'MTR-001' }] },
  { id: 'user_005', name: 'Nurul Aisyah', code: 'EMP005', email: 'nurul@company.com', department: 'HR', departmentId: 'dept_hr', branch: 'HQ', branchId: 'branch_hq', position: 'HR Executive', positionId: 'pos_hr', jobGrade: 4, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2021-09-01', tenureMonths: 39, tags: [], assignedTemplates: [] },
  { id: 'user_006', name: 'Muhammad Faiz', code: 'EMP006', email: 'faiz@company.com', department: 'Marketing', departmentId: 'dept_marketing', branch: 'Branch A', branchId: 'branch_a', position: 'Marketing Officer', positionId: 'pos_mo', jobGrade: 4, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2023-01-15', tenureMonths: 23, tags: [], assignedTemplates: [{ id: 'tpl_001', name: 'Daily Travel Allowance', code: 'DTA-001' }] },
  { id: 'user_007', name: 'Tan Mei Ling', code: 'EMP007', email: 'meiling@company.com', department: 'Engineering', departmentId: 'dept_eng', branch: 'HQ', branchId: 'branch_hq', position: 'Junior Engineer', positionId: 'pos_je', jobGrade: 3, employmentType: 'PERMANENT', isConfirmed: false, joinDate: '2024-06-01', tenureMonths: 6, tags: [], assignedTemplates: [] },
  { id: 'user_008', name: 'Muthu Krishnan', code: 'EMP008', email: 'muthu@company.com', department: 'Operations', departmentId: 'dept_ops', branch: 'Branch B', branchId: 'branch_b', position: 'Operations Manager', positionId: 'pos_om', jobGrade: 7, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2018-05-20', tenureMonths: 79, tags: [], assignedTemplates: [{ id: 'tpl_002', name: 'Site Allowance', code: 'SITE-001' }] },
  { id: 'user_009', name: 'Aisha Rahman', code: 'EMP009', email: 'aisha@company.com', department: 'Sales', departmentId: 'dept_sales', branch: 'Branch A', branchId: 'branch_a', position: 'Sales Manager', positionId: 'pos_sm', jobGrade: 6, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2019-11-01', tenureMonths: 61, tags: [], assignedTemplates: [{ id: 'tpl_001', name: 'Daily Travel Allowance', code: 'DTA-001' }, { id: 'tpl_003', name: 'Monthly Transport', code: 'MTR-001' }] },
  { id: 'user_010', name: 'Wong Jia Wei', code: 'EMP010', email: 'jiawei@company.com', department: 'IT', departmentId: 'dept_it', branch: 'HQ', branchId: 'branch_hq', position: 'IT Manager', positionId: 'pos_itm', jobGrade: 8, employmentType: 'PERMANENT', isConfirmed: true, joinDate: '2017-03-01', tenureMonths: 93, tags: [], assignedTemplates: [] },
  { id: 'user_011', name: 'Fatimah Zahra', code: 'CON001', email: 'fatimah@company.com', department: 'Marketing', departmentId: 'dept_marketing', branch: 'HQ', branchId: 'branch_hq', position: 'Content Writer', positionId: 'pos_cw', jobGrade: 3, employmentType: 'CONTRACT', isConfirmed: true, joinDate: '2024-01-15', tenureMonths: 11, tags: [], assignedTemplates: [] },
  { id: 'user_012', name: 'Arjun Singh', code: 'INT001', email: 'arjun@company.com', department: 'Engineering', departmentId: 'dept_eng', branch: 'HQ', branchId: 'branch_hq', position: 'Intern', positionId: 'pos_int', jobGrade: 1, employmentType: 'INTERN', isConfirmed: false, joinDate: '2024-09-01', tenureMonths: 3, tags: [], assignedTemplates: [] }
];

const MOCK_LOOKUP_DATA: LookupData = {
  departments: [
    { id: 'dept_eng', name: 'Engineering' },
    { id: 'dept_sales', name: 'Sales' },
    { id: 'dept_marketing', name: 'Marketing' },
    { id: 'dept_hr', name: 'Human Resources' },
    { id: 'dept_finance', name: 'Finance' },
    { id: 'dept_it', name: 'Information Technology' },
    { id: 'dept_ops', name: 'Operations' }
  ],
  branches: [
    { id: 'branch_hq', name: 'Headquarters (KL)' },
    { id: 'branch_a', name: 'Branch A (Penang)' },
    { id: 'branch_b', name: 'Branch B (Johor)' },
    { id: 'branch_c', name: 'Branch C (Sabah)' }
  ],
  jobGrades: [
    { id: '1', name: 'Grade 1 - Intern' },
    { id: '2', name: 'Grade 2 - Junior' },
    { id: '3', name: 'Grade 3 - Associate' },
    { id: '4', name: 'Grade 4 - Executive' },
    { id: '5', name: 'Grade 5 - Senior Executive' },
    { id: '6', name: 'Grade 6 - Assistant Manager' },
    { id: '7', name: 'Grade 7 - Manager' },
    { id: '8', name: 'Grade 8 - Senior Manager' },
    { id: '9', name: 'Grade 9 - Director' },
    { id: '10', name: 'Grade 10 - C-Level' }
  ],
  employmentTypes: [
    { id: 'PERMANENT', name: 'Permanent' },
    { id: 'CONTRACT', name: 'Contract' },
    { id: 'PROBATION', name: 'Probation' },
    { id: 'INTERN', name: 'Intern' },
    { id: 'PART_TIME', name: 'Part-Time' }
  ]
};

// Flag to enable mock mode (set to true for development)
const USE_MOCK_DATA = true;

// Simulate API delay
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// CUSTOM ERROR CLASS
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public response: string
  ) {
    super(`API Error: ${statusCode}`);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isValidationError(): boolean {
    return this.statusCode === 422;
  }

  get isConflict(): boolean {
    return this.statusCode === 409;
  }
}

// -----------------------------------------------------------------------------
// ALLOWANCE TEMPLATE SERVICE
// -----------------------------------------------------------------------------

export const allowanceTemplateService = {
  // ---------------------------------------------------------------------------
  // TEMPLATE CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get paginated list of allowance templates
   */
  async getTemplates(
    params: AllowanceTemplateListRequest = {}
  ): Promise<PaginatedResponse<AllowanceTemplate>> {
    if (USE_MOCK_DATA) {
      await mockDelay(300);

      let filtered = [...MOCK_TEMPLATES];

      // Apply search filter
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(t =>
          t.name.toLowerCase().includes(search) ||
          t.code.toLowerCase().includes(search)
        );
      }

      // Apply type filter
      if (params.type) {
        filtered = filtered.filter(t => t.type === params.type);
      }

      // Apply status filter
      if (params.status) {
        filtered = filtered.filter(t => t.status === params.status);
      }

      // Apply sorting
      const sortField = params.sortBy || 'updatedAt';
      const sortOrder = params.sortOrder || 'desc';
      filtered.sort((a, b) => {
        const aVal = a[sortField as keyof AllowanceTemplate];
        const bVal = b[sortField as keyof AllowanceTemplate];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const paginatedData = filtered.slice(start, start + limit);

      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit)
        }
      };
    }

    return httpClient.get<PaginatedResponse<AllowanceTemplate>>(
      API_ENDPOINTS.templates,
      params as Record<string, unknown>
    );
  },

  /**
   * Get single template by ID
   */
  async getTemplate(id: string): Promise<AllowanceTemplate> {
    if (USE_MOCK_DATA) {
      await mockDelay(200);
      const template = MOCK_TEMPLATES.find(t => t.id === id);
      if (!template) {
        throw new ApiError(404, 'Template not found');
      }
      return { ...template };
    }
    return httpClient.get<AllowanceTemplate>(API_ENDPOINTS.template(id));
  },

  /**
   * Create new template
   */
  async createTemplate(
    data: CreateAllowanceTemplateRequest
  ): Promise<AllowanceTemplate> {
    return httpClient.post<AllowanceTemplate>(API_ENDPOINTS.templates, data);
  },

  /**
   * Update existing template
   */
  async updateTemplate(
    id: string,
    data: UpdateAllowanceTemplateRequest
  ): Promise<AllowanceTemplate> {
    return httpClient.put<AllowanceTemplate>(API_ENDPOINTS.template(id), data);
  },

  /**
   * Soft delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await httpClient.delete<void>(API_ENDPOINTS.template(id));
  },

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string): Promise<AllowanceTemplate> {
    return httpClient.post<AllowanceTemplate>(API_ENDPOINTS.duplicate(id));
  },

  /**
   * Archive template
   */
  async archiveTemplate(id: string): Promise<AllowanceTemplate> {
    return httpClient.post<AllowanceTemplate>(API_ENDPOINTS.archive(id));
  },

  /**
   * Unarchive template
   */
  async unarchiveTemplate(id: string): Promise<AllowanceTemplate> {
    return httpClient.post<AllowanceTemplate>(API_ENDPOINTS.unarchive(id));
  },

  /**
   * Check if template code is unique
   */
  async checkCodeUnique(
    code: string,
    excludeId?: string
  ): Promise<{ isUnique: boolean }> {
    if (USE_MOCK_DATA) {
      await mockDelay(200);
      const existing = MOCK_TEMPLATES.find(t =>
        t.code.toLowerCase() === code.toLowerCase() && t.id !== excludeId
      );
      return { isUnique: !existing };
    }
    return httpClient.get<{ isUnique: boolean }>(API_ENDPOINTS.checkCode, {
      code,
      excludeId
    });
  },

  // ---------------------------------------------------------------------------
  // CRITERIA OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Preview eligible users based on criteria
   */
  async previewCriteria(
    templateId: string | null,
    criteria: CriteriaPreviewRequest
  ): Promise<CriteriaPreviewResponse> {
    if (USE_MOCK_DATA) {
      await mockDelay(400);
      // Simple mock: return random subset of users
      const eligibleUsers = MOCK_USERS.slice(0, Math.floor(Math.random() * 8) + 3);
      return {
        eligibleCount: eligibleUsers.length,
        eligibleUserIds: eligibleUsers.map(u => u.id),
        eligibleUsers: eligibleUsers
      };
    }

    // For new templates (no ID yet), use a special endpoint
    const url = templateId
      ? API_ENDPOINTS.criteriaPreview(templateId)
      : `${API_ENDPOINTS.templates}/criteria/preview`;

    return httpClient.post<CriteriaPreviewResponse>(url, criteria);
  },

  // ---------------------------------------------------------------------------
  // ASSIGNMENT OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get assignments for a template
   */
  async getAssignments(
    templateId: string,
    params: AssignmentListRequest = {}
  ): Promise<PaginatedResponse<AllowanceAssignment>> {
    return httpClient.get<PaginatedResponse<AllowanceAssignment>>(
      API_ENDPOINTS.assignments(templateId),
      params as Record<string, unknown>
    );
  },

  /**
   * Bulk assign users to template
   */
  async assignUsers(
    templateId: string,
    data: BulkAssignRequest
  ): Promise<{ assigned: number; skipped: number; assignments: AllowanceAssignment[] }> {
    return httpClient.post(API_ENDPOINTS.assignments(templateId), data);
  },

  /**
   * Remove assignment
   */
  async removeAssignment(templateId: string, assignmentId: string): Promise<void> {
    await httpClient.delete<void>(API_ENDPOINTS.assignment(templateId, assignmentId));
  },

  /**
   * Bulk remove assignments
   */
  async removeAssignments(
    templateId: string,
    assignmentIds: string[]
  ): Promise<{ removed: number }> {
    return httpClient.post(`${API_ENDPOINTS.assignments(templateId)}/bulk-remove`, {
      assignmentIds
    });
  },

  // ---------------------------------------------------------------------------
  // LOOKUP DATA
  // ---------------------------------------------------------------------------

  /**
   * Get lookup data for dropdowns (departments, branches, etc.)
   */
  async getLookupData(): Promise<LookupData> {
    if (USE_MOCK_DATA) {
      await mockDelay(200);
      return { ...MOCK_LOOKUP_DATA };
    }
    return httpClient.get<LookupData>(API_ENDPOINTS.lookups);
  },

  /**
   * Get users for manual assignment
   */
  async getUsers(params: {
    search?: string;
    page?: number;
    limit?: number;
    excludeTemplateId?: string; // Exclude already assigned
  }): Promise<PaginatedResponse<User>> {
    if (USE_MOCK_DATA) {
      await mockDelay(300);

      let filtered = [...MOCK_USERS];

      // Apply search filter
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(u =>
          u.name.toLowerCase().includes(search) ||
          u.code.toLowerCase().includes(search) ||
          u.department.toLowerCase().includes(search)
        );
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const paginatedData = filtered.slice(start, start + limit);

      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit)
        }
      };
    }

    return httpClient.get<PaginatedResponse<User>>(
      API_ENDPOINTS.users,
      params as Record<string, unknown>
    );
  },

  /**
   * Preview eligible users based on criteria (mock implementation)
   */
  async previewCriteriaMock(
    criteria: CriteriaPreviewRequest
  ): Promise<CriteriaPreviewResponse> {
    await mockDelay(400);

    // Simple mock: return random subset of users based on criteria complexity
    const eligibleUsers = MOCK_USERS.slice(0, Math.floor(Math.random() * 8) + 3);

    return {
      eligibleCount: eligibleUsers.length,
      eligibleUserIds: eligibleUsers.map(u => u.id),
      eligibleUsers: eligibleUsers
    };
  }
};

// -----------------------------------------------------------------------------
// API CONTRACT DOCUMENTATION
// -----------------------------------------------------------------------------

/**
 * ============================================================================
 * REST API CONTRACT
 * ============================================================================
 *
 * Base URL: /api
 *
 * ---------------------------------------------------------------------------
 * 1. GET /allowance-templates
 * ---------------------------------------------------------------------------
 * Description: List all templates with pagination and filtering
 *
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 *   - search: string (searches name, code)
 *   - type: 'DAILY' | 'MONTHLY' | 'ONE_OFF'
 *   - status: 'ACTIVE' | 'ARCHIVED'
 *   - sortBy: string (default: 'updatedAt')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 *
 * Response 200:
 * {
 *   "data": [
 *     {
 *       "id": "tpl_123",
 *       "name": "Transport Allowance",
 *       "code": "TRANS-001",
 *       "description": "Monthly transport allowance",
 *       "type": "MONTHLY",
 *       "amountMode": "FIXED",
 *       "amount": 500,
 *       "currency": "MYR",
 *       "taxable": true,
 *       "prorate": true,
 *       "effectiveStart": "2024-01-01",
 *       "effectiveEnd": null,
 *       "status": "ACTIVE",
 *       "assignmentCount": 45,
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "createdBy": "admin",
 *       "updatedAt": "2024-03-15T10:30:00Z",
 *       "updatedBy": "admin"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 25,
 *     "totalPages": 3
 *   }
 * }
 *
 * ---------------------------------------------------------------------------
 * 2. POST /allowance-templates
 * ---------------------------------------------------------------------------
 * Description: Create a new template
 *
 * Request Body:
 * {
 *   "name": "Transport Allowance",
 *   "code": "TRANS-001",
 *   "description": "Monthly transport allowance",
 *   "type": "MONTHLY",
 *   "amountMode": "FIXED",
 *   "amount": 500,
 *   "currency": "MYR",
 *   "taxable": true,
 *   "prorate": true,
 *   "prorateByJoinDate": true,
 *   "prorateByLeaveDate": false,
 *   "effectiveStart": "2024-01-01",
 *   "effectiveEnd": null,
 *   "status": "ACTIVE",
 *   "criteria": {
 *     "groupOperator": "OR",
 *     "groups": [
 *       {
 *         "id": "grp_1",
 *         "operator": "AND",
 *         "rules": [
 *           {
 *             "id": "rule_1",
 *             "field": "DEPARTMENT",
 *             "operator": "IN",
 *             "value": ["dept_1", "dept_2"]
 *           },
 *           {
 *             "id": "rule_2",
 *             "field": "JOB_GRADE",
 *             "operator": "GREATER_THAN_OR_EQUALS",
 *             "value": 3
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * Response 201:
 * {
 *   "id": "tpl_124",
 *   "name": "Transport Allowance",
 *   ... (full template object)
 * }
 *
 * Response 409 (Code conflict):
 * {
 *   "error": "DUPLICATE_CODE",
 *   "message": "Template with code TRANS-001 already exists"
 * }
 *
 * Response 422 (Validation error):
 * {
 *   "error": "VALIDATION_ERROR",
 *   "details": [
 *     { "field": "name", "message": "Name is required" },
 *     { "field": "amount", "message": "Amount must be greater than 0" }
 *   ]
 * }
 *
 * ---------------------------------------------------------------------------
 * 3. GET /allowance-templates/:id
 * ---------------------------------------------------------------------------
 * Description: Get single template with full details
 *
 * Response 200:
 * {
 *   "id": "tpl_123",
 *   "name": "Transport Allowance",
 *   ... (full template object with criteria)
 * }
 *
 * Response 404:
 * {
 *   "error": "NOT_FOUND",
 *   "message": "Template not found"
 * }
 *
 * ---------------------------------------------------------------------------
 * 4. PUT /allowance-templates/:id
 * ---------------------------------------------------------------------------
 * Description: Update existing template
 *
 * Request Body: Same as POST (partial updates allowed)
 *
 * Response 200: Updated template object
 *
 * ---------------------------------------------------------------------------
 * 5. DELETE /allowance-templates/:id
 * ---------------------------------------------------------------------------
 * Description: Soft delete template
 *
 * Response 204: No content
 *
 * ---------------------------------------------------------------------------
 * 6. POST /allowance-templates/:id/duplicate
 * ---------------------------------------------------------------------------
 * Description: Duplicate a template (creates new with "_copy" suffix)
 *
 * Response 201:
 * {
 *   "id": "tpl_125",
 *   "name": "Transport Allowance (Copy)",
 *   "code": "TRANS-001-COPY",
 *   "status": "ACTIVE",
 *   ... (rest of duplicated template)
 * }
 *
 * ---------------------------------------------------------------------------
 * 7. POST /allowance-templates/:id/archive
 * ---------------------------------------------------------------------------
 * Description: Archive an active template
 *
 * Response 200: Updated template with status: "ARCHIVED"
 *
 * ---------------------------------------------------------------------------
 * 8. POST /allowance-templates/:id/unarchive
 * ---------------------------------------------------------------------------
 * Description: Restore archived template to active
 *
 * Response 200: Updated template with status: "ACTIVE"
 *
 * ---------------------------------------------------------------------------
 * 9. POST /allowance-templates/:id/criteria/preview
 * ---------------------------------------------------------------------------
 * Description: Preview eligible users based on criteria
 *
 * Request Body:
 * {
 *   "criteria": {
 *     "groupOperator": "AND",
 *     "groups": [...]
 *   }
 * }
 *
 * Response 200:
 * {
 *   "eligibleCount": 45,
 *   "eligibleUserIds": ["user_1", "user_2", ...],
 *   "eligibleUsers": [
 *     {
 *       "id": "user_1",
 *       "name": "John Doe",
 *       "code": "EMP001",
 *       "department": "Engineering",
 *       ...
 *     }
 *   ]
 * }
 *
 * ---------------------------------------------------------------------------
 * 10. GET /allowance-templates/:id/assignments
 * ---------------------------------------------------------------------------
 * Description: List all assignments for a template
 *
 * Query Parameters:
 *   - page: number
 *   - limit: number
 *   - search: string (searches user name, code)
 *
 * Response 200:
 * {
 *   "data": [
 *     {
 *       "id": "asgn_1",
 *       "templateId": "tpl_123",
 *       "userId": "user_1",
 *       "userName": "John Doe",
 *       "userCode": "EMP001",
 *       "userDepartment": "Engineering",
 *       "userPosition": "Senior Engineer",
 *       "effectiveStartOverride": null,
 *       "effectiveEndOverride": null,
 *       "amountOverride": null,
 *       "assignedAt": "2024-03-15T10:30:00Z",
 *       "assignedBy": "admin",
 *       "assignmentSource": "CRITERIA"
 *     }
 *   ],
 *   "meta": { ... }
 * }
 *
 * ---------------------------------------------------------------------------
 * 11. POST /allowance-templates/:id/assignments
 * ---------------------------------------------------------------------------
 * Description: Bulk assign users to template
 *
 * Request Body:
 * {
 *   "userIds": ["user_1", "user_2", "user_3"],
 *   "effectiveStartOverride": "2024-04-01",
 *   "effectiveEndOverride": null,
 *   "source": "MANUAL"
 * }
 *
 * Response 201:
 * {
 *   "assigned": 3,
 *   "skipped": 0,
 *   "assignments": [...]
 * }
 *
 * Response 200 (partial success with duplicates):
 * {
 *   "assigned": 2,
 *   "skipped": 1,
 *   "assignments": [...],
 *   "skippedUserIds": ["user_1"]
 * }
 *
 * ---------------------------------------------------------------------------
 * 12. DELETE /allowance-templates/:id/assignments/:assignmentId
 * ---------------------------------------------------------------------------
 * Description: Remove single assignment
 *
 * Response 204: No content
 *
 * ---------------------------------------------------------------------------
 * 13. GET /allowance-templates/check-code
 * ---------------------------------------------------------------------------
 * Description: Check if template code is unique
 *
 * Query Parameters:
 *   - code: string (required)
 *   - excludeId: string (optional, for edit mode)
 *
 * Response 200:
 * {
 *   "isUnique": true
 * }
 *
 */

export default allowanceTemplateService;

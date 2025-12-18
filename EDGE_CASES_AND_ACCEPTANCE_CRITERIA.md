# Allowance Module - Edge Cases & Acceptance Criteria

## Table of Contents
1. [Edge Cases](#edge-cases)
2. [Acceptance Criteria](#acceptance-criteria)
3. [UI/UX Flow Summary](#uiux-flow-summary)
4. [Component Tree](#component-tree)
5. [State Management Decision](#state-management-decision)

---

## Edge Cases

### Template Creation/Editing

| # | Edge Case | Expected Behavior | Test Steps |
|---|-----------|-------------------|------------|
| 1 | **Duplicate code on create** | Show inline error "Code already exists", disable Next button | Enter existing code, blur field |
| 2 | **Code uniqueness during edit** | Should exclude current template from uniqueness check | Edit existing template, keep same code |
| 3 | **Empty formula expression** | Show validation error when amountMode is FORMULA | Select Formula mode, leave expression empty, click Next |
| 4 | **Effective end date before start** | Show validation error "End date must be after start date" | Select end date earlier than start date |
| 5 | **ONE_OFF without payout date/month** | Show validation error requiring at least one | Select ONE_OFF type, leave both payout fields empty |
| 6 | **Amount = 0 with FIXED mode** | Show validation error "Amount must be greater than 0" | Enter 0 in amount field |
| 7 | **Navigate away with unsaved changes** | Show confirmation dialog with Save/Discard/Cancel | Make changes, click back button |
| 8 | **Refresh page during creation** | Lose unsaved data (expected behavior, optional: localStorage draft) | Fill form partially, refresh |
| 9 | **Special characters in code** | Only allow alphanumeric, hyphens, underscores | Try entering `@#$%` in code field |
| 10 | **Very long name/description** | Truncate in table view, show full in details | Enter 200+ character name |

### Criteria Builder

| # | Edge Case | Expected Behavior | Test Steps |
|---|-----------|-------------------|------------|
| 11 | **Empty criteria group** | Allow (means no restrictions for that group) or require at least one rule | Add group, don't add rules |
| 12 | **All criteria groups empty** | Show "All users eligible" message | Create template with no criteria |
| 13 | **Conflicting criteria (impossible)** | Preview shows 0 eligible, allow save but warn | Set `Dept IN [A] AND Dept IN [B]` |
| 14 | **BETWEEN with min > max** | Show validation error | Enter min=100, max=50 in job grade range |
| 15 | **Empty multiselect value** | Show validation error "Select at least one value" | Add rule, don't select any values |
| 16 | **Large number of criteria rules** | Performance should remain acceptable | Add 20+ rules, preview |
| 17 | **Preview with no API response** | Show error toast, keep last valid preview | Simulate network error |
| 18 | **Criteria references deleted department** | Backend should handle gracefully, show "unknown" | Delete department after criteria created |

### User Assignment

| # | Edge Case | Expected Behavior | Test Steps |
|---|-----------|-------------------|------------|
| 19 | **Assign already assigned user** | Skip silently, show "X assigned, Y skipped" message | Try to assign same user twice |
| 20 | **Bulk assign 1000+ users** | Should handle with loading indicator, paginated response | Use criteria matching large group |
| 21 | **Unassign last user** | Allow (template can have 0 assignments) | Remove all assignments |
| 22 | **Search returns no users** | Show empty state with helpful message | Search for gibberish string |
| 23 | **Assign user who leaves company** | Backend should validate, assignment fails gracefully | Time-based edge case |
| 24 | **Override effective dates** | Per-user dates should take precedence over template | Set override, verify in payroll |
| 25 | **Criteria changes after assignment** | Existing assignments remain, new criteria for future | Change criteria, check existing assignments |

### Template Lifecycle

| # | Edge Case | Expected Behavior | Test Steps |
|---|-----------|-------------------|------------|
| 26 | **Archive active template** | Confirmation dialog, stop future payments, keep history | Click archive on active template |
| 27 | **Delete template with assignments** | Soft delete only, assignments preserved for audit | Try delete, verify data still accessible in DB |
| 28 | **Duplicate archived template** | Create new DRAFT copy, clear assignments | Duplicate archived template |
| 29 | **Reactivate archived template** | Set to DRAFT, require review before ACTIVE | Unarchive, check status |
| 30 | **Edit active template** | Should require re-confirmation or version control | Edit active template |
| 31 | **Template expires (effectiveEnd reached)** | Auto-archive or show as "Expired" status | Wait for end date |

### Permission Edge Cases

| # | Edge Case | Expected Behavior | Test Steps |
|---|-----------|-------------------|------------|
| 32 | **View-only user tries to edit** | All edit buttons disabled, show tooltip "No permission" | Login as viewer, try edit |
| 33 | **Permission revoked mid-session** | Next API call fails, redirect to list with error | Admin removes permission while user editing |
| 34 | **Non-admin accesses URL directly** | 403 error or redirect to unauthorized page | Paste edit URL as non-admin |

---

## Acceptance Criteria

### AC-001: Template List Page
- [ ] Page loads with paginated list of templates (default 10 per page)
- [ ] Search filters by name and code (debounced 300ms)
- [ ] Type filter shows only selected type
- [ ] Status filter shows only selected status
- [ ] Clicking "Clear" resets all filters
- [ ] Table columns are sortable (click header)
- [ ] Row action menu shows View/Edit/Duplicate/Archive/Delete
- [ ] "Create Template" button navigates to wizard
- [ ] Empty state shown when no templates exist
- [ ] Loading skeleton shown during data fetch

### AC-002: Template Creation Wizard
- [ ] Wizard has 4 steps: Info, Criteria, Assign, Review
- [ ] Step indicators show current/completed/upcoming status
- [ ] Can navigate back to completed steps by clicking indicator
- [ ] Cannot skip ahead without completing current step
- [ ] "Next" disabled until current step validates
- [ ] "Save as Draft" available at any step
- [ ] "Back" returns to previous step preserving data
- [ ] Form state preserved when navigating between steps

### AC-003: Template Info Form (Step 1)
- [ ] Name field: required, 3-100 chars
- [ ] Code field: required, unique, 2-50 chars, alphanumeric + hyphens
- [ ] Code uniqueness checked async with loading indicator
- [ ] Type selection via card UI (Daily/Monthly/One-off)
- [ ] Amount mode toggle (Fixed/Formula)
- [ ] Currency dropdown with common currencies
- [ ] Taxable checkbox (default: true)
- [ ] Type-specific fields show/hide based on selection
- [ ] DAILY: includeNonWorkingDays option
- [ ] MONTHLY: prorateByJoinDate, prorateByLeaveDate options
- [ ] ONE_OFF: payoutDate or payoutMonth required
- [ ] Effective dates: start required, end optional
- [ ] End date must be after start date

### AC-004: Criteria Builder (Step 2)
- [ ] Initially empty with "Add Criteria" button
- [ ] Add Group creates new criteria group with one rule
- [ ] Group shows AND/OR toggle for internal rules
- [ ] Global operator shows when multiple groups exist
- [ ] Rule row has: field dropdown, operator dropdown, value input
- [ ] Value input type changes based on field (multiselect, number, tags)
- [ ] "Preview Eligible Users" button shows count and sample
- [ ] Rules can be added/removed within group
- [ ] Groups can be removed entirely
- [ ] Validation errors shown per rule
- [ ] Criteria description text updates live

### AC-005: User Assignment (Step 3)
- [ ] Two tabs: Manual Selection, By Criteria
- [ ] Manual: searchable user table with multi-select
- [ ] Manual: "Select All Visible" selects current page
- [ ] Manual: Selection count badge updates live
- [ ] By Criteria: shows "Go to Criteria" if none defined
- [ ] By Criteria: shows criteria summary and Preview button
- [ ] By Criteria: "Assign All Eligible" assigns preview users
- [ ] Optional effective date override fields
- [ ] Already assigned users not shown in manual selection

### AC-006: Review & Save (Step 4)
- [ ] Summary of Template Info with Edit link
- [ ] Summary of Criteria with Edit link
- [ ] Summary of Assignments (count and mode)
- [ ] Warnings shown for incomplete data
- [ ] "Save & Activate" validates all and saves as ACTIVE
- [ ] Success redirects to details page

### AC-007: Template Details Page
- [ ] Header shows name, code, type, status
- [ ] Tab navigation: Info, Criteria, Assignments, Audit
- [ ] Info tab shows all template fields
- [ ] Criteria tab shows rules in readable format
- [ ] Assignments tab shows paginated user list
- [ ] Assignment table has search and remove action
- [ ] Audit tab shows created/updated timestamps
- [ ] Action menu: Edit, Duplicate, Archive, Delete

### AC-008: Duplicate Template
- [ ] Creates copy with " (Copy)" suffix on name
- [ ] Code gets "-COPY" suffix
- [ ] Status reset to DRAFT
- [ ] Criteria copied, assignments NOT copied
- [ ] Redirects to edit new template

### AC-009: Archive/Unarchive
- [ ] Archive shows confirmation dialog
- [ ] Archived templates cannot be edited
- [ ] Archived templates show in list with filter
- [ ] Unarchive sets status to DRAFT

### AC-010: Delete Template
- [ ] Shows confirmation dialog with warning
- [ ] Soft delete (data preserved)
- [ ] Removed from list
- [ ] Audit trail preserved

### AC-011: Validation & Error Handling
- [ ] All API errors show toast notification
- [ ] Network errors handled gracefully
- [ ] Form validation prevents invalid submissions
- [ ] Confirmation dialogs for destructive actions
- [ ] Loading states during async operations

### AC-012: Responsive Design
- [ ] Works on desktop (1200px+)
- [ ] Works on tablet (768px-1199px)
- [ ] Works on mobile (< 768px)
- [ ] Tables scroll horizontally on small screens
- [ ] Wizard steps stack vertically on mobile

---

## UI/UX Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALLOWANCE MODULE FLOWS                        │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════╗
║  FLOW 1: VIEW TEMPLATES                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  /hrms/allowances/templates                                        ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [Search...] [Type ▼] [Status ▼]              [Create Template]│ ║
║  ├──────────────────────────────────────────────────────────────┤ ║
║  │ Name         | Type    | Amount   | Status  | Actions        │ ║
║  │──────────────|─────────|──────────|─────────|────────────────│ ║
║  │ Transport    | Monthly | RM500/mo | Active  | [⋮]            │ ║
║  │ Meal         | Daily   | RM20/day | Draft   | [⋮]            │ ║
║  │ Bonus        | One-off | RM1000   | Archived| [⋮]            │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  FLOW 2: CREATE TEMPLATE (WIZARD)                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Step 1 (Info) → Step 2 (Criteria) → Step 3 (Assign) → Step 4     ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │  ① Template Info  ② Criteria  ③ Assign Users  ④ Review       │ ║
║  │  ━━━━━━━━━━━━━━━  ─────────── ────────────── ─────────────── │ ║
║  │                                                               │ ║
║  │  Name:        [Transport Allowance___________]                │ ║
║  │  Code:        [TRANS-001____] ✓                               │ ║
║  │                                                               │ ║
║  │  Type: ┌─────────┐ ┌─────────┐ ┌─────────┐                    │ ║
║  │        │ ○ Daily │ │ ● Month │ │ ○ One-  │                    │ ║
║  │        │         │ │  -ly  ✓ │ │   off   │                    │ ║
║  │        └─────────┘ └─────────┘ └─────────┘                    │ ║
║  │                                                               │ ║
║  │  Amount: [RM 500.00_____]  ☑ Taxable  ☑ Prorate               │ ║
║  │                                                               │ ║
║  │  Effective: [01 Jan 2024] → [__________]                      │ ║
║  │                                                               │ ║
║  │                           [Save Draft]  [Next →]              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  FLOW 3: CRITERIA BUILDER                                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │  Eligibility Criteria              [Preview Eligible Users]   │ ║
║  │                                                               │ ║
║  │  Groups combined with: [AND ▼]                                │ ║
║  │                                                               │ ║
║  │  ┌─ Group 1 ────────────────────────────────────────────[×]┐ │ ║
║  │  │ Rules match: [AND ▼]                                     │ │ ║
║  │  │                                                          │ │ ║
║  │  │ [Department ▼] [is any of ▼] [Engineering, Sales ▼] [×]  │ │ ║
║  │  │        AND                                               │ │ ║
║  │  │ [Job Grade ▼] [is at least ▼] [3_______] [×]             │ │ ║
║  │  │                                                          │ │ ║
║  │  │ [+ Add Rule]                                             │ │ ║
║  │  └──────────────────────────────────────────────────────────┘ │ ║
║  │                                                               │ ║
║  │  [+ Add Another Group]                                        │ ║
║  │                                                               │ ║
║  │  ┌─ Preview Results ────────────────────────────────────────┐ │ ║
║  │  │  45 Eligible Employees    [Assign All Eligible →]        │ │ ║
║  │  │  Sample: John, Sarah, Mike +42 more                      │ │ ║
║  │  └──────────────────────────────────────────────────────────┘ │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════╗
║  FLOW 4: ASSIGN USERS                                              ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [Manual Selection] [By Criteria]                              │ ║
║  │ ━━━━━━━━━━━━━━━━━  ────────────                               │ ║
║  │                                                               │ ║
║  │ [Search users...________]    [Select All] [Clear (15)]        │ ║
║  │                                                               │ ║
║  │ ┌─────────────────────────────────────────────────────────┐  │ ║
║  │ │ ☑ │ EMP001 │ John Doe     │ Engineering │ Developer    │  │ ║
║  │ │ ☑ │ EMP002 │ Sarah Smith  │ Engineering │ Designer     │  │ ║
║  │ │ ☐ │ EMP003 │ Mike Brown   │ Sales       │ Manager      │  │ ║
║  │ │ ☑ │ EMP004 │ Lisa White   │ HR          │ Admin        │  │ ║
║  │ └─────────────────────────────────────────────────────────┘  │ ║
║  │                                                               │ ║
║  │ ┌─ 15 users selected ────────────────────────────────────┐   │ ║
║  │ │  These users will be assigned when you save.           │   │ ║
║  │ └────────────────────────────────────────────────────────┘   │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Component Tree

```
src/modules/allowance/
├── pages/
│   ├── AllowanceTemplateListPage.vue      # Main list with table
│   ├── AllowanceTemplateFormPage.vue      # Create/Edit with wizard
│   └── AllowanceTemplateDetailsPage.vue   # Read-only details view
│
├── components/
│   ├── wizard/
│   │   ├── TemplateInfoForm.vue           # Step 1: Basic info form
│   │   └── TemplateReview.vue             # Step 4: Review summary
│   │
│   ├── criteria/
│   │   ├── CriteriaBuilder.vue            # Step 2: Main criteria UI
│   │   ├── CriteriaGroup.vue              # Single criteria group
│   │   └── CriteriaRuleRow.vue            # Single rule row
│   │
│   └── assignment/
│       └── AssignUsersPanel.vue           # Step 3: User assignment
│
├── composables/
│   ├── index.ts                           # Export all composables
│   ├── useAllowanceTemplates.ts           # List CRUD operations
│   ├── useCriteriaBuilder.ts              # Criteria state & preview
│   ├── useAssignments.ts                  # Assignment operations
│   └── useFormValidation.ts               # Form validation logic
│
├── services/
│   └── allowanceTemplateService.ts        # API calls
│
├── types/
│   └── index.ts                           # TypeScript interfaces
│
├── constants/
│   └── index.ts                           # Enums, options, labels
│
└── router/
    └── index.ts                           # Route definitions
```

---

## State Management Decision

### Why Composables over Pinia?

For this module, we chose **Composables + Local State** over Pinia for these reasons:

1. **Module Isolation**: Allowance module is self-contained; doesn't need cross-module state sharing.

2. **Simpler Mental Model**: Each composable manages its own state, making it easier to understand data flow.

3. **Better TypeScript Experience**: Direct refs with type inference vs. Pinia store typing complexity.

4. **No Global State Pollution**: State is scoped to component lifecycle, automatically cleaned up.

5. **Testing Simplicity**: Composables can be tested in isolation without store setup.

### When to Use Pinia Instead

Consider Pinia if:
- Multiple modules need to access allowance data
- Deep nested components need shared state without prop drilling
- DevTools state inspection becomes critical
- State needs to persist across route changes (beyond this module)

### Current Composable Responsibilities

| Composable | Responsibility |
|------------|----------------|
| `useAllowanceTemplates` | List fetching, CRUD operations, filtering, pagination |
| `useCriteriaBuilder` | Criteria groups/rules, preview, validation |
| `useAssignments` | User selection, bulk assign, assignment management |
| `useFormValidation` | Field validation, async code check, step validation |

---

## Testing Checklist

### Unit Tests
- [ ] All composable methods
- [ ] Validation logic
- [ ] Format utilities

### Integration Tests
- [ ] Wizard step navigation
- [ ] Form submission flows
- [ ] Criteria preview API integration

### E2E Tests
- [ ] Complete template creation flow
- [ ] Edit existing template
- [ ] Archive/restore cycle
- [ ] User assignment both modes

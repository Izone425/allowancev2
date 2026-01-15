// ============================================================================
// ALLOWANCE MODULE - MAIN ENTRY POINT
// ============================================================================

// Routes
export { default as allowanceRoutes, ROUTE_NAMES } from './router';

// Types
export * from './types';

// Constants
export * from './constants';

// Services
export { allowanceTemplateService, ApiError } from './services/allowanceTemplateService';

// Composables
export {
  useAllowanceTemplates,
  useCriteriaBuilder,
  useAssignments,
  useFormValidation
} from './composables';

// Components (lazy loaded via router, but exported for direct use if needed)
export const AllowanceTemplateListPage = () =>
  import('./pages/AllowanceTemplateListPage.vue');
export const AllowanceTemplateFormPage = () =>
  import('./pages/AllowanceTemplateFormPage.vue');

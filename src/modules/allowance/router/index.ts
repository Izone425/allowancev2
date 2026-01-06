// ============================================================================
// ALLOWANCE MODULE - ROUTER CONFIGURATION
// ============================================================================

import type { RouteRecordRaw } from 'vue-router';

export const allowanceRoutes: RouteRecordRaw[] = [
  {
    path: '/hrms/allowances',
    name: 'allowances',
    redirect: '/hrms/allowances/templates',
    meta: {
      title: 'Allowances',
      breadcrumb: 'Allowances',
      requiresAuth: true,
      permissions: ['allowance.view']
    },
    children: [
      {
        path: 'templates',
        name: 'allowance-templates',
        component: () => import('../pages/AllowanceTemplateListPage.vue'),
        meta: {
          title: 'Allowance Templates',
          breadcrumb: 'Templates',
          requiresAuth: true,
          permissions: ['allowance.view']
        }
      },
      {
        path: 'templates/new',
        name: 'allowance-template-create',
        component: () => import('../pages/AllowanceTemplateFormPage.vue'),
        meta: {
          title: 'Create Allowance Template',
          breadcrumb: 'Create',
          requiresAuth: true,
          permissions: ['allowance.create']
        }
      },
      {
        path: 'templates/:id',
        name: 'allowance-template-details',
        component: () => import('../pages/AllowanceTemplateFormPage.vue'),
        props: (route) => ({ id: route.params.id, mode: 'view' }),
        meta: {
          title: 'Allowance Template Details',
          breadcrumb: 'Details',
          requiresAuth: true,
          permissions: ['allowance.view']
        }
      },
      {
        path: 'templates/:id/edit',
        name: 'allowance-template-edit',
        component: () => import('../pages/AllowanceTemplateFormPage.vue'),
        props: true,
        meta: {
          title: 'Edit Allowance Template',
          breadcrumb: 'Edit',
          requiresAuth: true,
          permissions: ['allowance.edit']
        }
      }
    ]
  }
];

// Route names for programmatic navigation
export const ROUTE_NAMES = {
  TEMPLATE_LIST: 'allowance-templates',
  TEMPLATE_CREATE: 'allowance-template-create',
  TEMPLATE_DETAILS: 'allowance-template-details',
  TEMPLATE_EDIT: 'allowance-template-edit'
} as const;

export default allowanceRoutes;

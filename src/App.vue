<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import AppLayout from './components/layout/AppLayout.vue';
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f0f4f8;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* PrimeVue Overrides for TimeTec Theme */
:root {
  --primary-color: #3b82f6;
  --primary-color-text: #ffffff;
  --surface-ground: #f0f4f8;
  --surface-card: #ffffff;
  --surface-border: #e2e8f0;
  --text-color: #1e293b;
  --text-color-secondary: #64748b;
}

/* Button Styling */
.p-button {
  border-radius: 0.5rem;
  font-weight: 500;
}

.p-button.p-button-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
}

.p-button.p-button-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

/* Card Styling */
.p-card {
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

/* DataTable Styling */
.p-datatable .p-datatable-header {
  background: transparent;
  border: none;
  padding: 0;
}

.p-datatable .p-datatable-thead > tr > th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-color: #e2e8f0;
}

.p-datatable .p-datatable-tbody > tr {
  transition: background-color 0.2s;
}

.p-datatable .p-datatable-tbody > tr:hover {
  background-color: #f8fafc !important;
}

.p-datatable .p-datatable-tbody > tr > td {
  border-color: #e2e8f0;
  padding: 1rem;
}

/* Dropdown Styling */
.p-dropdown {
  border-radius: 0.5rem;
  border-color: #e2e8f0;
}

.p-dropdown:hover {
  border-color: #cbd5e1;
}

.p-dropdown:focus,
.p-dropdown.p-focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Input Styling */
.p-inputtext {
  border-radius: 0.5rem;
  border-color: #e2e8f0;
}

.p-inputtext:hover {
  border-color: #cbd5e1;
}

.p-inputtext:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Tag Styling */
.p-tag {
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.75rem;
}

.p-tag.p-tag-success {
  background-color: #dcfce7;
  color: #166534;
}

.p-tag.p-tag-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.p-tag.p-tag-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.p-tag.p-tag-info {
  background-color: #dbeafe;
  color: #1e40af;
}

/* Toast Styling */
.p-toast .p-toast-message {
  border-radius: 0.5rem;
}

/* Tooltip Styling */
.p-tooltip .p-tooltip-text {
  border-radius: 0.375rem;
  font-size: 0.8rem;
}
</style>

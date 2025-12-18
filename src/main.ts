import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

import App from './App.vue';
import { allowanceRoutes } from './modules/allowance';

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/hrms/allowances/templates'
    },
    ...allowanceRoutes
  ]
});

// Create app
const app = createApp(App);

// Register PrimeVue
app.use(PrimeVue, { ripple: true });
app.use(ConfirmationService);
app.use(ToastService);
app.directive('tooltip', Tooltip);

// Register router
app.use(router);

// Mount
app.mount('#app');

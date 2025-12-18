<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo" v-if="!sidebarCollapsed">
          <span class="logo-text">time<span class="logo-highlight">Tec</span><sup>HR</sup></span>
        </div>
        <div class="logo-icon" v-else>
          <span class="logo-mini">T<span class="logo-highlight">T</span></span>
        </div>
        <button class="toggle-btn" @click="toggleSidebar">
          <i class="pi pi-bars"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <router-link to="/" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Dashboard' : ''">
            <i class="pi pi-home"></i>
            <span class="nav-label">Dashboard</span>
          </router-link>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Payroll</div>
          <router-link to="/hrms/allowances/templates" class="nav-item active" v-tooltip.right="sidebarCollapsed ? 'Allowances' : ''">
            <i class="pi pi-wallet"></i>
            <span class="nav-label">Allowances</span>
          </router-link>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Deductions' : ''">
            <i class="pi pi-minus-circle"></i>
            <span class="nav-label">Deductions</span>
          </a>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Payroll Run' : ''">
            <i class="pi pi-calculator"></i>
            <span class="nav-label">Payroll Run</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Organization</div>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Employees' : ''">
            <i class="pi pi-users"></i>
            <span class="nav-label">Employees</span>
          </a>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Departments' : ''">
            <i class="pi pi-sitemap"></i>
            <span class="nav-label">Departments</span>
          </a>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Branches' : ''">
            <i class="pi pi-building"></i>
            <span class="nav-label">Branches</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Time & Attendance</div>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Attendance' : ''">
            <i class="pi pi-clock"></i>
            <span class="nav-label">Attendance</span>
          </a>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Leave' : ''">
            <i class="pi pi-calendar"></i>
            <span class="nav-label">Leave</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Settings</div>
          <a href="#" class="nav-item" v-tooltip.right="sidebarCollapsed ? 'Settings' : ''">
            <i class="pi pi-cog"></i>
            <span class="nav-label">Settings</span>
          </a>
        </div>
      </nav>

      <!-- Collapse Toggle at Bottom -->
      <div class="sidebar-footer">
        <button class="collapse-toggle" @click="toggleSidebar" v-tooltip.right="sidebarCollapsed ? 'Expand' : ''">
          <i :class="sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"></i>
          <span class="nav-label">{{ sidebarCollapsed ? '' : 'Collapse' }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-toggle" @click="toggleSidebar">
            <i class="pi pi-bars"></i>
          </button>
          <div class="user-greeting">
            <i class="pi pi-sun greeting-icon"></i>
            <div class="greeting-text">
              <span class="user-name">ADMIN USER</span>
              <span class="date-time">{{ currentDateTime }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <button class="header-btn">
              <i class="pi pi-bell"></i>
              <span class="badge">3</span>
            </button>
            <button class="header-btn">
              <i class="pi pi-cog"></i>
            </button>
            <button class="header-btn">
              <i class="pi pi-power-off"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="main-content">
        <slot></slot>
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-overlay"
      @click="mobileMenuOpen = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const sidebarCollapsed = ref(false);
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

const currentDateTime = computed(() => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return now.toLocaleDateString('en-US', options);
});

function toggleSidebar() {
  if (isMobile.value) {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    // Save preference to localStorage
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value));
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 1024;
  if (isMobile.value) {
    sidebarCollapsed.value = true;
  }
}

onMounted(() => {
  // Restore sidebar state from localStorage
  const saved = localStorage.getItem('sidebarCollapsed');
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true';
  }

  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f0f4f8;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  height: 100vh;
  z-index: 1000;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 72px;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.logo-highlight {
  color: #fbbf24;
}

.logo-text sup {
  font-size: 0.6rem;
  color: #fbbf24;
  margin-left: 2px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-mini {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 0.5rem;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1.25rem 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.3s ease;
}

.sidebar.collapsed .nav-section-title {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background-color: rgba(59, 130, 246, 0.2);
  color: #fff;
  border-left-color: #3b82f6;
}

.nav-item i {
  font-size: 1.1rem;
  width: 24px;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  opacity: 1;
  transition: opacity 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

.sidebar.collapsed .nav-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.collapse-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.collapse-toggle i {
  font-size: 1rem;
  width: 24px;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar.collapsed .collapse-toggle {
  justify-content: center;
  padding: 0.75rem;
}

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-layout.sidebar-collapsed .main-wrapper {
  margin-left: 72px;
}

/* Top Header */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background-color: #fff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-toggle:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.greeting-icon {
  font-size: 1.5rem;
  color: #fbbf24;
}

.greeting-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.date-time {
  font-size: 0.8rem;
  color: #64748b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.header-btn .badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
  background-color: #ef4444;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 1.5rem;
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    width: 260px !important;
  }

  .sidebar.collapsed {
    width: 260px !important;
  }

  .app-layout.sidebar-collapsed .sidebar {
    transform: translateX(-100%);
  }

  .main-wrapper {
    margin-left: 0 !important;
  }

  .app-layout.sidebar-collapsed .main-wrapper {
    margin-left: 0;
  }

  .mobile-toggle {
    display: flex;
  }

  .toggle-btn {
    display: none;
  }

  /* When mobile menu is open */
  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-overlay.visible {
    display: block;
  }
}

@media (max-width: 640px) {
  .top-header {
    padding: 0.75rem 1rem;
  }

  .greeting-text {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>

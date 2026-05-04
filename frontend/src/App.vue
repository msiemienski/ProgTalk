<template>
  <div id="app">
    <header class="app-header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <SquareTerminal class="logo-mark" aria-hidden="true" />
          <h1>ProgTalk</h1>
        </router-link>
        
        <nav class="main-nav">
          <div class="nav-links">
            <router-link to="/">Strona Główna</router-link>
            <router-link to="/topics">Tematy</router-link>
            <router-link to="/about">O Projekcie</router-link>
          </div>
          
          <div class="nav-actions">
            <template v-if="isAuthenticated">
              <router-link v-if="isAdmin" to="/admin" class="admin-link">Panel Admina</router-link>
              <router-link to="/profile" class="profile-link">
                {{ user?.profile?.name || 'Profil' }}
              </router-link>
              <span v-if="isPending" class="pending-pill">Oczekuje</span>
              <button @click="handleLogout" class="btn-link">Wyloguj</button>
            </template>
            
            <template v-else>
              <router-link to="/login">Zaloguj się</router-link>
              <router-link to="/register" class="btn-register">Dołącz</router-link>
            </template>
          </div>
        </nav>
      </div>
    </header>
    
    <main class="app-main">
      <div :class="{ 'container': !isCenteredPage }">
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="route-loading-shell" aria-live="polite" aria-busy="true">
                <div class="route-loading-bar"></div>
              </div>
            </template>
          </Suspense>
        </router-view>
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <SquareTerminal class="logo-mark" aria-hidden="true" />
            <span>ProgTalk</span>
          </div>
          <p class="footer-note">Społeczność programistów dla rozmów o kodzie, projektach i praktyce.</p>
        </div>
        <div class="footer-links">
          <span class="footer-label">Nawigacja</span>
          <router-link to="/">Strona Główna</router-link>
          <router-link to="/topics">Tematy</router-link>
          <router-link to="/about">O Projekcie</router-link>
        </div>
      </div>
      <div class="container footer-bottom">
        <p>&copy; 2026 ProgTalk - Społeczność Programistów</p>
      </div>
    </footer>

    <ToastContainer />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';
import { SquareTerminal } from 'lucide-vue-next';
import authService from './services/authService';
import ToastContainer from './components/ToastContainer.vue';

const router = useRouter();
const route = useRoute();
const isAuthenticated = authService.isAuthenticated;
const user = authService.user;
const isAdmin = authService.isAdmin;
const isPending = computed(() => user.value?.status && user.value.status !== 'active');

const isCenteredPage = computed(() => {
  return ['Login', 'Register'].includes(route.name);
});

const handleLogout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style>
/* App-wide utility styles that don't belong in theme */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>

<style scoped>
.app-header {
  background: rgb(255 255 255 / 0.82);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgb(15 23 42 / 0.08);
  padding: 0.9rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.06);
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.logo-mark {
  width: 1.35rem;
  height: 1.35rem;
  color: var(--primary-color);
  stroke-width: 2.1;
}

.logo h1 {
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: var(--font-display);
  font-weight: 700;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.nav-links,
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.main-nav a {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  color: var(--primary-color);
  background: rgb(14 165 163 / 0.12);
}

.profile-link {
  background: rgb(15 23 42 / 0.05);
  border: 1px solid rgb(15 23 42 / 0.08);
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.btn-link:hover {
  background: rgb(239 68 68 / 0.08);
  color: #ef4444;
}

.admin-link {
  color: var(--accent-color) !important;
}

.btn-register {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: #fff !important;
  padding: 0.5rem 1.2rem !important;
  border-radius: 999px !important;
  box-shadow: 0 12px 22px rgb(14 165 163 / 0.26);
}

.btn-register:hover {
  background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-dark) 100%);
  transform: translateY(-1px);
  color: #fff;
}

.pending-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgb(245 158 11 / 0.18);
  color: #92400e;
  border: 1px solid rgb(245 158 11 / 0.35);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-main > div {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.route-loading-shell {
  min-height: 60vh;
  display: flex;
  align-items: flex-start;
}

.route-loading-bar {
  margin-top: 1.25rem;
  width: 100%;
  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--primary-light) 0%, var(--primary-color) 50%, var(--primary-light) 100%);
  background-size: 200% 100%;
  animation: route-loading 1s linear infinite;
}

@keyframes route-loading {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: 0 0;
  }
}

.app-footer {
  margin-top: 3rem;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.9) 0%, rgb(247 244 238 / 0.95) 100%);
  border-top: 1px solid rgb(15 23 42 / 0.08);
  color: var(--text-muted);
}

.footer-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) auto;
  gap: 2.5rem;
  padding: 2.6rem 0 1.5rem;
  align-items: start;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.footer-note {
  margin-top: 0.75rem;
  max-width: 420px;
  color: var(--text-secondary);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-weight: 600;
}

.footer-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

.footer-bottom {
  border-top: 1px solid rgb(15 23 42 / 0.08);
  padding: 1.1rem 0 2rem;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .header-inner {
    flex-direction: column;
    gap: 0.85rem;
  }

  .main-nav {
    justify-content: center;
    row-gap: 0.5rem;
  }

  .footer-inner {
    grid-template-columns: 1fr;
  }
}
</style>

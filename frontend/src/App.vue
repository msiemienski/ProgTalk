<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <router-link to="/" class="logo">
          <SquareTerminal class="logo-mark" aria-hidden="true" />
          <h1>ProgTalk</h1>
        </router-link>
        
        <nav class="main-nav">
          <router-link to="/">Strona Główna</router-link>
          <router-link to="/about">O Projekcie</router-link>
          
          <template v-if="isAuthenticated">
            <router-link v-if="isAdmin" to="/admin" class="admin-link">Panel Admina</router-link>
            <router-link to="/profile" class="profile-link">
              {{ user?.profile?.name || 'Profil' }}
            </router-link>
            <button @click="handleLogout" class="btn-link">Wyloguj</button>
          </template>
          
          <template v-else>
            <router-link to="/login">Zaloguj się</router-link>
            <router-link to="/register" class="btn-register">Dołącz</router-link>
          </template>
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
      <div class="container">
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
  background: rgb(255 253 250 / 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgb(221 213 199 / 0.88);
  padding: 0.85rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-mark {
  width: 1.25rem;
  height: 1.25rem;
  color: #0f766e;
  stroke-width: 2.2;
}

.logo h1 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #0f766e 0%, #c2410c 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Sora', sans-serif;
  font-weight: 800;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.main-nav a {
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  transition: color 0.2s, background-color 0.2s;
}

.main-nav a:hover, .main-nav a.router-link-active {
  color: var(--primary-color);
  background: rgb(15 118 110 / 0.1);
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-primary);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  border-radius: 999px;
  transition: color 0.2s, background-color 0.2s;
}

.btn-link:hover {
  background: rgb(239 68 68 / 0.08);
  color: #ef4444;
}

.admin-link {
  color: #b45309 !important;
}

.btn-register {
  background: linear-gradient(135deg, #0f766e 0%, #0f5f5a 100%);
  color: white !important;
  padding: 0.52rem 1.2rem !important;
  border-radius: 999px !important;
  box-shadow: 0 10px 18px rgb(15 118 110 / 0.24);
}

.btn-register:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  color: white;
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
  background: linear-gradient(180deg, rgb(255 253 250 / 0.72) 0%, rgb(255 251 244 / 0.95) 100%);
  border-top: 1px solid rgb(221 213 199 / 0.8);
  padding: 1.8rem 0;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 900px) {
  .app-header .container {
    flex-direction: column;
    gap: 0.85rem;
  }

  .main-nav {
    justify-content: center;
    row-gap: 0.4rem;
  }
}
</style>

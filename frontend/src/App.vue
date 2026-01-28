<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <router-link to="/" class="logo">
          <h1>🚀 ProgTalk</h1>
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
        <router-view />
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 0;
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

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Outfit', sans-serif;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.main-nav a {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.main-nav a:hover, .main-nav a.router-link-active {
  color: var(--primary-color);
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-color);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  color: #ef4444;
}

.admin-link {
  color: #9333ea !important;
}

.btn-register {
  background: var(--primary-color);
  color: white !important;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
}

.btn-register:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
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

.app-footer {
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  text-align: center;
  color: var(--text-muted);
}
</style>

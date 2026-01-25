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
      <div class="container">
        <router-view />
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="container">
        <p>&copy; 2026 ProgTalk - Społeczność Programistów</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import authService from './services/authService';

const router = useRouter();
const isAuthenticated = authService.isAuthenticated;
const user = authService.user;
const isAdmin = authService.isAdmin;

const handleLogout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style>
/* Global Styles from Stage 1 & 2 integration */
:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --secondary-color: #64748b;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-color: #1e293b;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --bg-hover: #f1f5f9;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn.primary {
  background: var(--primary-color);
  color: white;
}

.btn.primary:hover {
  background: var(--primary-hover);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  background: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>

<style scoped>
.app-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
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
  color: inherit;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.main-nav a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.95rem;
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
  border-radius: 8px;
}

.btn-register:hover {
  background: var(--primary-hover);
}

.app-main {
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
}

.app-footer {
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  text-align: center;
  color: var(--text-muted);
}
</style>

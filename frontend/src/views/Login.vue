<template>
  <div class="login-container">
    <div class="login-card card">
      <h2>Zaloguj się</h2>
      <p class="subtitle">Witaj ponownie w ProgTalk</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="twoj@email.com"
            :disabled="loading"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Hasło</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="••••••••"
            :disabled="loading"
          >
        </div>
        
        
        <button type="submit" class="btn primary full-width" :disabled="loading">
          {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
        </button>
      </form>
      
      <div class="card-footer">
        Nie masz konta? <router-link to="/register">Zarejestruj się</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import toastService from '../services/toastService';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = authService.loading;

const handleLogin = async () => {
  try {
    await authService.login(email.value, password.value);
    toastService.success('Zalogowano pomyślnie!');
    router.push('/');
  } catch (err) {
    toastService.error(authService.error.value || 'Błąd logowania');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px); /* Adjust for nav height */
  padding: 2rem;
  background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent),
              radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.05), transparent);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 3rem 2.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

h2 {
  margin-bottom: 0.75rem;
  text-align: center;
  font-size: 2rem;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  font-size: 0.95rem;
}

form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

.full-width {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  margin-top: 1.5rem;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.card-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.card-footer a {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
}

.card-footer a:hover {
  text-decoration: underline;
}
</style>

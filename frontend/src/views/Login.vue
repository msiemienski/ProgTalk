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
  min-height: 80vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
}

h2 {
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.full-width {
  width: 100%;
  margin-top: 1rem;
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
  color: var(--text-muted);
}
</style>

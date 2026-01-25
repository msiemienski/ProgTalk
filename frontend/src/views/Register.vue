<template>
  <div class="register-container">
    <div class="register-card card" v-if="!registered">
      <h2>Zarejestruj się</h2>
      <p class="subtitle">Dołącz do społeczności ProgTalk</p>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Imię i Nazwisko / Nick</label>
          <input 
            type="text" 
            id="name" 
            v-model="profile.name" 
            placeholder="Jan Kowalski"
            :disabled="loading"
          >
        </div>

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
        
        <div class="form-row">
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
          
          <div class="form-group">
            <label for="passwordConfirm">Powtórz basło</label>
            <input 
              type="password" 
              id="passwordConfirm" 
              v-model="passwordConfirm" 
              required 
              placeholder="••••••••"
              :disabled="loading"
            >
          </div>
        </div>
        
        
        <button type="submit" class="btn primary full-width" :disabled="loading">
          {{ loading ? 'Tworzenie konta...' : 'Zarejestruj się' }}
        </button>
      </form>
      
      <div class="card-footer">
        Masz już konto? <router-link to="/login">Zaloguj się</router-link>
      </div>
    </div>

    <!-- Success State: Pending Approval -->
    <div class="register-card card success-card" v-else>
      <div class="success-icon">⏳</div>
      <h2>Rejestracja zakończona!</h2>
      <p>Twoje konto został utworzone i oczekuje na <strong>zatwierdzenie przez administratora</strong>.</p>
      <p class="text-muted">Powiadomimy Cię, gdy Twoje konto zostanie aktywowane. Zazwyczaj trwa to do 24 godzin.</p>
      
      <router-link to="/login" class="btn primary full-width">Wróć do logowania</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import authService from '../services/authService';
import toastService from '../services/toastService';

const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const profile = reactive({
  name: ''
});

const registered = ref(false);
const loading = authService.loading;

const handleRegister = async () => {
  if (password.value !== passwordConfirm.value) {
    toastService.warning('Hasła nie są identyczne');
    return;
  }

  try {
    await authService.register(
      email.value, 
      password.value, 
      passwordConfirm.value, 
      profile
    );
    registered.value = true;
    toastService.success('Konto utworzone!');
  } catch (err) {
    toastService.error(authService.error.value || 'Błąd rejestracji');
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  padding: 1rem;
}

.register-card {
  width: 100%;
  max-width: 500px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

.form-group {
  margin-bottom: 1.25rem;
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

/* Success Card */
.success-card {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.success-card p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.text-muted {
  font-size: 0.9rem;
  margin-bottom: 2rem !important;
}
</style>

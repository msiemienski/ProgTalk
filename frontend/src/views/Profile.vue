<template>
  <div class="profile-container">
    <div class="profile-card card" v-if="user">
      <div class="profile-header">
        <div class="avatar-large">{{ user.profile?.name?.[0] || 'U' }}</div>
        <div class="header-info">
          <h1>{{ user.profile?.name || 'Użytkownik' }}</h1>
          <div class="status-badge" :class="user.status">
            {{ user.status === 'active' ? 'Aktywny' : 'Oczekujący' }}
          </div>
          <p class="email-text">{{ user.email }}</p>
        </div>
      </div>

      <div class="profile-sections">
        <!-- Profile Info -->
        <section class="profile-section">
          <h3>Edytuj Profil</h3>
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label>Nazwa / Nick</label>
              <input type="text" v-model="profileForm.name" placeholder="Twoja nazwa">
            </div>
            <div class="form-group">
              <label>Bio</label>
              <textarea v-model="profileForm.bio" placeholder="Napisz coś o sobie..." rows="3"></textarea>
            </div>
            <button type="submit" class="btn primary" :disabled="updating">
              {{ updating ? 'Zapisywanie...' : 'Zapisz profil' }}
            </button>
          </form>
        </section>

        <!-- Password Change -->
        <section class="profile-section">
          <h3>Zmień Hasło</h3>
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label>Obecne Hasło</label>
              <input type="password" v-model="passwordForm.oldPassword" required>
            </div>
            <div class="form-group">
              <label>Nowe Hasło</label>
              <input type="password" v-model="passwordForm.newPassword" required>
            </div>
            <div class="form-group">
              <label>Powtórz Nowe Hasło</label>
              <input type="password" v-model="passwordForm.newPasswordConfirm" required>
            </div>
            <button type="submit" class="btn secondary" :disabled="changingPassword">
              {{ changingPassword ? 'Zmienianie...' : 'Zmień hasło' }}
            </button>
          </form>
        </section>
      </div>

      <div class="profile-actions">
        <button @click="handleLogout" class="btn outline-danger">Wyloguj się</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import api from '../services/api';
import toastService from '../services/toastService';

const router = useRouter();
const user = authService.user;

const profileForm = reactive({
  name: user.value?.profile?.name || '',
  bio: user.value?.profile?.bio || '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  newPasswordConfirm: ''
});

const updating = ref(false);
const changingPassword = ref(false);

const updateProfile = async () => {
  updating.value = true;
  try {
    const response = await api.patch('/account/profile', profileForm);
    // Update local user state
    const newUser = { ...user.value, profile: response.data.profile };
    localStorage.setItem('user', JSON.stringify(newUser));
    authService.user.value = newUser;
    toastService.success('Profil zaktualizowany!');
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd aktualizacji profilu');
  } finally {
    updating.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
    toastService.error('Hasła nie są identyczne');
    return;
  }

  changingPassword.value = true;
  try {
    await api.post('/account/change-password', passwordForm);
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.newPasswordConfirm = '';
    toastService.success('Hasło zmienione!');
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd zmiany hasła');
  } finally {
    changingPassword.value = false;
  }
};

const handleLogout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.profile-card {
  padding: 2.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.avatar-large {
  width: 100px;
  height: 100px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
}

.email-text {
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pending {
  background: #fef9c3;
  color: #854d0e;
}

.profile-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

@media (max-width: 768px) {
  .profile-sections {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.profile-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
}

.outline-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.outline-danger:hover {
  background: #ef4444;
  color: white;
}
</style>

<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>Panel Administratora</h1>
      <p class="text-muted">Zarządzaj użytkownikami i tematami</p>
    </header>

    <div class="admin-grid">
      <!-- Pending Users Section -->
      <section class="admin-section card">
        <div class="section-title">
          <h3>Oczekujący Użytkownicy</h3>
          <span class="badge" v-if="pendingUsers.length > 0">{{ pendingUsers.length }}</span>
        </div>

        <div v-if="loadingUsers" class="loading-state">Pobieranie użytkowników...</div>
        <div v-else-if="pendingUsers.length === 0" class="empty-state">
          Brak oczekujących rejestracji.
        </div>
        <div v-else class="user-list">
          <div v-for="user in pendingUsers" :key="user._id" class="user-item">
            <div class="user-info">
              <span class="user-email">{{ user.email }}</span>
              <span class="user-date">Zarejestrowano: {{ formatDate(user.registeredAt) }}</span>
            </div>
            <div class="user-actions">
              <button @click="approveUser(user._id)" class="btn primary btn-sm">Zatwierdź</button>
              <button @click="rejectUser(user._id)" class="btn outline-danger btn-sm">Odrzuć</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Topic Management Section (Overview) -->
      <section class="admin-section card">
        <h3>Działania Administracyjne</h3>
        <div class="admin-tools">
          <div class="tool-item">
            <div class="tool-info">
              <h4>Blokowanie Użytkowników</h4>
              <p>Zablokuj dostęp użytkownikowi naruszającemu regulamin.</p>
            </div>
            <button class="btn secondary btn-sm" disabled>Zarządzaj</button>
          </div>
          <div class="tool-item">
            <div class="tool-info">
              <h4>Logi Aktywności</h4>
              <p>Przejrzyj historię działań administracyjnych.</p>
            </div>
            <button class="btn secondary btn-sm" disabled>Pokaż Logi</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const pendingUsers = ref([]);
const loadingUsers = ref(false);

const fetchPendingUsers = async () => {
  loadingUsers.value = true;
  try {
    const res = await api.get('/admin/users?status=pending');
    pendingUsers.value = res.data;
  } catch (err) {
    console.error('Fetch pending users error:', err);
  } finally {
    loadingUsers.value = false;
  }
};

const approveUser = async (id) => {
  try {
    await api.post(`/admin/users/${id}/approve`);
    pendingUsers.value = pendingUsers.value.filter(u => u._id !== id);
    alert('Użytkownik zatwierdzony!');
  } catch (err) {
    alert('Błąd zatwierdzania użytkownika');
  }
};

const rejectUser = async (id) => {
  if (!confirm('Czy na pewno chcesz odrzucić tę rejestrację?')) return;
  try {
    await api.post(`/admin/users/${id}/reject`);
    pendingUsers.value = pendingUsers.value.filter(u => u._id !== id);
    alert('Rejestracja odrzucona.');
  } catch (err) {
    alert('Błąd podczas odrzucania');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Nieznana';
  return new Date(dateStr).toLocaleDateString();
};

onMounted(fetchPendingUsers);
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem 0;
}

.admin-header {
  margin-bottom: 2.5rem;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}

.admin-section {
  padding: 2rem;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title h3 {
  margin: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-email {
  font-weight: 600;
}

.user-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.user-actions {
  display: flex;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

/* Tools */
.admin-tools {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tool-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.tool-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>

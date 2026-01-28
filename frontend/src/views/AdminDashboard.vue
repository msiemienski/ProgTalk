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

      <!-- Tag Management Section -->
      <section class="admin-section card">
        <div class="section-title">
          <h3>Zarządzanie Tagami</h3>
        </div>

        <!-- Add Tag Form -->
        <form @submit.prevent="createTag" class="tag-form">
          <div class="form-group">
            <input v-model="newTag.name" placeholder="Nazwa taga" required class="form-input">
          </div>
          <div class="form-group">
            <select v-model="newTag.category" class="form-input">
              <option value="language">Język</option>
              <option value="framework">Framework</option>
              <option value="library">Biblioteka</option>
              <option value="tool">Narzędzie</option>
              <option value="platform">Platforma</option>
              <option value="concept">Koncepcja</option>
              <option value="other">Inne</option>
            </select>
          </div>
          <div class="form-colors">
            <input type="color" v-model="newTag.color" title="Kolor taga">
          </div>
          <button type="submit" class="btn primary btn-sm" :disabled="creatingTag">Dodaj</button>
        </form>

        <!-- Tags List -->
        <div v-if="loadingTags" class="loading-state">Wczytywanie tagów...</div>
        <div v-else class="tags-grid">
          <div v-for="tag in tags" :key="tag._id" class="tag-item" :style="{ borderColor: tag.color }">
            <span class="tag-badge" :style="{ backgroundColor: tag.color }">
              {{ tag.name }}
            </span>
            <span class="tag-category">{{ tag.category }}</span>
            <button @click="deleteTag(tag._id)" class="btn-icon danger" title="Usuń">&times;</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import api from '../services/api';
import socket from '../services/socket';
import toastService from '../services/toastService';

const pendingUsers = ref([]);
const loadingUsers = ref(false);

// Tags state
const tags = ref([]);
const loadingTags = ref(false);
const creatingTag = ref(false);
const newTag = reactive({
  name: '',
  color: '#667eea',
  category: 'other'
});

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

const fetchTags = async () => {
  loadingTags.value = true;
  try {
    const res = await api.get('/tags');
    tags.value = res.data;
  } catch (err) {
    console.error('Fetch tags error:', err);
  } finally {
    loadingTags.value = false;
  }
};

const createTag = async () => {
  if (!newTag.name) return;
  creatingTag.value = true;
  try {
    await api.post('/tags', newTag);
    // Reset form
    newTag.name = '';
    newTag.color = '#667eea';
    newTag.category = 'other';
    // Refresh list
    fetchTags();
  } catch (err) {
    alert(err.response?.data?.message || 'Błąd tworzenia taga');
  } finally {
    creatingTag.value = false;
  }
};

const deleteTag = async (id) => {
  if (!confirm('Czy na pewno usunąć ten tag?')) return;
  try {
    await api.delete(`/tags/${id}`);
    fetchTags();
  } catch (err) {
    alert('Błąd usuwania taga');
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

onMounted(() => {
  fetchPendingUsers();
  fetchTags();
  
  // Listen for real-time user registrations
  socket.on('user:registered', (data) => {
    console.log('New user registered:', data);
    toastService.info(`Nowa rejestracja: ${data.email}`, {
      duration: 8000,
      onClick: () => {
        // Scroll to pending users section
        const section = document.querySelector('.admin-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
    // Auto-refresh pending users list
    fetchPendingUsers();
  });
});

onUnmounted(() => {
  socket.off('user:registered');
});
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

/* Tag Management */
.tag-form {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 100%;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid;
  border-radius: 8px;
  background: #fff;
}

.tag-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 99px;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.tag-category {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 500;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #94a3b8;
  padding: 0 0.25rem;
}

.btn-icon:hover {
  color: #ef4444;
}
</style>

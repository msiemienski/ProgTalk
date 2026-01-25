<template>
  <div class="home">
    <div class="hero card">
      <h1>Witaj w ProgTalk! 👋</h1>
      <p class="subtitle">Platforma dla programistów stworzona do dzielenia się wiedzą i kodem.</p>
      
      <div class="hero-actions" v-if="!isAuthenticated">
        <router-link to="/register" class="btn primary btn-lg">Zarejestruj się</router-link>
        <router-link to="/login" class="btn outline">Zaloguj się</router-link>
      </div>
    </div>

    <!-- Topics Discovery Section -->
    <section class="section">
      <div class="section-header">
        <h2>🔥 Odkrywaj Tematy</h2>
        <p>Przeglądaj główne kategorie dyskusji</p>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 3" :key="i" class="skeleton card"></div>
      </div>

      <div v-else-if="rootTopics.length > 0" class="topics-grid">
        <div 
          v-for="topic in rootTopics" 
          :key="topic._id" 
          class="topic-card card clickable"
          @click="$router.push(`/topics/${topic._id}`)"
        >
          <div class="topic-icon">📂</div>
          <div class="topic-info">
            <h3>{{ topic.name }}</h3>
            <p>{{ topic.description || 'Brak opisu.' }}</p>
            <div class="topic-meta">
              <span>{{ topic.subtopicCount }} podtematów</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state card">
        <p>Brak dostępnych tematów. Zaloguj się, aby stworzyć pierwszy!</p>
      </div>
    </section>

    <!-- Health Check (Hidden by default, keep for debug if needed) -->
    <details class="debug-section">
      <summary>Status Serwera (Debug)</summary>
      <div class="card health-info mt-2">
         <div v-if="health" class="health-grid">
           <span>Status: {{ health.status }}</span>
           <span>Database: {{ health.database.connected ? 'OK' : 'ERROR' }}</span>
         </div>
         <button class="btn btn-sm" @click="checkHealth">Sprawdź połączenie</button>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import authService from '../services/authService';

const health = ref(null);
const loading = ref(false);
const error = ref(null);
const rootTopics = ref([]);
const isAuthenticated = authService.isAuthenticated;

const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    health.value = response.data;
  } catch (err) {
    error.value = err.message;
  }
};

const fetchRootTopics = async () => {
  loading.value = true;
  try {
    const res = await api.get('/topics');
    rootTopics.value = res.data;
  } catch (err) {
    console.error('Fetch topics error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  checkHealth();
  fetchRootTopics();
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.hero {
  padding: 4rem 2rem;
  text-align: center;
  background: linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000') center/cover;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero .subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
}

.btn.outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.btn.outline:hover {
  background: var(--bg-hover);
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  margin-bottom: 0.5rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.topic-card {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.topic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);
}

.topic-icon {
  font-size: 2.5rem;
}

.topic-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
}

.topic-info p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.topic-meta {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--secondary-color);
}

.debug-section {
  margin-top: 4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.skeleton {
  height: 150px;
  background: #f1f5f9;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>

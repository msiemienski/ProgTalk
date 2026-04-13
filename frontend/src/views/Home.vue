<template>
  <div class="home">
    <div class="hero card">
      <h1>Witaj w ProgTalk</h1>
      <p class="subtitle">Platforma dla programistów stworzona do dzielenia się wiedzą i kodem.</p>
      
      <div class="hero-actions" v-if="!isAuthenticated">
        <router-link to="/register" class="btn primary btn-lg">Zarejestruj się</router-link>
        <router-link to="/login" class="btn outline">Zaloguj się</router-link>
      </div>
      <div class="hero-actions" v-else>
        <button @click="showCreateModal = true" class="btn primary btn-lg">+ Stwórz Temat</button>
      </div>
    </div>

    <!-- Topics Discovery Section -->
    <section class="section">
      <div class="section-header">
        <h2><Compass class="section-icon" aria-hidden="true" /> Odkrywaj Tematy</h2>
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
          <div class="topic-icon" aria-hidden="true">
            <FolderTree class="topic-icon-svg" />
          </div>
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

    <TopicCreateModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false"
      @created="handleTopicCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Compass, FolderTree } from 'lucide-vue-next';
import api from '../services/api';
import authService from '../services/authService';
import TopicCreateModal from '../components/TopicCreateModal.vue';

const loading = ref(false);
const rootTopics = ref([]);
const isAuthenticated = authService.isAuthenticated;
const showCreateModal = ref(false);

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

const handleTopicCreated = (newTopic) => {
  // Add new topic to the list
  rootTopics.value.unshift(newTopic);
};

onMounted(() => {
  fetchRootTopics();
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  padding: 1.25rem 0 2rem;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 4.2rem 2rem;
  text-align: center;
  background:
    linear-gradient(135deg, rgb(255 253 248 / 0.95), rgb(255 249 239 / 0.98)),
    url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200') center/cover;
  border: 1px solid rgb(15 118 110 / 0.24);
  box-shadow: 0 24px 45px rgb(15 23 42 / 0.08);
  animation: rise-in 0.55s ease-out both;
}

.hero::before {
  content: '';
  position: absolute;
  inset: -20% auto auto -18%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgb(15 118 110 / 0.2) 0%, rgb(15 118 110 / 0) 72%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  inset: auto -8% -28% auto;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgb(194 65 12 / 0.18) 0%, rgb(194 65 12 / 0) 74%);
  pointer-events: none;
}

.hero h1 {
  position: relative;
  z-index: 1;
  font-family: 'Sora', sans-serif;
  font-size: clamp(2rem, 4.8vw, 3.35rem);
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.hero .subtitle {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto 2.3rem;
  font-size: clamp(1rem, 2.25vw, 1.25rem);
  color: #4b5563;
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 0.8rem 1.9rem;
  font-size: 1rem;
}

.btn.outline {
  background: rgb(255 255 255 / 0.55);
  border: 1px solid rgb(15 118 110 / 0.35);
  color: var(--text-color);
}

.btn.outline:hover {
  background: rgb(255 255 255 / 0.9);
}

.section {
  animation: rise-in 0.62s ease-out both;
  animation-delay: 0.06s;
}

.section-header {
  margin-bottom: 1.35rem;
}

.section-header h2 {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Sora', sans-serif;
  margin-bottom: 0.5rem;
  font-size: clamp(1.45rem, 2.7vw, 2rem);
}

.section-icon {
  width: 1.2rem;
  height: 1.2rem;
  color: var(--primary-color);
  stroke-width: 2.3;
}

.section-header p {
  color: #6b7280;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.topic-card {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  min-height: 210px;
  border: 1px solid rgb(221 213 199 / 0.95);
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 30px rgb(17 24 39 / 0.11);
}

.topic-card::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  background: linear-gradient(90deg, rgb(15 118 110 / 0.95), rgb(194 65 12 / 0.85));
  opacity: 0;
  transition: opacity 0.24s ease;
}

.topic-card:hover::after {
  opacity: 1;
}

.topic-icon {
  width: 1.95rem;
  height: 1.55rem;
  border-radius: 0.38rem;
  background: linear-gradient(135deg, rgb(15 118 110 / 0.2), rgb(15 118 110 / 0.08));
  border: 1px solid rgb(15 118 110 / 0.45);
  position: relative;
  flex-shrink: 0;
}

.topic-icon::before {
  content: '';
  position: absolute;
  top: -0.34rem;
  left: 0.2rem;
  width: 0.9rem;
  height: 0.4rem;
  border-radius: 0.22rem 0.22rem 0 0;
  background: rgb(15 118 110 / 0.36);
}

.topic-icon-svg {
  position: absolute;
  left: 0.42rem;
  top: 0.33rem;
  width: 1.1rem;
  height: 1.1rem;
  color: #0f766e;
  stroke-width: 2.1;
}

.topic-info h3 {
  margin: 0 0 0.35rem;
  font-family: 'Sora', sans-serif;
  color: var(--primary-color);
  min-height: 2.75rem;
}

.topic-info p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  min-height: 4.5rem;
}

.topic-meta {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 1.4rem;
}

.skeleton {
  min-height: 210px;
  background: linear-gradient(90deg, #f1ede6 25%, #ebe6dc 37%, #f1ede6 63%);
  background-size: 400% 100%;
  animation: pulse 1.5s infinite;
}

@media (max-width: 700px) {
  .hero {
    padding: 3rem 1.15rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-lg {
    width: 100%;
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { background-position: 0% 0; }
  100% { background-position: 100% 0; }
}
</style>

<template>
  <div class="topics-page">
    <section class="topics-hero card glass">
      <span class="eyebrow">
        <Sparkles class="eyebrow-icon" aria-hidden="true" />
        Tematy ProgTalk
      </span>
      <h1>Przeglądaj wszystkie rozmowy w jednym miejscu</h1>
      <p class="lead">Wybierz kategorię i zanurz się w dyskusjach, które są dla Ciebie najważniejsze.</p>

      <div class="topics-actions" v-if="!isAuthenticated">
        <router-link to="/register" class="btn primary btn-lg">Zarejestruj się</router-link>
        <router-link to="/login" class="btn secondary btn-lg">Zaloguj się</router-link>
      </div>
      <div class="topics-actions" v-else>
        <button @click="showCreateModal = true" class="btn primary btn-lg">+ Stwórz temat</button>
        <router-link to="/about" class="btn outline btn-lg">Poznaj projekt</router-link>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Kategorie</span>
        <h2>Główne przestrzenie dyskusji</h2>
        <p class="section-lead">Zadbane, uporządkowane i gotowe do rozmowy.</p>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 6" :key="i" class="skeleton card"></div>
      </div>

      <div v-else-if="rootTopics.length > 0" class="topics-grid">
        <div
          v-for="topic in rootTopics"
          :key="topic._id"
          class="topic-card card"
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
import { FolderTree, Sparkles } from 'lucide-vue-next';
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
  rootTopics.value.unshift(newTopic);
};

onMounted(() => {
  fetchRootTopics();
});
</script>

<style scoped>
.topics-page {
  display: grid;
  gap: 2.5rem;
  padding: 2rem 0 3rem;
}

.topics-hero {
  display: grid;
  gap: 1rem;
  padding: 2.4rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.eyebrow-icon {
  width: 1rem;
  height: 1rem;
  color: var(--primary-color);
}

.topics-hero h1 {
  font-size: clamp(2.1rem, 4vw, 3rem);
  margin: 0.25rem 0 0.75rem;
}

.topics-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.topics-grid,
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.1rem;
  align-items: stretch;
}

.topic-card {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 1rem;
  padding: 1.4rem;
  min-height: 200px;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.topic-card::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  background: linear-gradient(90deg, rgb(14 165 163 / 0.95), rgb(249 115 22 / 0.85));
  opacity: 0;
  transition: opacity 0.24s ease;
}

.topic-card:hover::after {
  opacity: 1;
}

.topic-icon {
  width: 2rem;
  height: 1.6rem;
  border-radius: 0.45rem;
  background: linear-gradient(135deg, rgb(14 165 163 / 0.18), rgb(14 165 163 / 0.06));
  border: 1px solid rgb(14 165 163 / 0.4);
  position: relative;
  flex-shrink: 0;
}

.topic-icon::before {
  content: '';
  position: absolute;
  top: -0.35rem;
  left: 0.25rem;
  width: 0.95rem;
  height: 0.45rem;
  border-radius: 0.25rem 0.25rem 0 0;
  background: rgb(14 165 163 / 0.35);
}

.topic-icon-svg {
  position: absolute;
  left: 0.46rem;
  top: 0.34rem;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--primary-color);
  stroke-width: 2.1;
}

.topic-info h3 {
  margin: 0 0 0.35rem;
  color: var(--primary-color);
}

.topic-info p {
  color: var(--text-muted);
  font-size: 0.94rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.topic-meta {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 1.6rem;
}

.skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f5f1ea 25%, #ece6db 37%, #f5f1ea 63%);
  background-size: 400% 100%;
  animation: pulse 1.6s infinite;
}

@media (max-width: 700px) {
  .topics-actions {
    flex-direction: column;
  }

  .topics-actions .btn {
    width: 100%;
  }
}

@keyframes pulse {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
}
</style>

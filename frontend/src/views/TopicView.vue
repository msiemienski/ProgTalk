<template>
  <div class="topic-view">
    <!-- Navbar / Breadcrumbs Placeholder -->
    <nav class="breadcrumbs" v-if="path.length > 0">
      <router-link to="/">Strona Główna</router-link>
      <template v-for="p in path" :key="p.id">
        <span class="separator">/</span>
        <router-link :to="`/topics/${p.id}`">{{ p.name }}</router-link>
      </template>
    </nav>

    <div class="layout-with-sidebar">
      <!-- Sidebar with Tree -->
      <aside class="sidebar card">
        <h3>Tematy</h3>
        <div v-if="loadingTree" class="loading-state">Wczytywanie...</div>
        <TopicTree 
          v-else
          :topics="tree" 
          :current-topic-id="topicId"
          @select="navigateToTopic"
        />
      </aside>

      <!-- Main Content -->
      <main class="content">
        <div v-if="loadingTopic" class="loading-state">Wczytywanie tematu...</div>
        <div v-else-if="topic" class="topic-header card">
          <div class="header-main">
            <h1>{{ topic.name }}</h1>
            <div class="header-actions">
              <button 
                class="btn secondary btn-sm" 
                v-if="isAuthenticated" 
                @click="showCreateForm = !showCreateForm"
              >
                {{ showCreateForm ? 'Anuluj' : '+ Dodaj Podtemat' }}
              </button>
              <div class="topic-status-badge" v-if="topic.status !== 'active'">
                {{ topic.status }}
              </div>
            </div>
          </div>
          <p class="description">{{ topic.description || 'Brak opisu dla tego tematu.' }}</p>
          
          <div class="topic-stats">
            <span>{{ topic.subtopicCount }} podtematów</span>
            <span class="dot">•</span>
            <span v-if="topic.mainModeratorId">Moderator: {{ topic.mainModeratorId.profile?.name || topic.mainModeratorId.email }}</span>
          </div>
        </div>

        <!-- Create Subtopic Form -->
        <div v-if="showCreateForm" class="create-form card">
          <h3>Nowy Podtemat</h3>
          <form @submit.prevent="createSubtopic">
            <div class="form-group">
              <label>Nazwa</label>
              <input type="text" v-model="newSubtopic.name" placeholder="Np. React, Optymalizacja..." required>
            </div>
            <div class="form-group">
              <label>Opis</label>
              <textarea v-model="newSubtopic.description" placeholder="Krótki opis podtematu..." rows="2"></textarea>
            </div>
            <button type="submit" class="btn primary" :disabled="creating">
              {{ creating ? 'Tworzenie...' : 'Utwórz Podtemat' }}
            </button>
          </form>
        </div>

        <div v-if="subtopics.length > 0" class="subtopics-grid">
          <div 
            v-for="sub in subtopics" 
            :key="sub._id" 
            class="subtopic-card card clickable"
            @click="navigateToTopic(sub._id)"
          >
            <h4>{{ sub.name }}</h4>
            <p>{{ sub.description || 'Kliknij aby zobaczyć więcej...' }}</p>
          </div>
        </div>

        <!-- Post List Placeholder -->
        <div class="posts-section" v-if="topic">
          <div class="section-header">
            <h3>Posty</h3>
            <button class="btn primary btn-sm" v-if="isAuthenticated && topic.status === 'active'">
              Nowy Post
            </button>
          </div>
          
          <div class="empty-posts">
             <div class="icon">💬</div>
             <p>W tym temacie nie ma jeszcze żadnych postów.</p>
             <p class="text-muted">Bądź pierwszy i rozpocznij dyskusję!</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import authService from '../services/authService';
import TopicTree from '../components/TopicTree.vue';

const route = useRoute();
const router = useRouter();
const topicId = ref(route.params.id);

const tree = ref([]);
const topic = ref(null);
const subtopics = ref([]);
const path = ref([]);
const loadingTree = ref(false);
const loadingTopic = ref(false);
const isAuthenticated = authService.isAuthenticated;
const user = authService.user;

const showCreateForm = ref(false);
const newSubtopic = reactive({
  name: '',
  description: ''
});
const creating = ref(false);

const isModerator = computed(() => {
  if (!topic.value || !user.value) return false;
  return topic.value.mainModeratorId?._id === user.value.id || topic.value.mainModeratorId === user.value.id;
});

const createSubtopic = async () => {
  if (!newSubtopic.name) return;
  creating.value = true;
  try {
    await api.post(`/topics/${topicId.value}/subtopics`, newSubtopic);
    newSubtopic.name = '';
    newSubtopic.description = '';
    showCreateForm.value = false;
    alert('Podtemat został utworzony!');
    fetchTopicData(topicId.value);
    fetchTree();
  } catch (err) {
    alert(err.response?.data?.message || 'Błąd tworzenia podtematu');
  } finally {
    creating.value = false;
  }
};

const fetchTree = async () => {
  loadingTree.value = true;
  try {
    const res = await api.get('/topics/tree');
    tree.value = res.data;
  } catch (err) {
    console.error('Fetch tree error:', err);
  } finally {
    loadingTree.value = false;
  }
};

const fetchTopicData = async (id) => {
  if (!id) return;
  loadingTopic.value = true;
  try {
    const [topicRes, subRes, pathRes] = await Promise.all([
      api.get(`/topics/${id}`),
      api.get(`/topics/${id}/subtopics`),
      api.get(`/topics/${id}/path`)
    ]);
    topic.value = topicRes.data;
    subtopics.value = subRes.data;
    path.value = pathRes.data;
  } catch (err) {
    console.error('Fetch topic data error:', err);
  } finally {
    loadingTopic.value = false;
  }
};

const navigateToTopic = (id) => {
  router.push(`/topics/${id}`);
};

watch(() => route.params.id, (newId) => {
  topicId.value = newId;
  fetchTopicData(newId);
});

onMounted(() => {
  fetchTree();
  fetchTopicData(topicId.value);
});
</script>

<style scoped>
.topic-view {
  padding: 1rem 0;
}

.breadcrumbs {
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.breadcrumbs .separator {
  margin: 0 0.5rem;
  color: var(--text-muted);
}

.layout-with-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .layout-with-sidebar {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
}

.sidebar h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.topic-header {
  padding: 2.5rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-main h1 {
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topic-status-badge {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.create-form {
  padding: 2rem;
  border: 1px solid var(--primary-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.topic-stats {
  display: flex;
  gap: 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.dot {
  color: var(--border-color);
}

.subtopics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.subtopic-card {
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.subtopic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.subtopic-card h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--primary-color);
}

.subtopic-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.posts-section {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.empty-posts {
  text-align: center;
  padding: 4rem 2rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
}

.empty-posts .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>

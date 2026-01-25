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

        <!-- Moderators Section -->
        <div class="moderators-section">
          <h3>Moderatorzy</h3>
          <div class="mod-list">
            <div v-for="mod in moderators" :key="mod.userId" class="mod-item">
              <span class="mod-name" :title="mod.email">
                {{ mod.name || mod.email.split('@')[0] }}
                <span v-if="mod.isMain" class="badge mini">Main</span>
                <span v-else-if="mod.type === 'inherited'" class="badge mini gray" title="Dziedziczony">Desk</span>
              </span>
              <button 
                v-if="canManageModerators && !mod.isMain" 
                class="btn-icon danger" 
                @click="removeModerator(mod.userId)"
                title="Usuń moderatora"
              >
                &times;
              </button>
            </div>
          </div>
          
          <div v-if="canManageModerators" class="add-mod-form">
            <button v-if="!showModModal" class="btn secondary btn-sm full-width" @click="showModModal = true">
              + Dodaj Moderatora
            </button>
            
            <form v-else @submit.prevent="addModerator" class="mini-form">
              <input 
                type="email" 
                v-model="newModEmail" 
                placeholder="Email użytkownika" 
                required
                class="mini-input"
              >
              <div class="mini-actions">
                <button type="submit" class="btn primary btn-sm" :disabled="addingMod">OK</button>
                <button type="button" class="btn text btn-sm" @click="showModModal = false">Anuluj</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Blocking Section -->
        <div v-if="isModerator" class="moderators-section">
          <h3>Blokady</h3>
          <div v-if="!showBlockForm">
            <button class="btn secondary btn-sm full-width" @click="showBlockForm = true">
              + Zablokuj Użytkownika
            </button>
          </div>
          <form v-else @submit.prevent="blockUser" class="mini-form">
            <input type="email" v-model="blockForm.email" placeholder="Email" required class="mini-input">
            <textarea v-model="blockForm.reason" placeholder="Powód (opcjonalnie)" class="mini-input" rows="2"></textarea>
            <div class="mini-actions">
              <button type="submit" class="btn primary btn-sm" :disabled="blocking">OK</button>
              <button type="button" class="btn text btn-sm" @click="showBlockForm = false">Anuluj</button>
            </div>
          </form>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="content">
        <div v-if="loadingTopic" class="loading-state">Wczytywanie tematu...</div>
        
        <!-- Blocked Message -->
        <div v-else-if="userAccess && !userAccess.hasAccess" class="blocked-state card">
            <h2>Dostęp Zablokowany</h2>
            <p>Nie masz uprawnień do przeglądania tego tematu.</p>
            <div v-if="userAccess.block" class="block-details">
                <p><strong>Zablokowano w:</strong> {{ userAccess.block.blockedIn }}</p>
                <p v-if="userAccess.block.reason"><strong>Powód:</strong> {{ userAccess.block.reason }}</p>
                <p><strong>Przez:</strong> {{ userAccess.block.blockedBy }}</p>
            </div>
        </div>

        <template v-else-if="topic">
          <div class="topic-header card">
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
                <button 
                  class="btn danger btn-sm" 
                  v-if="isModerator" 
                  @click="deleteTopic"
                  title="Usuń ten temat"
                >
                  Usuń
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
          <div class="posts-section">
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
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import authService from '../services/authService';
import toastService from '../services/toastService';
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
const moderators = ref([]);
const showModModal = ref(false);
const newModEmail = ref('');
const addingMod = ref(false);

// Blocking state
const showBlockForm = ref(false);
const blocking = ref(false);
const blockForm = reactive({
  email: '',
  reason: '',
  exceptions: []
});
const userAccess = ref(null);

const isModerator = computed(() => {
  if (authService.isAdmin.value) return true;
  if (!user.value) return false;
  
  // Check if user is the main moderator
  if (topic.value?.mainModeratorId?._id === user.value.id || topic.value?.mainModeratorId === user.value.id) {
    return true;
  }
  
  // Check if user is in the moderators list
  return moderators.value.some(m => m.userId === user.value.id);
});

const canManageModerators = computed(() => {
  if (authService.isAdmin.value) return true;
  if (!topic.value || !user.value) return false;
  return topic.value.mainModeratorId?._id === user.value.id || topic.value.mainModeratorId === user.value.id;
});

const blockUser = async () => {
  if (!blockForm.email) return;
  blocking.value = true;
  try {
    await api.post(`/topics/${topicId.value}/blocks`, blockForm);
    toastService.success('Użytkownik został zablokowany.');
    showBlockForm.value = false;
    blockForm.email = '';
    blockForm.reason = '';
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd blokowania użytkownika');
  } finally {
    blocking.value = false;
  }
};

const createSubtopic = async () => {
  if (!newSubtopic.name) return;
  creating.value = true;
  try {
    await api.post(`/topics/${topicId.value}/subtopics`, newSubtopic);
    newSubtopic.name = '';
    newSubtopic.description = '';
    showCreateForm.value = false;
    toastService.success('Podtemat został utworzony!');
    fetchTopicData(topicId.value);
    fetchTree();
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd tworzenia podtematu');
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
    
    // Always fetch moderators (they are public info)
    try {
      const modRes = await api.get(`/topics/${id}/moderators`);
      moderators.value = modRes.data;
    } catch (modErr) {
      console.error('Failed to fetch moderators:', modErr);
    }

    // Check current user access
    if (isAuthenticated.value && user.value) {
      const accessRes = await api.get(`/topics/${id}/access/${user.value.id}`);
      userAccess.value = accessRes.data;
    } else {
      userAccess.value = { hasAccess: true }; // Public access assumed for details, logic on posts handles others
    }
  } catch (err) {
    console.error('Fetch topic data error:', err);
  } finally {
    loadingTopic.value = false;
  }
};

const deleteTopic = async () => {
  if (!topic.value) return;
  
  const hasSubtopics = topic.value.subtopicCount > 0;
  let confirmMessage = 'Czy na pewno chcesz usunąć ten temat?';
  
  if (hasSubtopics) {
    confirmMessage += '\n\nUWAGA: Ten temat posiada podtematy! Usunięcie go spowoduje trwałe usunięcie WSZYSTKICH podtematów i postów w całym drzewie poniżej.';
  }
  
  if (!confirm(confirmMessage)) return;
  
  // Double confirmation for cascading delete to be safe
  if (hasSubtopics && !confirm('Jesteś absolutnie pewien? Ta operacja jest nieodwracalna.')) return;
  
  try {
    await api.delete(`/topics/${topicId.value}?cascade=true`);
    toastService.success('Temat został usunięty.');
    
    // Redirect to parent if exists, else home
    if (topic.value.parentId) {
      router.push(`/topics/${topic.value.parentId}`);
    } else {
      router.push('/');
    }
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd usuwania tematu');
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

/* Moderators Section */
.moderators-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.mod-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mod-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.mod-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge.gray {
  background: #f1f5f9;
  color: #64748b;
}

.btn-icon.danger {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0 0.25rem;
  font-size: 1.2rem;
  line-height: 1;
}

.btn-icon.danger:hover {
  color: #b91c1c;
}

.btn.danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.btn.danger:hover {
  background-color: #fca5a5;
}

.full-width {
  width: 100%;
}

.mini-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mini-input {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.85rem;
}

.mini-actions {
  display: flex;
  gap: 0.5rem;
}

.btn.text {
  background: none;
  border: none;
  color: var(--text-muted);
}

.btn.text:hover {
  color: var(--text-color);
}

/* Blocked State */
.blocked-state {
    text-align: center;
    padding: 5rem 2rem;
    border: 2px solid #ef4444;
}

.blocked-state h2 {
    color: #ef4444;
    margin-bottom: 1rem;
}

.block-details {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #fff5f5;
    border-radius: 8px;
    display: inline-block;
    text-align: left;
    font-size: 0.95rem;
}

.block-details p {
    margin: 0.5rem 0;
}
</style>

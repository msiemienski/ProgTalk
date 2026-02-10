<template>
  <div class="post-card card" :class="{ 'is-deleted': post.isDeleted }">
    <div class="post-header">
      <div class="author-info">
        <div class="avatar-placeholder" v-if="!post.authorId?.profile?.avatar">
          {{ post.authorId?.email?.charAt(0).toUpperCase() || '?' }}
        </div>
        <img v-else :src="post.authorId.profile.avatar" class="author-avatar" alt="Avatar">
        <div class="meta">
          <span class="author-name">{{ post.authorId?.profile?.name || post.authorId?.email?.split('@')[0] || 'Anonim' }}</span>
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
        </div>
      </div>
      
      <div class="post-actions">
        <!-- Moderation Actions -->
        <template v-if="canModerate && !isAuthor">
          <button 
            class="btn btn-sm outline" 
            :class="isMod ? 'danger' : 'secondary'"
            @click="$emit('promote', post.authorId)" 
            :title="isMod ? 'Odbierz uprawnienia' : 'Promuj na moderatora'"
          >
            {{ isMod ? 'Zabierz uprawnienia' : 'Pozwól moderować' }}
          </button>
          <button 
            class="btn btn-sm outline" 
            :class="isBlocked ? 'secondary' : 'danger'"
            @click="handleBlockClick" 
            :title="isBlocked ? 'Odblokuj użytkownika' : 'Zablokuj w tym temacie'"
          >
            {{ isBlocked ? 'Odblokuj' : 'Blokuj' }}
          </button>
        </template>

        <button v-if="canManage" class="btn-icon danger" @click="$emit('delete', post._id)" title="Usuń post">
          &times;
        </button>
      </div>
    </div>

    <div class="post-content">
      <!-- Render parsed Markdown content -->
      <div class="markdown-body" v-html="parsedContent"></div>



      <div v-if="post.tags && post.tags.length > 0" class="post-tags">
        <span 
          v-for="tag in post.tags" 
          :key="tag._id" 
          class="tag-badge"
          :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
        >
          #{{ tag.name }}
        </span>
      </div>
    </div>

    <div class="post-footer">
      <div class="stat clickable" :class="{ 'has-liked': post.hasLiked }" @click="$emit('toggle-like', post._id)">
        <span class="icon">{{ post.hasLiked ? '❤️' : '👍' }}</span>
        <span>{{ post.likeCount || 0 }}</span>
      </div>
      <div v-if="post.referencedPosts?.length" class="referenced-meta">
        🔗 Odwołania: {{ post.referencedPosts.length }}
      </div>
    </div>

    <!-- Block Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="closeBlockModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Zablokuj użytkownika</h3>
          <button class="btn-close" @click="closeBlockModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="user-info">
            <strong>Użytkownik:</strong> {{ post.authorId?.email }}
          </p>
          
          <div class="form-group">
            <label>Powód (opcjonalnie)</label>
            <textarea v-model="blockReason" placeholder="Podaj powód blokady..." rows="3"></textarea>
          </div>

          <div v-if="availableSubtopics.length > 0" class="exceptions-section">
            <label class="section-label">Wyjątki (podtematy z dostępem):</label>
            <div class="subtopic-checkboxes">
              <label v-for="sub in availableSubtopics" :key="sub._id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :value="sub._id" 
                  v-model="selectedExceptions"
                >
                <span>{{ sub.name }}</span>
              </label>
            </div>
            <p class="help-text">Zaznaczone podtematy będą dostępne dla zablokowanego użytkownika</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="closeBlockModal">Anuluj</button>
          <button class="btn danger" @click="confirmBlock" :disabled="blocking">
            {{ blocking ? 'Blokowanie...' : 'Zablokuj' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import authService from '../services/authService';
import hljs from 'highlight.js';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

// Initialize marked with highlight.js integration
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// Basic configuration for security and breaks
marked.setOptions({
  breaks: true,
  gfm: true
});

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  canModerate: {
    type: Boolean,
    default: false
  },
  isMod: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  topicId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['delete', 'promote', 'block', 'toggle-like', 'block-success']);

const parsedContent = computed(() => {
  if (!props.post?.content) return '';
  return marked.parse(props.post.content);
});

const codeElements = ref([]);

onMounted(() => {
  // Logic for other onMounted tasks if needed
});
watch(() => props.post, () => {
  // Logic for other watch tasks if needed
}, { deep: true });

const user = authService.user;
const isAdmin = authService.isAdmin;

const isAuthor = computed(() => {
  if (!user.value || !props.post?.authorId) return false;
  const authorId = props.post.authorId._id || props.post.authorId;
  return authorId === user.value.id;
});

const canManage = computed(() => {
  if (!user.value) return false;
  if (isAdmin.value) return true;
  return isAuthor.value;
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Blocking modal state
const showBlockModal = ref(false);
const blockReason = ref('');
const availableSubtopics = ref([]);
const selectedExceptions = ref([]);
const blocking = ref(false);

const handleBlockClick = async () => {
  if (props.isBlocked) {
    // If already blocked, just unblock (no modal needed)
    emit('block', props.post.authorId);
  } else {
    // Show modal for blocking with exceptions
    showBlockModal.value = true;
    // Fetch subtopics
    try {
      const api = (await import('../services/api')).default;
      const res = await api.get(`/topics/${props.topicId}/subtopics?includeDescendants=true`);
      availableSubtopics.value = res.data;
    } catch (err) {
      console.error('Failed to fetch subtopics:', err);
      availableSubtopics.value = [];
    }
  }
};

const closeBlockModal = () => {
  showBlockModal.value = false;
  blockReason.value = '';
  selectedExceptions.value = [];
  availableSubtopics.value = [];
};

const confirmBlock = async () => {
  blocking.value = true;
  try {
    const api = (await import('../services/api')).default;
    const toastService = (await import('../services/toastService')).default;
    
    const payload = {
      email: props.post.authorId.email,
      reason: blockReason.value,
      exceptions: selectedExceptions.value
    };
    
    await api.post(`/topics/${props.topicId}/blocks`, payload);
    toastService.success('Użytkownik został zablokowany.');
    closeBlockModal();
    
    // Emit event to refresh blocks list
    emit('block-success');
  } catch (err) {
    const toastService = (await import('../services/toastService')).default;
    
    if (err.response?.data?.message?.includes('jedynym moderatorem')) {
      const confirmed = window.confirm(err.response.data.message + ' Czy na pewno chcesz usunąć temat?');
      if (confirmed) {
        try {
          const api = (await import('../services/api')).default;
          const res = await api.post(`/topics/${props.topicId}/blocks`, {
            email: props.post.authorId.email,
            reason: blockReason.value,
            exceptions: selectedExceptions.value,
            forceDelete: true
          });
          
          if (res.data.topicDeleted) {
            toastService.success('Temat został usunięty.');
            window.location.href = '/'; // Simple redirect for now
          }
          return;
        } catch (retryErr) {
          toastService.error(retryErr.response?.data?.message || 'Błąd usuwania tematu');
        }
      }
    } else {
      toastService.error(err.response?.data?.message || 'Błąd blokowania użytkownika');
    }
  } finally {
    blocking.value = false;
  }
};
</script>

<style scoped>
.post-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card.is-deleted {
  opacity: 0.6;
  border-style: dashed;
  background-color: #f1f5f9;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn.outline {
  background: transparent;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.btn.secondary.outline {
  color: var(--secondary-color);
  border: 1px solid var(--secondary-color);
}

.btn.danger.outline {
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn.outline:hover {
  background: rgba(0, 0, 0, 0.05);
}

.stat.clickable {
  cursor: pointer;
  transition: transform 0.1s ease;
}

.stat.clickable:active {
  transform: scale(0.9);
}

.stat.has-liked {
  color: #ef4444;
}

.stat.has-liked .icon {
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.author-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.avatar-placeholder, .author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.meta {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.post-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.post-content {
  line-height: 1.6;
  color: var(--text-color);
}

.text-content {
  white-space: pre-wrap;
  margin-bottom: 1rem;
}

.code-block-wrapper {
  margin: 1rem 0;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.lang-badge {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
  text-transform: uppercase;
}

.caption {
  font-size: 0.8rem;
  color: #64748b;
}

pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  color: #f8fafc;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.9rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid transparent;
}

.post-footer {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.referenced-meta {
  color: var(--primary-color);
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
}

.user-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
}

.exceptions-section {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.section-label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.subtopic-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.checkbox-item input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.checkbox-item:hover {
  color: var(--primary-color);
}

.help-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

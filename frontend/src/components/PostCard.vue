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
            @click="$emit('block', post.authorId)" 
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
      <p class="text-content">{{ post.content }}</p>

      <div v-if="post.codeBlocks && post.codeBlocks.length > 0" class="code-blocks">
        <div v-for="(block, index) in post.codeBlocks" :key="index" class="code-block-wrapper">
          <div class="code-header">
            <span class="lang-badge">{{ block.language }}</span>
            <span v-if="block.caption" class="caption">{{ block.caption }}</span>
          </div>
          <pre><code ref="codeElements" :class="'language-' + block.language">{{ block.code }}</code></pre>
        </div>
      </div>

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
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import authService from '../services/authService';
import hljs from 'highlight.js';

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
  }
});

const emit = defineEmits(['delete', 'promote', 'block', 'toggle-like']);

const codeElements = ref([]);

const highlightAll = () => {
  nextTick(() => {
    if (codeElements.value) {
      codeElements.value.forEach((el) => {
        hljs.highlightElement(el);
      });
    }
  });
};

onMounted(highlightAll);
watch(() => props.post, highlightAll, { deep: true });

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
</style>

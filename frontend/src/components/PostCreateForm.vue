<template>
  <div class="post-create-form card">
    <h3>Nowy Post</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Treść (Markdown obsługiwany)</label>
        <textarea 
          v-model="form.content" 
          placeholder="O czym chcesz napisać? Użyj `kod` dla wyróżnienia w tekście lub ```język dla bloków kodu." 
          rows="8" 
          required
        ></textarea>
      </div>



      <!-- Tags Section -->
      <div class="tags-selector-section">
        <label>Tagi</label>
        <div v-if="loadingTags" class="loading-tags">Wczytywanie tagów...</div>
        <div v-else class="tags-grid">
          <label 
            v-for="tag in availableTags" 
            :key="tag._id" 
            class="tag-checkbox-label"
            :class="{ active: form.tags.includes(tag._id) }"
            :style="{ '--tag-color': tag.color }"
          >
            <input 
              type="checkbox" 
              v-model="form.tags" 
              :value="tag._id"
              hidden
            >
            <span class="tag-name">#{{ tag.name }}</span>
          </label>
        </div>
        <div v-if="availableTags.length === 0 && !loadingTags" class="empty-tags">
          Brak dostępnych tagów.
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn primary" :disabled="submitting">
          {{ submitting ? 'Wysyłanie...' : 'Opublikuj Post' }}
        </button>
        <button type="button" class="btn text" @click="$emit('cancel')">
          Anuluj
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  topicId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['success', 'cancel']);

const submitting = ref(false);
const availableTags = ref([]);
const loadingTags = ref(false);

const form = reactive({
  content: '',
  tags: []
});

onMounted(async () => {
  loadingTags.value = true;
  try {
    const res = await api.get('/tags');
    availableTags.value = res.data;
  } catch (err) {
    console.error('Failed to fetch tags:', err);
  } finally {
    loadingTags.value = false;
  }
});



const handleSubmit = async () => {
  if (!form.content.trim()) return;
  
  submitting.value = true;
  try {
    const payload = {
      content: form.content,
      tags: form.tags
    };
    
    emit('success', payload);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.post-create-form {
  padding: 2rem;
  margin-bottom: 2rem;
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

textarea, input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
}

.code-blocks-editor {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.code-block-input {
  padding: 1rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
}

.input-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn.text {
  background: none;
  border: none;
  color: var(--text-muted);
}

.tags-selector-section {
  margin-bottom: 1.5rem;
}

.tags-selector-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.tag-checkbox-label {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 99px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  user-select: none;
}

.tag-checkbox-label:hover {
  border-color: var(--tag-color, var(--primary-color));
}

.tag-checkbox-label.active {
  background: white;
  border-color: var(--tag-color, var(--primary-color));
  box-shadow: 0 0 0 1px var(--tag-color, var(--primary-color));
}

.tag-name {
  color: var(--text-color);
  font-weight: 500;
}

.tag-checkbox-label.active .tag-name {
  color: var(--tag-color, var(--primary-color));
}

.loading-tags, .empty-tags {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding: 0.5rem 0;
}
</style>

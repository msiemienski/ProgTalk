<template>
  <div class="post-create-form card">
    <h3>Nowy Post</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Treść</label>
        <textarea 
          v-model="form.content" 
          placeholder="O czym chcesz napisać? (Markdown obsługiwany w backendzie)" 
          rows="5" 
          required
        ></textarea>
      </div>

      <!-- Code Blocks Section -->
      <div class="code-blocks-editor">
        <label>Bloki kodu (opcjonalnie)</label>
        <div v-for="(block, index) in form.codeBlocks" :key="index" class="code-block-input card">
          <div class="block-header">
            <span>Blok #{{ index + 1 }}</span>
            <button type="button" class="btn-icon danger" @click="removeCodeBlock(index)">&times;</button>
          </div>
          <div class="input-row">
            <select v-model="block.language">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="css">CSS</option>
              <option value="html">HTML</option>
              <option value="cpp">C++</option>
              <option value="sql">SQL</option>
              <option value="plaintext">Plain Text</option>
            </select>
            <input v-model="block.caption" placeholder="Opis kodu (np. Skrypt logowania)">
          </div>
          <textarea v-model="block.code" placeholder="Wklej kod tutaj..." rows="4"></textarea>
        </div>
        <button type="button" class="btn secondary btn-sm" @click="addCodeBlock">
          + Dodaj blok kodu
        </button>
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
import { reactive, ref } from 'vue';

const props = defineProps({
  topicId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['success', 'cancel']);

const submitting = ref(false);

const form = reactive({
  content: '',
  codeBlocks: []
});

const addCodeBlock = () => {
  form.codeBlocks.push({
    language: 'javascript',
    code: '',
    caption: ''
  });
};

const removeCodeBlock = (index) => {
  form.codeBlocks.splice(index, 1);
};

const handleSubmit = async () => {
  if (!form.content.trim()) return;
  
  submitting.value = true;
  try {
    // Filter out empty code blocks
    const payload = {
      content: form.content,
      codeBlocks: form.codeBlocks.filter(b => b.code.trim())
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
</style>

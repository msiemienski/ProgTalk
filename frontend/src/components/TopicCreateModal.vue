<template>
  <transition name="modal">
    <div class="modal-backdrop" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Stwórz Nowy Temat</h3>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="topicName">Nazwa Tematu</label>
            <input 
              type="text" 
              id="topicName" 
              v-model="form.name" 
              placeholder="np. JavaScript, Nowości, Offtopic" 
              required
              :disabled="loading"
            >
          </div>
          
          <div class="form-group">
            <label for="topicDesc">Krótki Opis</label>
            <textarea 
              id="topicDesc" 
              v-model="form.description" 
              placeholder="O czym będziemy tutaj rozmawiać?" 
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn secondary" @click="$emit('close')">Anuluj</button>
            <button type="submit" class="btn primary" :disabled="loading">
              {{ loading ? 'Tworzenie...' : 'Utwórz' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../services/api';
import toastService from '../services/toastService';

const emit = defineEmits(['close', 'created']);

const form = reactive({
  name: '',
  description: ''
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    const response = await api.post('/topics', form);
    toastService.success('Temat został utworzony!');
    emit('created', response.data);
    emit('close');
  } catch (err) {
    toastService.error(err.response?.data?.message || 'Błąd tworzenia tematu');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>

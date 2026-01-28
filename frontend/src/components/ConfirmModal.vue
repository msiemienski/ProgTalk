<template>
  <Teleport to="body">
    <div v-if="isOpen" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>{{ modalTitle }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ modalMessage }}</p>
          <p v-if="modalWarning" class="warning-text">{{ modalWarning }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn secondary" @click="handleCancel">
            {{ modalCancelText }}
          </button>
          <button class="btn" :class="modalDangerMode ? 'danger' : 'primary'" @click="handleConfirm">
            {{ modalConfirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Potwierdzenie'
  },
  message: {
    type: String,
    required: true
  },
  warning: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Potwierdź'
  },
  cancelText: {
    type: String,
    default: 'Anuluj'
  },
  dangerMode: {
    type: Boolean,
    default: false
  }
});

const isOpen = ref(false);
const modalTitle = ref('');
const modalMessage = ref('');
const modalWarning = ref('');
const modalConfirmText = ref('');
const modalCancelText = ref('');
const modalDangerMode = ref(false);

let resolvePromise = null;

const open = (options = {}) => {
  modalTitle.value = options.title || props.title;
  modalMessage.value = options.message || props.message;
  modalWarning.value = options.warning || props.warning;
  modalConfirmText.value = options.confirmText || props.confirmText;
  modalCancelText.value = options.cancelText || props.cancelText;
  modalDangerMode.value = options.dangerMode !== undefined ? options.dangerMode : props.dangerMode;

  isOpen.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
};

const handleConfirm = () => {
  isOpen.value = false;
  if (resolvePromise) resolvePromise(true);
};

const handleCancel = () => {
  isOpen.value = false;
  if (resolvePromise) resolvePromise(false);
};

defineExpose({ open });
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.confirm-modal {
  background: white;
  border-radius: 12px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.confirm-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.confirm-body {
  padding: 1.5rem;
}

.confirm-body p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-color);
}

.warning-text {
  margin-top: 1rem !important;
  padding: 0.75rem;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  color: #991b1b;
  font-weight: 500;
  border-radius: 4px;
}

.confirm-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

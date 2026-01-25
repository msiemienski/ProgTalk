<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast" 
        :class="toast.type"
        @click="remove(toast.id)"
      >
        <span class="icon">{{ getIcon(toast.type) }}</span>
        <span class="message">{{ toast.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import toastService from '../services/toastService';

const toasts = toastService.toasts;

const remove = (id) => {
  toastService.remove(id);
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📢';
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Allow clicks through container */
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-left: 4px solid #ccc;
  font-size: 0.95rem;
  font-weight: 500;
}

.toast.success { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
.toast.error { border-color: #ef4444; background: #fef2f2; color: #b91c1c; }
.toast.warning { border-color: #f59e0b; background: #fffbeb; color: #b45309; }
.toast.info { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }

.icon {
  font-size: 1.2rem;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

<template>
  <div class="home">
    <h2>Witaj w ProgTalk! 👋</h2>
    <p class="subtitle">Społeczność programistów - dyskusje, tematy, kod</p>
    
    <div class="card health-check">
      <h3>🏥 Status Serwera</h3>
      
      <div v-if="loading" class="loading">
        Sprawdzanie połączenia...
      </div>
      
      <div v-else-if="error" class="error-message">
        <p>❌ Błąd połączenia z serwerem</p>
        <code>{{ error }}</code>
        <button class="btn" @click="checkHealth" style="margin-top: 1rem;">
          Spróbuj ponownie
        </button>
      </div>
      
      <div v-else-if="health" class="health-info">
        <div class="health-row">
          <span class="label">Status:</span>
          <span :class="['status-badge', health.status === 'OK' ? 'success' : 'error']">
            {{ health.status }}
          </span>
        </div>
        
        <div class="health-row">
          <span class="label">Środowisko:</span>
          <code>{{ health.environment }}</code>
        </div>
        
        <div class="health-row">
          <span class="label">Uptime:</span>
          <code>{{ formatUptime(health.uptime) }}</code>
        </div>
        
        <div class="health-row">
          <span class="label">Baza danych:</span>
          <span :class="['status-badge', health.database.connected ? 'success' : 'error']">
            {{ health.database.state }}
          </span>
        </div>
        
        <div class="health-row">
          <span class="label">Ostatnie sprawdzenie:</span>
          <code>{{ new Date(health.timestamp).toLocaleString('pl-PL') }}</code>
        </div>
        
        <button class="btn" @click="checkHealth" style="margin-top: 1rem;">
          🔄 Odśwież
        </button>
      </div>
    </div>
    
    <div class="card features">
      <h3>✨ Funkcje (w przygotowaniu)</h3>
      <ul>
        <li>📝 Dyskusje programistyczne w tematach</li>
        <li>🌳 Hierarchiczna struktura tematów</li>
        <li>👥 System moderatorów</li>
        <li>💬 Wpisy z kodem i znacznikami</li>
        <li>🔐 Rejestracja i autoryzacja JWT</li>
        <li>⚡ Real-time komunikacja przez WebSocket</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'Home',
  
  setup() {
    const health = ref(null);
    const loading = ref(false);
    const error = ref(null);
    
    const checkHealth = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await api.get('/health');
        health.value = response.data;
      } catch (err) {
        error.value = err.message;
        console.error('Health check failed:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const formatUptime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hours}h ${minutes}m ${secs}s`;
    };
    
    onMounted(() => {
      checkHealth();
    });
    
    return {
      health,
      loading,
      error,
      checkHealth,
      formatUptime,
    };
  },
};
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #718096;
  margin-bottom: 2rem;
}

.health-check {
  margin-bottom: 2rem;
}

.health-check h3 {
  margin-top: 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.error-message {
  padding: 1rem;
  background: #fed7d7;
  border-radius: 6px;
  color: #742a2a;
}

.error-message code {
  display: block;
  margin-top: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
}

.health-info {
  padding: 1rem 0;
}

.health-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.health-row:last-child {
  border-bottom: none;
}

.health-row .label {
  font-weight: 600;
  color: #4a5568;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.features li:last-child {
  border-bottom: none;
}
</style>

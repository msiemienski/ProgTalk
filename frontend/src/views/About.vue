<template>
  <div class="about">
    <h2>O Projekcie</h2>
    
    <div class="card">
      <h3>🚀 ProgTalk</h3>
      <p>
        ProgTalk to aplikacja społecznościowa stworzona dla programistów.
        Umożliwia prowadzenie dyskusji technicznych w hierarchicznie
        zorganizowanych tematach.
      </p>
    </div>
    
    <div class="card">
      <h3>🛠️ Stack Technologiczny</h3>
      <div class="tech-stack">
        <div class="tech-item">
          <h4>Backend</h4>
          <ul>
            <li>Node.js + Express</li>
            <li>MongoDB + Mongoose</li>
            <li>Socket.io (WebSocket)</li>
            <li>JWT Authentication</li>
            <li>HTTPS/WSS</li>
          </ul>
        </div>
        
        <div class="tech-item">
          <h4>Frontend</h4>
          <ul>
            <li>Vue.js 3</li>
            <li>Vue Router</li>
            <li>Axios</li>
            <li>Socket.io Client</li>
            <li>Vite</li>
          </ul>
        </div>
        
        <div class="tech-item">
          <h4>DevOps</h4>
          <ul>
            <li>Docker</li>
            <li>Docker Compose</li>
            <li>SSL Certificates</li>
            <li>Hot Reload</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3>📋 Główne Funkcjonalności</h3>
      <ul>
        <li><strong>Tematy i podtematy:</strong> Hierarchiczna struktura dyskusji</li>
        <li><strong>System moderacji:</strong> Moderatorzy główni i delegowani</li>
        <li><strong>Wpisy:</strong> Tekst, kod, znaczniki technologii</li>
        <li><strong>Blokowanie użytkowników:</strong> Z możliwością wyjątków dla podtematów</li>
        <li><strong>Administracja:</strong> Zatwierdzanie rejestracji, zarządzanie użytkownikami</li>
        <li><strong>Real-time:</strong> Powiadomienia przez WebSocket</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About',
};
</script>

<style scoped>
.about {
  max-width: 900px;
  margin: 0 auto;
}

h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h3 {
  margin-top: 0;
  color: #2d3748;
}

h4 {
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.tech-item {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 6px;
}

.tech-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tech-item li {
  padding: 0.5rem 0;
  color: #4a5568;
}

.tech-item li:before {
  content: "✓ ";
  color: #667eea;
  font-weight: bold;
  margin-right: 0.5rem;
}

.about ul {
  list-style: none;
  padding: 0;
}

.about ul li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.about ul li:last-child {
  border-bottom: none;
}

.about ul li strong {
  color: #667eea;
}
</style>

<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <h1>🚀 ProgTalk</h1>
        <nav>
          <router-link to="/">Home</router-link>
          <router-link to="/about">About</router-link>
        </nav>
      </div>
    </header>
    
    <main class="app-main">
      <div class="container">
        <router-view />
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="container">
        <p>&copy; 2026 ProgTalk - Społeczność Programistów</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.app-header nav {
  display: flex;
  gap: 1.5rem;
}

.app-header nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.app-header nav a:hover,
.app-header nav a.router-link-active {
  opacity: 0.8;
  text-decoration: underline;
}

.app-main {
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
}

.app-footer {
  background: #2d3748;
  color: white;
  padding: 1.5rem 0;
  text-align: center;
}

.app-footer p {
  margin: 0;
}
</style>

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import 'highlight.js/styles/atom-one-dark.css';

const app = createApp(App);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err);
    console.error('Error info:', info);
};

// Use router
app.use(router);

// Mount app
app.mount('#app');

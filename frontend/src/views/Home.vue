<template>
  <div class="home">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">
          <Sparkles class="eyebrow-icon" aria-hidden="true" />
          ProgTalk - społeczność programistów
        </span>
        <h1>Rozmowy o kodzie, które prowadzą do rozwiązań.</h1>
        <p class="lead">
          ProgTalk to platforma stworzona z myślą o technicznych dyskusjach,
          które mają jasny kontekst, rytm i wysoką jakość.
        </p>

        <div class="hero-actions" v-if="!isAuthenticated">
          <router-link to="/register" class="btn primary btn-lg">Zarejestruj się</router-link>
          <router-link to="/login" class="btn secondary btn-lg">Zaloguj się</router-link>
        </div>
        <div class="hero-actions" v-else>
          <button @click="showCreateModal = true" class="btn primary btn-lg">+ Stwórz Temat</button>
          <router-link to="/topics" class="btn outline btn-lg">Przeglądaj tematy</router-link>
        </div>

        <div class="hero-metrics">
          <div class="metric">
            <span class="metric-value">Hierarchia dyskusji</span>
            <span class="metric-label">Od ogółu do szczegółu bez chaosu</span>
          </div>
          <div class="metric">
            <span class="metric-value">Moderacja premium</span>
            <span class="metric-label">Role, blokady i wyjątki w jednym miejscu</span>
          </div>
          <div class="metric">
            <span class="metric-value">Live + WebSocket</span>
            <span class="metric-label">Nowe posty i reakcje w czasie rzeczywistym</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-panel glass">
          <div class="hero-panel-top">
            <span class="pill"><span class="status-dot" aria-hidden="true"></span> Live</span>
            <span class="pill ghost">Moderacja</span>
          </div>
          <h3>Tematy, które żyją razem z Tobą</h3>
          <p>Wspólne rozwiązywanie problemów z czytelną strukturą wątków i rozbudowanym kontekstem.</p>
          <div class="hero-panel-grid">
            <div class="panel-item">
              <span class="panel-title">Tagi technologii</span>
              <span class="panel-sub">Szybkie filtrowanie i kontekst</span>
            </div>
            <div class="panel-item">
              <span class="panel-title">Wątki i cytaty</span>
              <span class="panel-sub">Dyskusja pozostaje spójna</span>
            </div>
            <div class="panel-item">
              <span class="panel-title">Status online</span>
              <span class="panel-sub">Widzisz aktywnych rozmówców</span>
            </div>
          </div>
        </div>

        <div class="hero-panel hero-panel-secondary glass">
          <div class="secondary-header">
            <span class="secondary-title">ProgTalk Pulse</span>
            <span class="secondary-status">Aktywne teraz</span>
          </div>
          <div class="secondary-list">
            <div class="secondary-item">
              <span class="secondary-topic">Architektura</span>
              <span class="secondary-meta">12 aktywnych</span>
            </div>
            <div class="secondary-item">
              <span class="secondary-topic">Frontend</span>
              <span class="secondary-meta">7 aktywnych</span>
            </div>
            <div class="secondary-item">
              <span class="secondary-topic">DevOps</span>
              <span class="secondary-meta">5 aktywnych</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-head">
        <span class="eyebrow"><Sparkles class="eyebrow-icon" aria-hidden="true" /> Dlaczego ProgTalk</span>
        <h2>Przemyślana przestrzeń do dzielenia się wiedzą</h2>
        <p class="section-lead">Zaprojektowana dla zespołów, społeczności i osób, które potrzebują klarownego kontekstu.</p>
      </div>
      <div class="feature-grid">
        <article class="feature-card card">
          <div class="feature-icon">
            <Layers aria-hidden="true" />
          </div>
          <h3>Hierarchiczne tematy</h3>
          <p>Twórz drzewo dyskusji, w którym łatwo wrócić do źródła i znaleźć szczegóły.</p>
        </article>
        <article class="feature-card card">
          <div class="feature-icon">
            <ShieldCheck aria-hidden="true" />
          </div>
          <h3>Moderacja i bezpieczeństwo</h3>
          <p>Role, wyjątki i blokady pomagają utrzymać najwyższą jakość rozmów.</p>
        </article>
        <article class="feature-card card">
          <div class="feature-icon">
            <Activity aria-hidden="true" />
          </div>
          <h3>Aktualizacje na żywo</h3>
          <p>Posty, reakcje i obecność pojawiają się natychmiast dzięki WebSocket.</p>
        </article>
      </div>
    </section>

    <section id="topics" class="section reveal">
      <div class="section-head">
        <span class="eyebrow"><Compass class="eyebrow-icon" aria-hidden="true" /> Odkrywaj tematy</span>
        <h2>Wybierz przestrzeń, w której chcesz działać</h2>
        <p class="section-lead">Przeglądaj główne kategorie dyskusji i wskocz do tematów, które są Ci najbliższe.</p>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 3" :key="i" class="skeleton card"></div>
      </div>

      <div v-else-if="rootTopics.length > 0" class="topics-grid">
        <div
          v-for="topic in rootTopics"
          :key="topic._id"
          class="topic-card card"
          @click="$router.push(`/topics/${topic._id}`)"
        >
          <div class="topic-icon" aria-hidden="true">
            <FolderTree class="topic-icon-svg" />
          </div>
          <div class="topic-info">
            <h3>{{ topic.name }}</h3>
            <p>{{ topic.description || 'Brak opisu.' }}</p>
            <div class="topic-meta">
              <span>{{ topic.subtopicCount }} podtematów</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state card">
        <p>Brak dostępnych tematów. Zaloguj się, aby stworzyć pierwszy!</p>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-head">
        <span class="eyebrow">Jak to działa</span>
        <h2>Od pomysłu do rozmowy w trzech krokach</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card card">
          <span class="step-number">01</span>
          <h3>Wybierz temat</h3>
          <p>Znajdź kategorię, która Cię interesuje, lub stwórz nową ścieżkę dyskusji.</p>
        </div>
        <div class="step-card card">
          <span class="step-number">02</span>
          <h3>Dodaj kontekst</h3>
          <p>Posty, kody, cytaty i tagi pozwalają zachować porządek w rozmowie.</p>
        </div>
        <div class="step-card card">
          <span class="step-number">03</span>
          <h3>Buduj wspólnotę</h3>
          <p>Moderacja i obecność online pomagają utrzymać tempo i jakość.</p>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-head">
        <span class="eyebrow">Głosy społeczności</span>
        <h2>Dlaczego zostajesz na dłużej</h2>
        <p class="section-lead">ProgTalk pomaga utrzymać rozmowy w ryzach, bez utraty energii i kreatywności.</p>
      </div>
      <div class="testimonial-grid">
        <figure class="testimonial card">
          <blockquote>
            "Wreszcie mamy miejsce, gdzie techniczne rozmowy nie giną w chaosie. Tematy i podtematy robią robotę."
          </blockquote>
          <figcaption>
            <span class="testimonial-name">Magda</span>
            <span class="testimonial-role">Lead Frontend</span>
          </figcaption>
        </figure>
        <figure class="testimonial card">
          <blockquote>
            "Moderacja i wyjątki przy blokadach to game changer. Widać, że narzędzie jest dobrze przemyślane."
          </blockquote>
          <figcaption>
            <span class="testimonial-name">Tomasz</span>
            <span class="testimonial-role">DevOps Engineer</span>
          </figcaption>
        </figure>
        <figure class="testimonial card">
          <blockquote>
            "Dzięki realtime i czytelnej strukturze, dyskusje są merytoryczne i szybkie."
          </blockquote>
          <figcaption>
            <span class="testimonial-name">Alicja</span>
            <span class="testimonial-role">Backend Developer</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="cta-section reveal">
      <div class="cta-card">
        <div class="cta-copy">
          <span class="eyebrow">Gotowy na start</span>
          <h2>Dołącz do ProgTalk i buduj rozmowy, które mają znaczenie.</h2>
          <p>Zmień narzędzie w przestrzeń, do której zespół chce wracać codziennie.</p>
        </div>
        <div class="cta-actions" v-if="!isAuthenticated">
          <router-link to="/register" class="btn primary btn-lg">Zarejestruj się</router-link>
          <router-link to="/about" class="btn outline btn-lg">Poznaj projekt</router-link>
        </div>
        <div class="cta-actions" v-else>
          <button @click="showCreateModal = true" class="btn primary btn-lg">Stwórz nowy temat</button>
          <router-link to="/topics" class="btn outline btn-lg">Przejdź do tematów</router-link>
        </div>
      </div>
    </section>

    <TopicCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleTopicCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Compass, FolderTree, Sparkles, Layers, ShieldCheck, Activity } from 'lucide-vue-next';
import api from '../services/api';
import authService from '../services/authService';
import TopicCreateModal from '../components/TopicCreateModal.vue';

const loading = ref(false);
const rootTopics = ref([]);
const isAuthenticated = authService.isAuthenticated;
const showCreateModal = ref(false);

const fetchRootTopics = async () => {
  loading.value = true;
  try {
    const res = await api.get('/topics');
    rootTopics.value = res.data;
  } catch (err) {
    console.error('Fetch topics error:', err);
  } finally {
    loading.value = false;
  }
};

const handleTopicCreated = (newTopic) => {
  rootTopics.value.unshift(newTopic);
};

let revealObserver;

const setupReveal = () => {
  const revealTargets = document.querySelectorAll('.reveal');
  if (!revealTargets.length) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
};

onMounted(() => {
  fetchRootTopics();
  setupReveal();
});

onUnmounted(() => {
  if (revealObserver) {
    revealObserver.disconnect();
  }
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 2rem 0 3rem;
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 2.5rem;
  align-items: center;
  padding: 1rem 0 2rem;
}

.hero::before {
  content: '';
  position: absolute;
  inset: -30% auto auto -10%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgb(14 165 163 / 0.2) 0%, rgb(14 165 163 / 0) 70%);
  pointer-events: none;
  z-index: 0;
}

.hero::after {
  content: '';
  position: absolute;
  inset: auto -8% -30% auto;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgb(249 115 22 / 0.18) 0%, rgb(249 115 22 / 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.eyebrow-icon {
  width: 1rem;
  height: 1rem;
  color: var(--primary-color);
}

.hero-copy h1 {
  font-size: clamp(2.4rem, 4.8vw, 3.9rem);
  letter-spacing: -0.03em;
  margin: 0.85rem 0 1rem;
}

.hero-copy .lead {
  margin-bottom: 2.2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-metrics {
  margin-top: 2.4rem;
  display: grid;
  gap: 1rem;
}

.metric {
  background: var(--surface-glass);
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 16px;
  padding: 0.85rem 1rem;
}

.metric-value {
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.metric-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.hero-visual {
  position: relative;
  z-index: 1;
  min-height: 420px;
}

.hero-panel {
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.hero-panel-top {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

.hero-panel h3 {
  margin-bottom: 0.6rem;
}

.hero-panel-grid {
  display: grid;
  gap: 0.85rem;
  margin-top: 1.5rem;
}

.panel-item {
  background: rgb(255 255 255 / 0.8);
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
}

.panel-title {
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
}

.panel-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.hero-panel-secondary {
  position: absolute;
  right: -0.8rem;
  bottom: -1.6rem;
  width: 72%;
  padding: 1.4rem;
  border-radius: 18px;
  box-shadow: var(--shadow-md);
  animation: float 7s ease-in-out infinite;
}

.secondary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.secondary-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.secondary-status {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.secondary-list {
  display: grid;
  gap: 0.65rem;
}

.secondary-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 0.45rem 0;
  border-bottom: 1px dashed rgb(15 23 42 / 0.12);
}

.secondary-item:last-child {
  border-bottom: none;
}

.secondary-topic {
  font-weight: 600;
}

.secondary-meta {
  color: var(--text-muted);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(14 165 163 / 0.12);
  color: var(--primary-color);
}

.feature-icon :deep(svg) {
  width: 1.3rem;
  height: 1.3rem;
}

.topics-grid,
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.1rem;
  align-items: stretch;
}

.topic-card {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 1rem;
  padding: 1.4rem;
  min-height: 200px;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.topic-card::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  background: linear-gradient(90deg, rgb(14 165 163 / 0.95), rgb(249 115 22 / 0.85));
  opacity: 0;
  transition: opacity 0.24s ease;
}

.topic-card:hover::after {
  opacity: 1;
}

.topic-icon {
  width: 2rem;
  height: 1.6rem;
  border-radius: 0.45rem;
  background: linear-gradient(135deg, rgb(14 165 163 / 0.18), rgb(14 165 163 / 0.06));
  border: 1px solid rgb(14 165 163 / 0.4);
  position: relative;
  flex-shrink: 0;
}

.topic-icon::before {
  content: '';
  position: absolute;
  top: -0.35rem;
  left: 0.25rem;
  width: 0.95rem;
  height: 0.45rem;
  border-radius: 0.25rem 0.25rem 0 0;
  background: rgb(14 165 163 / 0.35);
}

.topic-icon-svg {
  position: absolute;
  left: 0.46rem;
  top: 0.34rem;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--primary-color);
  stroke-width: 2.1;
}

.topic-info h3 {
  margin: 0 0 0.35rem;
  color: var(--primary-color);
}

.topic-info p {
  color: var(--text-muted);
  font-size: 0.94rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.topic-meta {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 1.6rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.2rem;
}

.step-card {
  display: grid;
  gap: 0.85rem;
}

.step-number {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--primary-color);
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem;
}

.testimonial {
  display: grid;
  gap: 1.2rem;
}

.testimonial blockquote {
  font-size: 0.98rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.testimonial-name {
  font-weight: 700;
  display: block;
}

.testimonial-role {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.cta-section {
  margin-top: 1.5rem;
}

.cta-card {
  display: grid;
  gap: 2rem;
  padding: 2.6rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgb(14 165 163 / 0.12), rgb(249 115 22 / 0.12));
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: var(--shadow-lg);
}

.cta-copy h2 {
  margin-bottom: 0.75rem;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f5f1ea 25%, #ece6db 37%, #f5f1ea 63%);
  background-size: 400% 100%;
  animation: pulse 1.6s infinite;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: auto;
  }

  .hero-panel-secondary {
    position: static;
    width: 100%;
    margin-top: 1.2rem;
    animation: none;
  }
}

@media (max-width: 700px) {
  .hero-actions,
  .cta-actions {
    flex-direction: column;
  }

  .hero-actions .btn,
  .cta-actions .btn {
    width: 100%;
  }

  .cta-card {
    padding: 2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-panel-secondary {
    animation: none;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes pulse {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
}
</style>
<template>
  <ul :class="{ 'topic-tree': isRoot, 'topic-subtree': !isRoot }">
    <li v-for="topic in topics" :key="topic._id" class="topic-item">
      <div 
        class="topic-link-wrapper" 
        :class="{ active: currentTopicId === topic._id }"
        @click="handleTopicClick(topic._id)"
      >
        <span v-if="topic.children?.length" class="toggle-icon">
          {{ expanded[topic._id] ? '▾' : '▸' }}
        </span>
        <span v-else class="bullet">•</span>
        <span class="topic-name">{{ topic.name }}</span>
        <span class="badge mini" v-if="topic.subtopicCount > 0">{{ topic.subtopicCount }}</span>
      </div>

      <!-- Recursive call -->
      <transition name="slide">
        <div v-if="topic.children?.length && expanded[topic._id]">
          <TopicTree 
            :topics="topic.children" 
            :is-root="false" 
            :current-topic-id="currentTopicId"
            @select="$emit('select', $event)"
          />
        </div>
      </transition>
    </li>
  </ul>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  topics: {
    type: Array,
    required: true
  },
  isRoot: {
    type: Boolean,
    default: true
  },
  currentTopicId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select']);

const expanded = reactive({});

// Auto-expand parents of current topic or specific branches could be added here
const handleTopicClick = (id) => {
  expanded[id] = !expanded[id];
  emit('select', id);
};
</script>

<style scoped>
.topic-tree, .topic-subtree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.topic-subtree {
  padding-left: 1.5rem;
}

.topic-item {
  margin: 0.25rem 0;
}

.topic-link-wrapper {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-color);
}

.topic-link-wrapper:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.topic-link-wrapper.active {
  background: #eef2ff;
  color: var(--primary-color);
  font-weight: 600;
}

.toggle-icon {
  width: 1rem;
  margin-right: 0.5rem;
  color: var(--text-muted);
}

.bullet {
  width: 1rem;
  margin-right: 0.5rem;
  color: var(--text-muted);
}

.topic-name {
  flex-grow: 1;
}

.badge.mini {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 99px;
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: max-height 0.3s ease-out, opacity 0.2s ease;
  overflow: hidden;
  max-height: 500px;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

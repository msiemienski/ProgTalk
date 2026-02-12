<template>
  <ul :class="{ 'exception-tree': isRoot, 'exception-subtree': !isRoot }">
    <li v-for="topic in topics" :key="topic._id" class="exception-item">
      <div class="exception-checkbox-wrapper">
        <span v-if="topic.children?.length" class="toggle-icon" @click="toggleExpand(topic._id)">
          {{ expanded[topic._id] ? '▾' : '▸' }}
        </span>
        <span v-else class="bullet">•</span>
        
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            :value="topic._id" 
            :checked="isTopicSelected(topic._id)"
            @change="handleTopicChange(topic._id, $event.target.checked)"
            :indeterminate="isTopicIndeterminate(topic._id)"
          >
          <span class="topic-name">{{ topic.name }}</span>
        </label>
      </div>

      <!-- Recursive call for children -->
      <transition name="slide">
        <div v-if="topic.children?.length && expanded[topic._id]">
          <ExceptionTree 
            :topics="topic.children" 
            :is-root="false" 
            :selected-exceptions="selectedExceptions"
            @update-selection="$emit('update-selection', $event)"
          />
        </div>
      </transition>
    </li>
  </ul>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';

const props = defineProps({
  topics: {
    type: Array,
    required: true
  },
  isRoot: {
    type: Boolean,
    default: true
  },
  selectedExceptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-selection']);

const expanded = reactive({});

// Helper function to get all descendant IDs of a topic
const getAllDescendantIds = (topic) => {
  let ids = [];
  if (topic.children) {
    for (const child of topic.children) {
      ids.push(child._id);
      ids = ids.concat(getAllDescendantIds(child));
    }
  }
  return ids;
};

// Helper function to find a topic by ID in the tree
const findTopicById = (topics, id) => {
  for (const topic of topics) {
    if (topic._id === id) return topic;
    if (topic.children) {
      const found = findTopicById(topic.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Check if a topic is selected
const isTopicSelected = (topicId) => {
  return props.selectedExceptions.includes(topicId);
};

// Check if a topic should be indeterminate (some children selected but not all)
const isTopicIndeterminate = (topicId) => {
  const topic = findTopicById(props.topics, topicId);
  if (!topic || !topic.children?.length) return false;
  
  const descendantIds = getAllDescendantIds(topic);
  const selectedDescendants = descendantIds.filter(id => props.selectedExceptions.includes(id));
  
  return selectedDescendants.length > 0 && selectedDescendants.length < descendantIds.length;
};

// Handle topic change with hierarchical logic
const handleTopicChange = (topicId, isChecked) => {
  const topic = findTopicById(props.topics, topicId);
  if (!topic) return;
  
  let newSelection = [...props.selectedExceptions];
  
  if (isChecked) {
    // Add the topic itself
    if (!newSelection.includes(topicId)) {
      newSelection.push(topicId);
    }
    
    // Add all descendants
    const descendantIds = getAllDescendantIds(topic);
    for (const descId of descendantIds) {
      if (!newSelection.includes(descId)) {
        newSelection.push(descId);
      }
    }
  } else {
    // Remove only this topic, keep ancestors as requested
    const index = newSelection.indexOf(topicId);
    if (index > -1) {
      newSelection.splice(index, 1);
    }
    
    // Remove all descendants
    const descendantIds = getAllDescendantIds(topic);
    newSelection = newSelection.filter(id => !descendantIds.includes(id));
  }
  
  emit('update-selection', newSelection);
};

// Toggle expand/collapse
const toggleExpand = (id) => {
  expanded[id] = !expanded[id];
};

// Auto-expand topics that have selected descendants
watch(() => props.selectedExceptions, (newSelection) => {
  const autoExpandTopics = (topics) => {
    for (const topic of topics) {
      const descendantIds = getAllDescendantIds(topic);
      const hasSelectedDescendant = descendantIds.some(id => newSelection.includes(id));
      
      if (hasSelectedDescendant) {
        expanded[topic._id] = true;
      }
      
      if (topic.children) {
        autoExpandTopics(topic.children);
      }
    }
  };
  
  autoExpandTopics(props.topics);
}, { immediate: true });
</script>

<style scoped>
.exception-tree, .exception-subtree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.exception-subtree {
  padding-left: 1.5rem;
}

.exception-item {
  margin: 0.25rem 0;
}

.exception-checkbox-wrapper {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.exception-checkbox-wrapper:hover {
  background: rgba(0, 0, 0, 0.05);
}

.toggle-icon {
  width: 1rem;
  margin-right: 0.5rem;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.bullet {
  width: 1rem;
  margin-right: 0.5rem;
  color: var(--text-muted);
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-grow: 1;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 0.5rem;
}

.topic-name {
  flex-grow: 1;
  color: var(--text-color);
}

/* Indeterminate state for checkboxes */
input[type="checkbox"]:indeterminate {
  opacity: 0.7;
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

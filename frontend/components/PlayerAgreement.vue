<template>
  <div class="agreement-container">
    <div class="agreement-item" v-for="(item, index) in agreementItems" :key="index">
      <div class="item-content">
        <div class="checkbox-wrapper">
          <button 
            @click="toggleAcknowledgment(index)"
            :disabled="disabled"
            class="checkbox-button"
            :class="{ 'checked': myAcknowledged[index], 'peer-checked': peerAcknowledged[index] }"
            :aria-label="`${myAcknowledged[index] ? 'Uncheck' : 'Check'} ${item.title}`"
          >
            <div class="checkbox-inner" v-if="myAcknowledged[index]"></div>
          </button>
        </div>
        <div class="text-and-emoji-wrapper">
          <div class="emoji-wrapper">
            <Emoji :emoji="item.emoji" :size="item.emojiSize" />
          </div>
          <div class="text-content">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Emoji from './Emoji.vue'

const props = defineProps<{
  myAcknowledged: boolean[]
  peerAcknowledged: boolean[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:acknowledged': [acknowledged: boolean[]]
}>()

const agreementItems = [
  {
    emoji: 'monocle',
    emojiSize: 40,
    title: "I'm here to Think, not to Troll",
    description: "Everyone's thinking is imperfect, and thoughtful dialogue makes it stronger. I'm not here to mock, defeat, or disrupt. I might even revise my position (no promises)."
  },
  {
    emoji: 'mutual-respect',
    emojiSize: 32,
    title: 'Mutual Respect',
    description: "I'll be kind, generous, and I'll control my emotions. I'll critique arguments, not people."
  },
  {
    emoji: 'honest-thinking',
    emojiSize: 32,
    title: 'Honest Thinking',
    description: "I'll think with clear reasons and humility, not with aggression and arrogance."
  },
  {
    emoji: 'book',
    emojiSize: 40,
    title: 'Shared Facts',
    description: "Facts matter, so I'll track them down collaboratively and use them honestly, without bias for 'my side.'"
  }
]

function toggleAcknowledgment(index: number) {
  const newAcknowledged = [...props.myAcknowledged]
  newAcknowledged[index] = !newAcknowledged[index]
  emit('update:acknowledged', newAcknowledged)
}
</script>

<style scoped>
.agreement-container {
  background: #FDFBF7;
  border-radius: 12px;
  padding: 8px 32px;
  max-width: 700px;
  margin: 0 auto;
}

.agreement-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.text-and-emoji-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
}

.emoji-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.item-title {
  font-family: 'Noto Sans', sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 13px;
  line-height: 18px;
  color: #3D3D3D;
  margin: 0;
}

.item-description {
  font-family: 'Noto Sans', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 11px;
  line-height: 16px;
  color: #5A5A5A;
  margin: 0;
}

.checkbox-button {
  width: 24px;
  height: 24px;
  border: 2px solid #000000;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-button:hover:not(:disabled) {
  border-color: #EFAE45;
  transform: scale(1.05);
}

.checkbox-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-button.checked {
  background: transparent;
}

.checkbox-inner {
  width: 12px;
  height: 12px;
  background: #000000;
  border-radius: 50%;
}
</style>


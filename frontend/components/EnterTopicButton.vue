<template>
  <button
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    @click="$emit('click')"
    class="cursor-pointer"
  >
    <EnterTopicSelected v-if="selected" class="w-64 h-64" />
    <EnterTopicHover v-else-if="isHovering" class="w-64 h-64" />
    <EnterTopic v-else class="w-64 h-64" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EnterTopic from '/assets/buttons/EnterTopic.svg'
import EnterTopicHover from '/assets/buttons/EnterTopicHover.svg'
import EnterTopicSelected from '/assets/buttons/EnterTopicSelected.svg'

const isHovering = ref(false)

defineProps<{
  selected?: boolean
}>()

defineEmits(['click'])
</script>

<style scoped>
</style>

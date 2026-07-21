<template>
  <div class="fixed top-4 left-4 z-40">
    <span class="text-2xl text-gray font-primary">#Room: <span class="text-gray">{{ gameCode }}</span></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  gameCode: string
}>()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8" style="background-color: var(--color-offwhite);">
    <button @click="router.push('/')" class="absolute top-6 left-6 form-base btn-icon">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div class="w-full max-w-md flex flex-col items-center gap-10">
      <!-- Header -->
      <div class="text-center">
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d]">AI Co-Player</p>
        <h1 class="mt-2 text-3xl font-bold text-[#3b342f]">Set up your debate</h1>
        <p class="mt-2 text-sm text-[#8d8379]">Choose a topic and pick your side. The AI will argue the other.</p>
      </div>

      <!-- Topic input -->
      <div class="w-full flex flex-col gap-3">
        <label class="text-sm font-bold text-[#3b342f]">Debate topic</label>
        <textarea
          v-model="topic"
          rows="2"
          maxlength="120"
          placeholder="e.g. Social media does more harm than good."
          class="w-full resize-none rounded-2xl border border-[#d8cbb7] bg-white px-4 py-3 text-sm text-[#3b342f] placeholder-[#b0a89f] focus:border-[#c07a2d] focus:outline-none"
        />
        <button
          @click="showSuggestions = !showSuggestions"
          class="self-start text-xs font-semibold text-[#c07a2d] underline underline-offset-2"
        >
          {{ showSuggestions ? 'Hide suggestions' : 'Need a topic idea?' }}
        </button>
        <div v-if="showSuggestions" class="flex flex-col gap-2">
          <button
            v-for="s in suggestedTopics"
            :key="s"
            @click="topic = s; showSuggestions = false"
            class="rounded-xl border border-[#e8ddd6] bg-white px-3 py-2 text-left text-sm text-[#5e564f] hover:border-[#c07a2d] hover:text-[#3b342f] transition-colors"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Role selection -->
      <div class="w-full flex flex-col gap-3">
        <label class="text-sm font-bold text-[#3b342f]">Your stance</label>
        <div class="flex gap-3">
          <button
            @click="role = 'plus'"
            :class="[
              'flex-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all',
              role === 'plus'
                ? 'border-[#49ca81] bg-[#f0fdf4] text-[#1a6b3c]'
                : 'border-[#e8ddd6] bg-white text-[#5e564f] hover:border-[#49ca81]'
            ]"
          >
            <div class="text-xl mb-1">👍</div>
            For the topic
          </button>
          <button
            @click="role = 'minus'"
            :class="[
              'flex-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all',
              role === 'minus'
                ? 'border-[#ffb42f] bg-[#fffbeb] text-[#7a5300]'
                : 'border-[#e8ddd6] bg-white text-[#5e564f] hover:border-[#ffb42f]'
            ]"
          >
            <div class="text-xl mb-1">👎</div>
            Against the topic
          </button>
        </div>
      </div>

      <!-- AI info -->
      <div class="w-full rounded-2xl border border-[#e8ddd6] bg-[#faf6f0] p-4">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#c07a2d]">Your AI opponent</p>
        <p class="mt-1 text-sm text-[#5e564f]">
          The AI will argue <strong class="text-[#3b342f]">{{ role === 'plus' ? 'against' : 'for' }}</strong> the topic.
          It responds after each tile you place.
        </p>
      </div>

      <!-- Start button -->
      <button
        @click="startAiGame"
        :disabled="!topic.trim() || !role || isStarting"
        class="w-full form-base btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="isStarting" class="flex gap-1">
          <span class="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]"></span>
          <span class="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]"></span>
          <span class="h-2 w-2 animate-bounce rounded-full bg-white"></span>
        </span>
        <span v-else>Start debate</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true })

import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import { useAlerts } from '~/composables/useAlerts'

const route = useRoute()
const router = useRouter()
const { error } = useAlerts()
const gameCode = (route.params.gameCode as string) || ''

const topic = ref('')
const role = ref<'plus' | 'minus' | null>(null)
const isStarting = ref(false)
const showSuggestions = ref(false)

const suggestedTopics = [
  'Social media does more harm than good.',
  'Schools should ban phones in class.',
  'Remote work should be the default for office jobs.',
  'Universal basic income should be implemented nationwide.',
  'Artificial intelligence will create more jobs than it eliminates.',
]

async function startAiGame() {
  if (!topic.value.trim() || !role.value) return
  isStarting.value = true

  const socket = io('http://localhost:8080', {
    transports: ['websocket'],
    withCredentials: true,
    query: { gameCode }
  })

  socket.once('connect', () => {
    socket.emit('startAiGame', { topic: topic.value.trim(), hostRole: role.value })
  })

  socket.once('gameStarted', () => {
    socket.disconnect()
    router.push(`/game/${gameCode}?aiMode=true`)
  })

  socket.once('error', (err: any) => {
    isStarting.value = false
    socket.disconnect()
    error(err?.message || 'Failed to start AI game.')
  })

  // Fallback timeout
  setTimeout(() => {
    if (isStarting.value) {
      isStarting.value = false
      socket.disconnect()
      error('Connection timed out. Please try again.')
    }
  }, 10000)
}
</script>

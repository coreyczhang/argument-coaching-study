<template>
  <div id="container" class="min-h-screen flex flex-col items-center justify-center p-8" style="background-color: var(--color-offwhite);">
    <button @click="goToHome" 
            class="absolute top-6 left-6 form-base btn-icon">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <section id="splash" class="mb-16">
      <Logo class="h-64 w-auto" />
    </section>

    <div id="actions" class="flex flex-col items-center space-y-6 w-full max-w-sm">
      <div class="w-full flex items-center space-x-3">
        <input 
          v-model.trim="gameCode" 
          type="text" 
          placeholder="Enter Room Number"
          class="form-base input-primary"
          maxlength="6"
        />
        <button 
          @click="joinGame" 
          :disabled="!gameCode || gameCode.length !== 6"
          class="form-base btn-icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="flex items-center w-full">
        <div class="flex-1 h-px" style="background-color: var(--color-gray);"></div>
        <span class="px-3 font-medium text-sm" style="color: var(--color-gray);">OR</span>
        <div class="flex-1 h-px" style="background-color: var(--color-gray);"></div>
      </div>

      <button
        @click="createGame"
        class="w-full form-base btn-primary"
      >
        Create a room
      </button>

      <div class="flex items-center w-full">
        <div class="flex-1 h-px" style="background-color: var(--color-gray);"></div>
        <span class="px-3 font-medium text-sm" style="color: var(--color-gray);">OR</span>
        <div class="flex-1 h-px" style="background-color: var(--color-gray);"></div>
      </div>

      <button
        @click="playVsAi"
        class="w-full form-base btn-secondary flex items-center justify-center gap-2"
      >
        <span>✦</span> Play vs AI
      </button>
    </div>
  </div>
</template>

<script setup lang='ts'>
definePageMeta({ requiresAuth: true })

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/assets/Logo.svg?component'
import { useAlerts } from '~/composables/useAlerts'

const router = useRouter()
const gameCode = ref<string | null>(null)
const {error} = useAlerts()

const goToHome = () => {
  router.push('/home')
}

const playVsAi = async () => {
  try {
    const res = await fetch('http://localhost:8080/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    const data = await res.json()
    router.push(`/ai-setup/${data.data.gameCode}`)
  } catch (e) {
    error('Failed to create AI game. Please try again.')
  }
}

const createGame = async () => {
  try {
    const res = await fetch('http://localhost:8080/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    const data = await res.json()
    router.push(`/lobby/${data.data.gameCode}`)
  } catch (error) {
    console.log(error)
  }
}

const joinGame = async () => {
  try {
    const gameRes = await fetch(`http://localhost:8080/api/games/${gameCode.value}`, {
      credentials: 'include'
    })
    const gameData = await gameRes.json()
    const gameStatus = gameData.data.game.status
    
    const joinRes = await fetch(`http://localhost:8080/api/games/${gameCode.value}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    await joinRes.json()
    
    if (gameStatus === 'in-progress' || gameStatus === 'finished') {
      router.push(`/game/${gameCode.value}`)
    } else {
      router.push(`/lobby/${gameCode.value}`)
    }
  } catch (e) {
    error('Failed to join game. Please check the room number and try again.')
  }
}
</script>

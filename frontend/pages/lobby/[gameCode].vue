<template>
  <div id="container">
    <!-- <RoomCodeDisplay :game-code="gameCode" /> -->
    <!-- <section id="splash" class="w-full flex flex-col items-center justify-center pt-24 pb-4">
      <h3 class="text-xl">Room #: <span class="text-blue-700">{{ gameCode }}</span></h3>
      <p class="mt-2" style="color: var(--color-gray);">Share with your peer to join</p>
    </section> -->
    <div class="mx-auto max-w-6xl mt-12">
      <div id="header" class="relative flex items-center justify-between rounded-full bg-white/80 px-6 py-3 
         shadow-[0_0_25px_rgba(249,188,65,0.35)] ring-1 ring-amber-100">
        <img :src="Logo" alt="">
        <div id="room-code" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <h3 class="">Room #: <span class="text-gold">{{ gameCode }}</span></h3>
          <p class="text-gray-600 font-bold">Share with your peer to join</p>
        </div>
        <div id="players" class="flex space-x-4">
          <div id="left" class="flex flex-col items-center">
            <PlayerConfirmedIcon v-if="players.length >= 1" class="" />
            <p class="text-gray-600 font-bold">{{ myName }}</p>
          </div>
          <div id="left" class="flex flex-col items-center">
            <PlayerConfirmedIcon v-if="otherPlayerName !== 'Waiting...'" class="" />
            <PlayerMissingIcon v-else class="" />
            <p class="text-gray-600 font-bold">{{ otherPlayerName }}</p>
          </div>
        </div>
      </div>
    </div>

    <section class="w-full flex flex-col items-center justify-start p-6 space-y-8 mt-20">
      <div class="flex flex-col items-center">
        <h3 v-if="isHost" class="text-gold font-bold">Enter your own topic</h3>
        <h3 v-else class="text-gold font-bold">Host is entering topic</h3>
        <p v-if="isHost" class="text-gray-400">Pro tip: enter the topic you and your peer agreed on</p>
        <p v-else class="text-gray-400">Once the host types a topic, it will appear here</p>
      </div>

      <!-- Topic Input -->
      <div id="topic-tile" class="relative flex">
        <label for="topic" class="sr-only">Reason</label>
        <div id="outer-wrapper" class="absolute overflow-hidden -inset-3">
          <div :class="`outer absolute inset-0 overflow-hidden rotate-45 border`" :style="{ borderColor:  '#1E1E1E'}" />
        </div>
        <div id="inner-wrapper" class="relative overflow-hidden inset-0" :style="{ width: '17rem', height: '17rem' }">
          <div :class="`inner absolute inset-0 overflow-hidden rotate-45 border-3`"
            :style="{ borderColor:  '#1E1E1E'}" />
        </div>
        <div id="content" class="absolute inset-0 flex items-center justify-center">
          <h3 class="absolute top-0" :style="{
            color: '#FFF',
            WebkitTextStrokeWidth: '1.5px',
            WebkitTextStrokeColor: '#1E1E1E',
          }">topic</h3>
          <textarea v-if="isHost" ref="editor" id="topic" v-model="topic" placeholder="type topic here"
            class="bg-transparent text-center focus:outline-none w-3/4 resize-none py-8 overflow-hidden" />
          <p v-else class="text-gray-800 text-center p-2">
            {{ topic || 'waiting for host...' }}
          </p>
        </div>
      </div>

      <button 
        @click="showSuggestedTopicsModal = true"
        class="flex flex-row justify-center items-center px-5 py-3 gap-1.5 w-[280px] h-[43px] bg-[#EFAE45] border-[1.5px] border-white shadow-[0px_2px_0px_#EFAE45] rounded-full hover:brightness-110 transition-all"
      >
        <SparkleIcon class="w-[18px] h-[18px] text-white" />
        <span class="text-white font-bold text-[14px] leading-[19px] whitespace-nowrap" style="font-family: 'Noto Sans'">
          Check our suggested topics
        </span>
      </button>

      <!-- Players Card -->
      <RoleSelection v-if="isHost" class="mt-10 mb-4" @selectRole="onRoleSelect" />
      <div v-else id="role-view" class="flex space-x-2 items-end mb-4">
        <h3 class="text-gray opacity-70">And your stance is </h3>
        <RoleUnkown class="h-18 w-18 overflow-visible" v-if="!roleKnown" />
        <component v-else :is="myRole === 'plus' ? PlusSelected : MinusSelected" class="h-18 w-18 overflow-visible" />
      </div>

      <PlayerAgreement
        v-if="players.length === 2"
        :my-acknowledged="myAcknowledged"
        :peer-acknowledged="peerAcknowledged"
        @update:acknowledged="onAcknowledgmentUpdate"
        class="mt-0 mb-10"
      />

      <!-- Confirm Button -->
      <button @click="startGame" v-if="isHost" class="w-full max-w-sm form-base btn-primary mt-10">
        Start the game
      </button>
    </section>

    <SuggestedTopicsModal 
      :is-open="showSuggestedTopicsModal" 
      @close="showSuggestedTopicsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true })

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io, Socket } from 'socket.io-client'
import { useAlerts } from '@/composables/useAlerts'
import SwitchSidesIcon from '~/assets/icons/switch-sides.svg'
import Logo from '~/assets/logo-notext.png'
import PlayerConfirmedIcon from '~/assets/icons/player-confirmed.svg'
import PlayerMissingIcon from '~/assets/icons/player-missing.svg'
import RoleUnkown from '~/assets/icons/role-unknown.svg'
import PlusSelected from '~/assets/icons/plus-peer.svg'  
import MinusSelected from '~/assets/icons/minus-peer.svg'
import SparkleIcon from '~/assets/icons/sparkle.svg'

const { success, error, info } = useAlerts()

interface Player {
  userId: string
  name: string
  role: 'plus' | 'minus'
}

const route = useRoute()
const router = useRouter()
const gameCode = route.params.gameCode as string

const topic = ref<string | null>(null)
const players = ref<Player[]>([])
const me = ref<string | null>(null)
const isHost = ref<boolean>(false)
const isEnteringTopic = ref<boolean>(false)
const showSuggestedTopicsModal = ref<boolean>(false)
const myAcknowledged = ref<boolean[]>([false, false, false, false])
const peerAcknowledged = ref<boolean[]>([false, false, false, false])

let debounceTimer: ReturnType<typeof setTimeout>

// Derived players
const plusPlayer = computed((): Player => {
  return players.value.find(p => p.role === 'plus') || { userId: '', name: '', role: 'plus' }
})
const minusPlayer = computed((): Player => {
  return players.value.find(p => p.role === 'minus') || { userId: '', name: '', role: 'minus' }
})

const myName = computed((): string => {
  const mePlayer = players.value.find(p => p.userId === me.value)
  return mePlayer ? mePlayer.name : 'Unknown'
})

const otherPlayerName = computed((): string => {
  const otherPlayer = players.value.find(p => p.userId !== me.value)
  return otherPlayer ? otherPlayer.name : 'Waiting...'
})

const roleKnown = ref(false)

const myRole = computed<('plus' | 'minus') | null>(() => {
  return players.value.find(p => p.userId === me.value)?.role ?? null
})

const allAcknowledged = computed(() => {
  return myAcknowledged.value.every(v => v) && peerAcknowledged.value.every(v => v)
})


let socket: Socket | null = null

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:8080/api/games/${gameCode}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    const game = await res.json()
    players.value = game.data.game.players
    me.value = game.data.me
    isHost.value = game.data.game.hostId === game.data.me
    topic.value = game.data.game.topic.text
    if (players.value.length >= 2) roleKnown.value = true
  } catch (e: any) {
    error(e.message || 'Failed to fetch game data')
  }

  socket = io('http://localhost:8080', {
    transports: ['websocket'],
    withCredentials: true,
    query: { gameCode }
  })

  socket.on('playerJoined', (p: Player) => {
    if (!players.value.some(pl => pl.userId === p.userId)) {
      players.value.push(p)
      info(`${p.name} joined the game`)
    }
  })

  socket.on('playerLeft', (p: { userId: string }) => {
    players.value = players.value.filter(pl => pl.userId !== p.userId)
  })

  socket.on('rolesUpdated', ({ role, selectedBy }) => {
    roleKnown.value = true;
    players.value = players.value.map(p =>
      p.userId === selectedBy
        ? { ...p, role }
        : { ...p, role: role === 'plus' ? 'minus' : 'plus' }
    );
  });

  socket.on('choosingTopic', ({ partialTopic }: { partialTopic: string }) => {
    if (!isHost.value) topic.value = partialTopic
  })

  socket.on('gameStarted', () => {
    router.replace('/game/' + gameCode)
  })

  socket.on('agreementUpdated', ({ userId, acknowledged }: { userId: string; acknowledged: boolean[] }) => {
    if (userId !== me.value) {
      peerAcknowledged.value = acknowledged
    }
  })

  socket.on('error', (errorData: any) => {
    const message = errorData?.message || errorData || 'An error occurred'
    error(message)
  })
})

watch(topic, (newVal) => {
  if (!isHost.value || !socket) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    socket!.emit('choosingTopic', { partialTopic: newVal })
  }, 200)
})

onBeforeUnmount(() => {
  socket?.disconnect()
})

/**
 * Handle role selection from <RoleSelection />
 * - Backend default: host='plus'. Do NOT preselect this in the UI.
 * - If user selects the *other* role than their effective current role, request a switch.
 * - Otherwise, do nothing.
 */
function onRoleSelect(choice: 'plus' | 'minus') {
  if (!socket || !me.value) return
  socket.emit('selectRole', { role: choice })
}

// (Optional) remove old manual switch function if unused
// function switchRole() { ... }

function toggleTopicEntry() {
  if (isEnteringTopic.value) topic.value = null
  isEnteringTopic.value = !isEnteringTopic.value
}

function onAcknowledgmentUpdate(acknowledged: boolean[]) {
  myAcknowledged.value = acknowledged
  if (socket) {
    socket.emit('acknowledgeAgreement', { acknowledged })
  }
}

function startGame() {
  if (!socket) return
  if (!topic.value || topic.value.trim() === '') {
    error('Please enter a topic before starting the game')
    return
  }
  if (players.value.length !== 2) {
    error('2 players are required to start the game')
    return
  }
  if (!roleKnown.value) {
    error('Please select your role before starting the game')
    return
  }
  if (!allAcknowledged.value) {
    error('Both players must acknowledge all agreement items before starting')
    return
  }
  console.log('Starting game with acknowledgments:', {
    my: myAcknowledged.value,
    peer: peerAcknowledged.value
  })
  socket.emit('startGame')
}
</script>


<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0
}
.outer:before {
  position: absolute;
  inset: -1px;
  /*negative value, same size as border*/
  transform: rotate(45deg);
  content: '';
  border: inherit;
  background: white
}

.inner:before {
  position: absolute;
  inset: -3px;
  /*negative value, same size as border*/
  transform: rotate(45deg);
  content: '';
  border: inherit;
}
</style>

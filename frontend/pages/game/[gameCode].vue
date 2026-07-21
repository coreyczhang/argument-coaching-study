<template>
  <div class="flex flex-col items-center justify-start min-h-screen pt-12 relative">
    <RoomCodeDisplay :game-code="gameCode" />
    <div class="fixed z-30 top-8 right-8 flex flex-col space-y-2 items-center">
      <div id="role" class="flex space-x-2 justify-center items-end">
        <MinusPeer class="w-14 h-14" v-if="myRole === 'minus'" />
        <PlusPeer class="w-14 h-14" v-else-if="myRole === 'plus'" />
        <h3 :style="`
          text-shadow:
            -4px -4px 0 white,
            4px -4px 0 white,
            -4px  4px 0 white,
            4px  4px 0 white;
          color: ${myRole === 'plus' ? '#49CA81' : '#FFB42F'}
        `">{{ myRole }} peer</h3>
      </div>
      <div v-if="isAiMode" class="flex items-center gap-1.5 rounded-full bg-[#fff8ef] border border-[#d8cbb7] px-3 py-1">
        <span class="text-xs font-bold text-[#c07a2d]">✦ vs AI</span>
      </div>
      <InfoDisplay :resolved-threads-count="resolvedThreadsCount" :resolved-threads="resolvedThreads"
        :is-topic-revised="isTopicRevised" :threads="resolvedThreads"
        @open-topic-revision="isTopicRevisionOpen = !isTopicRevisionOpen"
        @open-instructions="isInstructionsOpen = true" />
    </div>
    <div ref="boardPane" class="relative w-full flex-1">
      <div
        v-if="quickSuccessMessage"
        class="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#3b342f] px-5 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {{ quickSuccessMessage }}
      </div>

      <GameBoard v-if="game" :game="game" :my-role="myRole" :topic-proposal="topicProposal"
        :isTopicRevisionOpen="isTopicRevisionOpen" :hide-topic-tile="isTopicRevised || resolvedThreadsCount === 4" @tile-typing="onTileTyping" @tile-confirm="onTileConfirm"
        @tile-place="onTilePlace"
        @emoji-place="onEmojiPlace"
        @undo-emoji-place="onUndoEmojiPlace"
        @update-resolved-threads="onUpdateResolvedThreads" @propose-topic-revision="onTopicProposal"
        @close-topic-revision="onCloseTopicRevision"
        @reject-topic-proposal="onRejectTopicProposal"
        @topic-revise="onTopicRevision(topicProposal)" />

      <div
        v-if="aiFeedback && popupPosition"
        class="absolute z-40 w-[24rem] rounded-[1.5rem] border border-[#3b342f] bg-white p-5 shadow-[0_18px_40px_rgba(59,52,47,0.18)]"
        :style="{ left: `${popupPosition.left}px`, top: `${popupPosition.top}px` }"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d]">Argument coach</p>
            <h2 class="mt-1 text-lg font-bold">Here's a tip 💡</h2>
          </div>
          <button class="text-sm text-[#5e564f]" @click="rejectFeedback">✕</button>
        </div>

        <p class="mt-3 text-sm leading-6">{{ aiFeedback.feedback }}</p>

        <p v-if="readableErrorTypes.length" class="mt-3 text-xs uppercase tracking-[0.2em] text-[#8d8379]">
          {{ readableErrorTypes.join(" • ") }}
        </p>

        <div v-if="categoryTip" class="mt-4 rounded-2xl bg-[#f0f4ff] p-4">
          <p class="text-xs font-bold uppercase tracking-[0.15em] text-[#8d8379]">How to make it stronger</p>
          <p class="mt-2 text-sm text-[#3b342f]">{{ categoryTip }}</p>
        </div>

        <div v-if="suggestionDraft || aiFeedback.suggestion" class="mt-4 rounded-2xl bg-[#fff8ef] p-4">
          <p class="text-xs font-bold uppercase tracking-[0.15em] text-[#8d8379]">Try this version — feel free to edit it</p>
          <textarea
            v-model="suggestionDraft"
            rows="3"
            maxlength="100"
            class="mt-2 w-full resize-none rounded-xl border border-[#e8ddd6] bg-white px-3 py-2 text-sm leading-6 text-[#3b342f] focus:border-[#c07a2d] focus:outline-none"
            placeholder="Edit the suggestion or write your own…"
          />
          <p class="mt-1 text-right text-xs text-[#b0a89f]">{{ suggestionDraft.length }}/100</p>
        </div>

        <div class="mt-5 flex flex-wrap gap-3">
          <button
            v-if="suggestionDraft"
            class="rounded-full border border-[#3b342f] bg-[#3b342f] px-4 py-2 text-sm font-semibold text-white"
            @click="acceptSuggestion"
          >
            Use this
          </button>
          <button
            class="rounded-full border border-[#e8ddd6] px-4 py-2 text-sm text-[#8d8379]"
            @click="rejectFeedback"
          >
            Keep mine
          </button>
        </div>
      </div>

      <div
        v-if="isEvaluating && loadingPosition"
        class="absolute z-40 flex items-center gap-2 rounded-full border border-[#3b342f] bg-white px-4 py-2 shadow-[0_4px_16px_rgba(59,52,47,0.14)]"
        :style="{ left: `${loadingPosition.left}px`, top: `${loadingPosition.top}px` }"
      >
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.3s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.15s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d]"></span>
        <span class="ml-1 text-xs font-semibold text-[#5e564f]">Reading…</span>
      </div>

      <!-- AI thinking indicator -->
      <div
        v-if="isAiThinking"
        class="absolute z-40 left-1/2 top-6 -translate-x-1/2 flex items-center gap-2 rounded-full border border-[#7a5c32] bg-[#fff8ef] px-5 py-2 shadow-[0_4px_16px_rgba(59,52,47,0.14)]"
      >
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.3s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.15s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d]"></span>
        <span class="ml-1 text-xs font-semibold text-[#7a5c32]">AI is thinking…</span>
      </div>
    </div>
    <WinAlert v-if="isTopicRevised" winCondition="topic" :newTopic="game!.topic.text" />
    <WinAlert v-else-if="resolvedThreadsCount === 4" winCondition="threads" :threads="resolvedThreadsForAlert" />
    <InstructionsModal :is-open="isInstructionsOpen" @close="isInstructionsOpen = false" />

    <OnboardingModal v-if="isTutorialOpen" :is-open="isTutorialOpen" :my-role="myRole" @close="hideTutorial" />
    
    <FactCheckModal
      v-if="activeEmojiResolution?.emoji === 'shared-facts' && myRole"
      :is-open="!!activeEmojiResolution"
      :role="activeEmojiResolution.role"
      :my-role="myRole"
      v-bind="activeEmojiResolution.data"
      @close="closeEmojiResolution"
      @reject="rejectEmojiResolution"
      @typing="emitEmojiResolutionTyping"
      @submit="submitEmojiResolution"
    />
    
    <PersonalTasteModal
      v-if="activeEmojiResolution?.emoji === 'wine' && myRole"
      :is-open="!!activeEmojiResolution"
      :role="activeEmojiResolution.role"
      :my-role="myRole"
      v-bind="activeEmojiResolution.data"
      @close="closeEmojiResolution"
      @reject="rejectEmojiResolution"
      @typing="emitEmojiResolutionTyping"
      @submit="submitEmojiResolution"
    />
    
    <PrioritiesModal
      v-if="activeEmojiResolution?.emoji === 'scale' && myRole"
      :is-open="!!activeEmojiResolution"
      :role="activeEmojiResolution.role"
      :my-role="myRole"
      v-bind="activeEmojiResolution.data"
      @close="closeEmojiResolution"
      @reject="rejectEmojiResolution"
      @typing="emitEmojiResolutionTyping"
      @submit="submitEmojiResolution"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true })

import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io, Socket } from 'socket.io-client'
import type { AiFeedback, Game, GamePlayer, Position, Tile } from '../../types'
import { logFeedbackAction } from '~/composables/useAiFeedback'
import { useAlerts } from '@/composables/useAlerts'
const { success, error, info } = useAlerts()
import GameBoard from '../../components/GameBoard.vue'
import RoomCodeDisplay from '../../components/RoomCodeDisplay.vue'
import FactCheckModal from '../../components/FactCheckModal.vue'
import PersonalTasteModal from '../../components/PersonalTasteModal.vue'
import PrioritiesModal from '../../components/PrioritiesModal.vue'
import MinusPeer from '~/assets/icons/minus-peer.svg'
import PlusPeer from '~/assets/icons/plus-peer.svg'

const route = useRoute()
const router = useRouter()
const gameCode = (route.params.gameCode as string) || ''
const isAiMode = computed(() => route.query.aiMode === 'true')
const isAiThinking = ref(false)

const game = ref<Game | null>(null)
const players = ref<GamePlayer[]>([])
const me = ref<string | null>(null)
const resolvedThreads = ref<Array<'wine' | 'shared-facts' | 'scale' | 'thumbs-up' | null>>([null, null, null, null])
const resolvedThreadsCount = computed(() =>
  resolvedThreads.value.filter(Boolean).length
)

const resolvedThreadsForAlert = computed(() =>
  resolvedThreads.value.filter((x): x is 'wine' | 'shared-facts' | 'scale' | 'thumbs-up' => x !== null)
)
const isTopicRevised = ref<boolean>(false)
const topicProposal = ref<string>('')
const isTopicRevisionOpen = ref<boolean>(false)
const isInstructionsOpen = ref<boolean>(false)
const isTutorialOpen = ref<boolean>(true)

const boardPane = ref<HTMLElement | null>(null)
const aiFeedback = ref<AiFeedback | null>(null)
const suggestionDraft = ref<string>('')
const isEvaluating = ref(false)
const popupPosition = ref<{ left: number; top: number } | null>(null)
const loadingPosition = ref<{ left: number; top: number } | null>(null)
const quickSuccessMessage = ref('')
const lastConfirmedTileId = ref<string | null>(null)
let quickSuccessTimer: number | null = null
let evaluationTimeout: number | null = null

const KNOWN_PREFIXES = ['Yes, because', 'No, because', 'Because', 'But']
function stripPrefix(text: string): string {
  for (const prefix of KNOWN_PREFIXES) {
    if (text.toLowerCase().startsWith(prefix.toLowerCase() + ' ')) {
      return text.slice(prefix.length + 1).trimStart()
    }
  }
  return text
}

const readableErrorTypes = computed(() => {
  const firstWave = aiFeedback.value?.first_wave_categories
  if (firstWave?.length) return firstWave.map((c) => c.replaceAll('_', ' '))
  return (aiFeedback.value?.error_types ?? []).map((type) => {
    switch (type) {
      case 'clarification_needed': return 'needs more detail'
      case 'irrelevant_rebuttal': return 'needs clearer connection'
      case 'false_causation': return 'causal leap'
      case 'overgeneralization': return 'too broad'
      default: return type.replaceAll('_', ' ')
    }
  })
})

const CATEGORY_TIPS: Record<string, string> = {
  too_broad: 'Narrow the claim to a specific group, case, or condition instead of making it universal.',
  causal_leap: 'Explain why the cause actually leads to the outcome instead of jumping from sequence or correlation.',
  needs_more_detail: 'Add a concrete reason, example, mechanism, or consequence so the point is easier to evaluate.',
  needs_clearer_connection: 'Make it explicit how this point supports or rebuts the parent tile.',
  personal_attack: 'Address the argument itself, not the person making it.',
  exaggeration: 'Dial back the claim to what the evidence can actually support.',
  straw_man: 'Represent the opposing view accurately before you respond to it.',
}

const categoryTip = computed(() => {
  const cats = aiFeedback.value?.first_wave_categories ?? []
  for (const cat of cats) {
    if (CATEGORY_TIPS[cat]) return CATEGORY_TIPS[cat]
  }
  return null
})

function dismissFeedback() {
  aiFeedback.value = null
  popupPosition.value = null
  suggestionDraft.value = ''
}

function rejectFeedback() {
  logFeedbackAction({
    tileId: lastConfirmedTileId.value,
    action: 'dismissed',
    originalSuggestion: aiFeedback.value?.suggestion ?? null,
    editedSuggestion: null,
    gameId: gameCode ?? null,
    aiFeedback: aiFeedback.value,
  })
  dismissFeedback()
  showQuickSuccess('Kept your version.')
  if (isAiMode.value) triggerAiTurn()
}

function acceptSuggestion() {
  if (!lastConfirmedTileId.value || !game.value) return
  const text = suggestionDraft.value.trim()
  if (!text) return
  const tile = game.value.gameBoard[lastConfirmedTileId.value]
  if (!tile) return

  logFeedbackAction({
    tileId: lastConfirmedTileId.value,
    action: 'accepted',
    originalSuggestion: aiFeedback.value?.suggestion ?? null,
    editedSuggestion: text,
    gameId: gameCode ?? null,
    aiFeedback: aiFeedback.value,
  })

  tile.text = text
  tile.confirmed = true
  dismissFeedback()
  showQuickSuccess('Suggestion applied.')
  if (isAiMode.value) triggerAiTurn()
}

function showQuickSuccess(message: string) {
  quickSuccessMessage.value = message
  quickSuccessTimer = window.setTimeout(() => {
    quickSuccessMessage.value = ''
    quickSuccessTimer = null
  }, 2500)
}

function calculatePopupPosition(tileId: string, popupWidth: number, popupHeight: number) {
  const pane = boardPane.value
  const tileEl = document.getElementById(`tile-${tileId}`)
  if (!pane || !tileEl) return null
  const paneRect = pane.getBoundingClientRect()
  const tileRect = tileEl.getBoundingClientRect()
  const gutter = 16
  let left = tileRect.right - paneRect.left + pane.scrollLeft + gutter
  let top = tileRect.top - paneRect.top + pane.scrollTop
  const maxLeft = pane.scrollLeft + pane.clientWidth - popupWidth - 24
  const minLeft = pane.scrollLeft + 24
  if (left > maxLeft) left = tileRect.left - paneRect.left + pane.scrollLeft - popupWidth - gutter
  left = Math.max(minLeft, Math.min(left, maxLeft))
  const maxTop = pane.scrollTop + pane.clientHeight - popupHeight - 24
  top = Math.max(pane.scrollTop + 24, Math.min(top, maxTop))
  return { left, top }
}

const activeEmojiResolution = ref<{
  emoji: string
  tileId: string
  role: 'placer' | 'peer'
  data: {
    placerSubmission: string | null
    peerSubmission: string | null
    peerTyping: boolean
    peerWaiting: boolean
  }
} | null>(null)

const pendingEmojiPlacement = ref<boolean>(false)
const EMOJIS_REQUIRING_RESOLUTION = ['shared-facts', 'wine', 'scale']

let socket: Socket
let gameStartTime: number

onMounted(async () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    const homeUrl = window.location.origin + '/'
    window.history.replaceState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)
    
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', window.location.href)
      navigateTo('/')
    })
  }

  const res = await fetch(`http://localhost:8080/api/games/${gameCode}`, { credentials: 'include' })
  const { data } = await res.json()
  game.value = data.game
  players.value = data.game.players
  me.value = data.me
  game.value!.gameBoard[0].text = game.value!.topic.text
  isTopicRevised.value = game.value!.topic.revised

  gameStartTime = Date.now()
  window.dataLayer?.push({ event: 'game_start', game_start_time: gameStartTime })

  socket = io('http://localhost:8080', {
    transports: ['websocket'],
    withCredentials: true,
    query: { gameCode }
  })

  socket.emit('joinRoom', gameCode)

  socket.on('typingTile', handleTypingTile)
  socket.on('confirmTile', handleConfirmTile)
  socket.on('aiFeedback', handleAiFeedback)
  socket.on('placeTile', handleTilePlaced)
  socket.on('placeEmoji', handleEmojiPlaced)
  socket.on('undoPlaceEmoji', handleUndoPlaceEmoji)
  socket.on('reviseTopicProposal', handleTopicProposal)
  socket.on('reviseTopic', handleTopicRevision)
  socket.on('rejectTopicProposal', handleTopicProposalRejected)
  socket.on('emojiResolutionOpened', handleEmojiResolutionOpened)
  socket.on('emojiResolutionTyping', handleEmojiResolutionTyping)
  socket.on('emojiResolutionSubmit', handleEmojiResolutionSubmit)
  socket.on('emojiResolutionClosed', handleEmojiResolutionClosed)
  socket.on('emojiResolutionRejected', handleEmojiResolutionRejected)
})

const myRole = computed<'plus' | 'minus' | null>(() => {
  if (!game.value || !me.value) return null
  const p = players.value.find(p => p.userId === me.value)
  return p ? p.role : null
})

// Event handlers for GameBoard emits
function onTileTyping({ tileId, partial }: { tileId: string; partial: string }) {
  socket.emit('typingTile', { userId: me.value, tileId, partialText: partial })
}

function onTileConfirm({ tileId, text }: { tileId: string; text: string }) {
  socket.emit('confirmTile', { userId: me.value, tileId, text })
  if (game.value) game.value.gameBoard[tileId].text = text
  lastConfirmedTileId.value = tileId
  aiFeedback.value = null
  popupPosition.value = null
  isEvaluating.value = true
  nextTick(() => {
    loadingPosition.value = calculatePopupPosition(tileId, 140, 36)
  })
  evaluationTimeout = window.setTimeout(() => {
    isEvaluating.value = false
    loadingPosition.value = null
    evaluationTimeout = null
    if (isAiMode.value) {
      triggerAiTurn()
    } else {
      info('Coaching unavailable — tile confirmed.')
    }
  }, 12000)
}

function onTilePlace({ parentEdge, parentId, pos }: { parentEdge: number; parentId: string; pos: Position }) {
  const existingIds = Object.keys(game.value!.gameBoard)
  const newTileId = (existingIds.length).toString()

  const newTile: Tile = {
    tileId: newTileId,
    parentId,
    parentEdge,
    children: [],
    player: myRole.value,
    text: '',
    emoji: null,
    ruleCard: null,
    confirmed: false,
    revised: false
  }
  socket.emit('placeTile', newTile)
}

function onEmojiPlace({ tileId, emoji }: { tileId: string; emoji: string | null }) {
  if (!game.value || !emoji) return
  const tile = game.value.gameBoard[tileId]
  
  if (EMOJIS_REQUIRING_RESOLUTION.includes(emoji)) {
    tile.emoji = emoji
    pendingEmojiPlacement.value = true
    activeEmojiResolution.value = {
      emoji,
      tileId,
      role: 'placer',
      data: {
        placerSubmission: null,
        peerSubmission: null,
        peerTyping: false,
        peerWaiting: true
      }
    }
    socket.emit('emojiResolutionOpened', { userId: me.value, tileId, emoji })
  } else {
    tile.emoji = emoji
    socket.emit('placeEmoji', { userId: me.value, tileId, emoji })
    success('Emoji placed — thread resolved!')
  }
}

function onUndoEmojiPlace({ tileId }: { tileId: string }) {
  if (!game.value) return
  const tile = game.value.gameBoard[tileId]
  tile.emoji = null
  resolvedThreads.value[parseInt(tileId) - 1] = null
  socket.emit('undoPlaceEmoji', { userId: me.value, tileId })
  info('Emoji removed — thread unresolved')
}

function onUpdateResolvedThreads({ thread, emoji }: { thread: number, emoji: "wine" | "shared-facts" | "scale" | "thumbs-up" }) {
  resolvedThreads.value[thread - 1] = emoji
  if (resolvedThreads.value.filter(Boolean).length === 4) {
    window.dataLayer?.push({ event: 'game_end', time_spent_seconds: Math.round((Date.now() - gameStartTime) / 1000) })
  }
}

function onTopicProposal(revision: string) {
  socket.emit('reviseTopicProposal', revision)
  info('You have proposed a new topic')
}

function onCloseTopicRevision() {
  isTopicRevisionOpen.value = false
}

function onTopicRevision(revision: string) {
  socket.emit('reviseTopic', revision)
}
//* Disabled RULE CARD and TILE REVISION features for now
// function onRuleCardPlace({ tileId, card }: { tileId: string; card: string | null }) {
//   if (!game.value) return
//   const tile = game.value.gameBoard[tileId]
//   tile.ruleCard = card
//   tile.revised = false
//   tile.confirmed = false
//   socket.emit('placeRuleCard', { userId: me.value, tileId, card })
// }

// function onTileRevise({ tileId, text }: { tileId: string; text: string }) {
//   if (!game.value) return
//   const tile = game.value.gameBoard[tileId]
//   tile.text = text
//   tile.revised = true
//   tile.confirmed = true
//   socket.emit('reviseTile', { userId: me.value, tileId, text })
//   info('Tile revised successfully')
// }

function onRejectTopicProposal() {
  socket.emit('rejectTopicProposal', { userId: me.value })
  isTopicRevisionOpen.value = false
  topicProposal.value = ''
}

async function handleAiFeedback(feedback: AiFeedback) {
  if (evaluationTimeout) {
    window.clearTimeout(evaluationTimeout)
    evaluationTimeout = null
  }
  isEvaluating.value = false
  loadingPosition.value = null

  // DEV-168: validate response has required fields before using
  if (!feedback || typeof feedback !== 'object' || !('display_feedback' in feedback || 'errors_found' in feedback)) {
    info('Coaching unavailable — tile confirmed.')
    return
  }

  const shouldShow = feedback.display_feedback ?? feedback.errors_found
  if (!shouldShow) {
    showQuickSuccess('Looks good. Moving on.')
    if (isAiMode.value) triggerAiTurn()
    return
  }
  aiFeedback.value = feedback
  const rawSuggestion = feedback.suggestion ?? feedback.clarify?.rewrites?.[0] ?? ''
  suggestionDraft.value = rawSuggestion ? stripPrefix(rawSuggestion) : ''
  await nextTick()
  if (lastConfirmedTileId.value) {
    popupPosition.value = calculatePopupPosition(lastConfirmedTileId.value, 384, 320)
  }
}

function handleTypingTile({ userId, tileId, partialText }: any) {
  if (userId === me.value) return
  const p = players.value.find(p => p.userId === userId)
  if (p && game.value) {
    game.value.gameBoard[tileId].text = `${p.name} is typing…`
  }
}

function handleConfirmTile({ userId, tileId, text }: any) {
  if (game.value) {
    game.value.gameBoard[tileId].text = text
    game.value.gameBoard[tileId].confirmed = true
  }
}

function handleTilePlaced({ userId, tile }: { userId: string; tile: Tile }) {
  if (!game.value) return
  game.value.gameBoard[tile.tileId] = tile
  game.value.gameBoard[tile.parentId!].children.push(tile.tileId)
}

function handleEmojiPlaced({ userId, tileId, emoji }: { userId: string; tileId: string; emoji: string | null }) {
  if (!game.value) return
  const tile = game.value.gameBoard[tileId]
  tile.emoji = emoji
  if (userId !== me.value) info('Other player placed an emoji — thread resolved!')
}

function handleUndoPlaceEmoji({ userId, tileId }: { userId: string; tileId: string }) {
  if (!game.value) return
  const tile = game.value.gameBoard[tileId]
  tile.emoji = null
  resolvedThreads.value[parseInt(tileId) - 1] = null
  if (userId !== me.value) info('Other player removed an emoji — thread unresolved')
}

function handleTopicProposal({ userId, topic }: { userId: string, topic: string }) {
  if (userId === me.value) return
  topicProposal.value = topic
  if (userId !== me.value) info('Other player has proposed a new topic')
}

function handleTopicRevision(revision: string) {
  topicProposal.value = ''
  isTopicRevised.value = true
  game.value!.topic.text = revision
  game.value!.topic.revised = true
  window.dataLayer?.push({ event: 'game_end', time_spent_seconds: Math.round((Date.now() - gameStartTime) / 1000) })
}

//* Disabled RULE CARD and TILE REVISION features for now
// function handleRuleCardPlaced({ userId, tileId, card }: { userId: string; tileId: string; card: string | null }) {
//   if (!game.value) return
//   const tile = game.value.gameBoard[tileId]
//   tile.ruleCard = card
//   tile.revised = false
//   tile.confirmed = false
//   if (userId !== me.value) info('Other player has placed a rule card on your tile')
// }

// function handleTileRevised({ userId, tileId, text }: any) {
//   if (userId === me.value) return
//   const tile = game.value!.gameBoard[tileId]
//   tile.text = text
//   tile.revised = true
//   tile.confirmed = true
//   if (userId !== me.value) info('Other player has revised a tile')
// }

function findAiFreeEdge(parentId: string): number {
  if (!game.value) return 0
  const parent = game.value.gameBoard[parentId]
  if (!parent) return 0
  const usedEdges = new Set<number>()
  for (const childId of parent.children) {
    const child = game.value.gameBoard[childId]
    if (child?.parentEdge != null) usedEdges.add(child.parentEdge)
  }
  for (const e of [1, 3, 5, 7, 0, 2, 4, 6]) {
    if (!usedEdges.has(e)) return e
  }
  return 0
}

async function triggerAiTurn() {
  if (!game.value || !myRole.value || isAiThinking.value) return
  const aiRole = myRole.value === 'plus' ? 'minus' : 'plus'
  const topic = game.value.topic.text

  isAiThinking.value = true
  try {
    const res = await fetch('http://localhost:8001/co-player/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_board: game.value.gameBoard,
        topic,
        ai_role: aiRole,
      })
    })
    if (!res.ok) throw new Error('AI service unavailable')
    const data = await res.json()

    const parentId = data.parent_id ?? '0'
    const text = data.text ?? ''
    if (!text || !game.value.gameBoard[parentId]) {
      isAiThinking.value = false
      return
    }

    // Generate a new tile ID
    const newTileId = Object.keys(game.value.gameBoard).length.toString()
    const freeEdge = findAiFreeEdge(parentId)

    const aiTile: Tile = {
      tileId: newTileId,
      parentId,
      parentEdge: freeEdge,
      children: [],
      player: aiRole,
      text,
      emoji: null,
      ruleCard: null,
      confirmed: true,
      revised: false,
      isAiTile: true,
    } as any

    // Add tile to local board
    game.value.gameBoard[newTileId] = aiTile
    game.value.gameBoard[parentId].children.push(newTileId)

    // Emit to socket so server can persist the AI tile
    socket.emit('placeTile', aiTile)
    socket.emit('confirmTile', {
      userId: 'ai-coplayer',
      tileId: newTileId,
      text,
      aiMetadata: {
        strategy: data.strategy ?? null,
        angle: data.angle ?? null,
        model_name: data.model_name ?? null,
        prompt_version: data.prompt_version ?? null,
        evaluated_at: data.evaluated_at ?? null,
      },
    })

    // Fire-and-forget: log AI turn for research (FR-11 / BE-04)
    fetch('http://localhost:8001/co-player/log-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: gameCode ?? null,
        tile_id: newTileId,
        parent_id: parentId,
        text,
        ai_role: aiRole,
        strategy: data.strategy ?? null,
        angle: data.angle ?? null,
        model_name: data.model_name ?? null,
        prompt_version: data.prompt_version ?? null,
        evaluated_at: data.evaluated_at ?? null,
      }),
    }).catch(() => {})
  } catch (e) {
    info('AI opponent is unavailable — your turn.')
  } finally {
    isAiThinking.value = false
  }
}

function hideTutorial() {
  isTutorialOpen.value = false
}

function handleTopicProposalRejected(userId: string) {
  if (userId !== me.value) info('Other player has rejected your topic proposal')
  topicProposal.value = ''
  isTopicRevisionOpen.value = false
}

function handleEmojiResolutionOpened({ userId, tileId, emoji }: { userId: string; tileId: string; emoji: string }) {
  if (userId === me.value) return
  
  activeEmojiResolution.value = {
    emoji,
    tileId,
    role: 'peer',
    data: {
      placerSubmission: null,
      peerSubmission: null,
      peerTyping: false,
      peerWaiting: true
    }
  }
}

function handleEmojiResolutionTyping({ userId }: { userId: string }) {
  if (userId === me.value || !activeEmojiResolution.value) return
  
  activeEmojiResolution.value.data.peerTyping = true
  setTimeout(() => {
    if (activeEmojiResolution.value) {
      activeEmojiResolution.value.data.peerTyping = false
    }
  }, 2000)
}

function handleEmojiResolutionSubmit({ userId, submission, emoji }: { userId: string; submission: string; emoji: string }) {
  if (userId === me.value || !activeEmojiResolution.value) return
  
  const resolution = activeEmojiResolution.value
  
  if (resolution.role === 'peer') {
    resolution.data.placerSubmission = submission
    resolution.data.peerWaiting = false
  } else {
    resolution.data.peerSubmission = submission
  }
  
  if (resolution.data.placerSubmission && resolution.data.peerSubmission) {
    const tileId = resolution.tileId
    socket.emit('placeEmoji', { userId: me.value, tileId, emoji })
    success('Emoji placed — thread resolved!')
    pendingEmojiPlacement.value = false
    closeEmojiResolution()
  }
}

function handleEmojiResolutionClosed({ userId }: { userId: string }) {
  if (userId === me.value) return
  activeEmojiResolution.value = null
}

function handleEmojiResolutionRejected({ userId, tileId }: { userId: string; tileId: string }) {
  if (userId === me.value) return
  
  if (game.value && tileId) {
    game.value.gameBoard[tileId].emoji = null
    
    const tileNum = parseInt(tileId)
    if (tileNum >= 1 && tileNum <= 4) {
      resolvedThreads.value[tileNum - 1] = null
    }
  }
  
  activeEmojiResolution.value = null
  pendingEmojiPlacement.value = false
  info('Peer cancelled emoji resolution')
}

function closeEmojiResolution() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  
  socket.emit('emojiResolutionClosed', { 
    userId: me.value, 
    tileId: resolution.tileId, 
    emoji: resolution.emoji 
  })
  activeEmojiResolution.value = null
}

function rejectEmojiResolution() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  
  const { tileId, emoji } = resolution
  
  if (game.value && tileId) {
    game.value.gameBoard[tileId].emoji = null
    
    const tileNum = parseInt(tileId)
    if (tileNum >= 1 && tileNum <= 4) {
      resolvedThreads.value[tileNum - 1] = null
    }
  }
  
  pendingEmojiPlacement.value = false
  
  socket.emit('emojiResolutionRejected', { userId: me.value, tileId, emoji })
  activeEmojiResolution.value = null
  
  info('Emoji resolution cancelled')
}

function emitEmojiResolutionTyping() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  
  socket.emit('emojiResolutionTyping', { 
    userId: me.value, 
    tileId: resolution.tileId, 
    emoji: resolution.emoji 
  })
}

function submitEmojiResolution(text: string) {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  
  if (resolution.role === 'placer') {
    resolution.data.placerSubmission = text
  } else {
    resolution.data.peerSubmission = text
  }
  
  socket.emit('emojiResolutionSubmit', { 
    userId: me.value, 
    tileId: resolution.tileId, 
    emoji: resolution.emoji,
    submission: text 
  })
  
  if (resolution.data.placerSubmission && resolution.data.peerSubmission) {
    socket.emit('placeEmoji', { userId: me.value, tileId: resolution.tileId, emoji: resolution.emoji })
    success('Emoji placed — thread resolved!')
    pendingEmojiPlacement.value = false
    closeEmojiResolution()
  }
}

</script>

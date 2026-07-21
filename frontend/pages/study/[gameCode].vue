<template>
  <!-- CONSENT STAGE -->
  <div v-if="stage === 'consent'" class="min-h-screen bg-[#faf7f4] flex items-center justify-center p-6">
    <div class="max-w-2xl w-full bg-white rounded-3xl border border-[#e8ddd6] shadow-sm p-10">
      <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d] mb-2">Research Study</p>
      <h1 class="text-3xl font-bold text-[#3b342f] mb-6">Welcome to Point Taken</h1>
      <div class="prose text-[#5e564f] text-sm leading-7 space-y-4 mb-8">
        <p>You are invited to participate in a study about <strong>collaborative argumentation</strong>. In this study, you will play a game with another participant where you each construct arguments about a topic and respond to each other's points.</p>
        <p><strong>What you'll do:</strong> You'll be paired with another participant and given a debatable topic. Each player takes a position (for or against) and writes arguments on a shared game board. The game ends when all four argument threads are resolved.</p>
        <p v-if="studyCondition === 'AI_FEEDBACK'"><strong>AI feedback:</strong> After you write each argument, an AI coach will review it and offer suggestions to strengthen your reasoning.</p>
        <p><strong>Time:</strong> This study takes approximately 15–20 minutes.</p>
        <p><strong>Confidentiality:</strong> Your responses are anonymous. Data is stored securely and used only for research purposes.</p>
        <p><strong>Voluntary:</strong> Participation is voluntary. You may stop at any time.</p>
      </div>
      <label class="flex items-start gap-3 cursor-pointer mb-8">
        <input type="checkbox" v-model="consentChecked" class="mt-1 w-4 h-4 accent-[#c07a2d]" />
        <span class="text-sm text-[#3b342f]">I have read and understood the information above and voluntarily agree to participate in this study.</span>
      </label>
      <button
        :disabled="!consentChecked"
        @click="stage = 'pre-survey'"
        class="w-full rounded-full bg-[#3b342f] text-white font-semibold py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
      >Continue to Survey →</button>
    </div>
  </div>

  <!-- PRE-SURVEY STAGE -->
  <div v-else-if="stage === 'pre-survey'" class="min-h-screen bg-[#faf7f4] flex items-center justify-center p-6">
    <div class="max-w-2xl w-full bg-white rounded-3xl border border-[#e8ddd6] shadow-sm p-10">
      <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d] mb-2">Before the Game</p>
      <h1 class="text-2xl font-bold text-[#3b342f] mb-4">A few quick questions</h1>

      <!-- Show the debate topic so the stance/familiarity questions make sense -->
      <div v-if="topicText" class="mb-8 rounded-2xl bg-[#fff8ef] border border-[#f0e2d3] p-5">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#8d8379] mb-1">The topic you'll be discussing</p>
        <p class="text-lg font-semibold text-[#3b342f]">"{{ topicText }}"</p>
      </div>

      <div class="space-y-8">
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">1. What is your age range?</label>
          <div class="flex flex-wrap gap-3">
            <button v-for="opt in ['18–24','25–34','35–44','45–54','55–64','65+']" :key="opt"
              @click="preSurvey.ageRange = opt"
              :class="['rounded-full border px-4 py-2 text-sm transition', preSurvey.ageRange === opt ? 'bg-[#3b342f] text-white border-[#3b342f]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#3b342f]']">
              {{ opt }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">2. How would you describe your political leaning?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Very liberal</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 7" :key="n"
                @click="preSurvey.politicalLeaning = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', preSurvey.politicalLeaning === n ? 'bg-[#3b342f] text-white border-[#3b342f]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#3b342f]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Very conservative</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">3. How familiar are you with the topic you'll discuss?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Not at all</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 5" :key="n"
                @click="preSurvey.topicFamiliarity = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', preSurvey.topicFamiliarity === n ? 'bg-[#3b342f] text-white border-[#3b342f]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#3b342f]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Very familiar</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">4. What is your initial stance on this topic?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Strongly oppose</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 7" :key="n"
                @click="preSurvey.initialStance = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', preSurvey.initialStance === n ? 'bg-[#3b342f] text-white border-[#3b342f]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#3b342f]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Strongly support</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">5. How often do you discuss politics or social issues with others?</label>
          <div class="flex flex-wrap gap-3">
            <button v-for="opt in ['Never','Rarely','Sometimes','Often','Very often']" :key="opt"
              @click="preSurvey.discussionFrequency = opt"
              :class="['rounded-full border px-4 py-2 text-sm transition', preSurvey.discussionFrequency === opt ? 'bg-[#3b342f] text-white border-[#3b342f]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#3b342f]']">
              {{ opt }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="initError" class="mt-4 text-sm text-red-600 font-medium">{{ initError }}</p>
      <div class="mt-6 flex justify-between items-center">
        <button @click="stage = 'consent'" class="text-sm text-[#8d8379] hover:text-[#3b342f]">← Back</button>
        <button
          :disabled="!preSurveyComplete"
          @click="proceedToGame"
          class="rounded-full bg-[#3b342f] text-white font-semibold px-8 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
        >Start Game →</button>
      </div>
    </div>
  </div>

  <!-- WAITING FOR PARTNER -->
  <div v-else-if="stage === 'waiting'" class="min-h-screen bg-[#faf7f4] flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-white rounded-3xl border border-[#e8ddd6] shadow-sm p-10 text-center">
      <div class="flex justify-center mb-6">
        <span class="h-4 w-4 animate-bounce rounded-full bg-[#c07a2d] mx-1 [animation-delay:-0.3s]"></span>
        <span class="h-4 w-4 animate-bounce rounded-full bg-[#c07a2d] mx-1 [animation-delay:-0.15s]"></span>
        <span class="h-4 w-4 animate-bounce rounded-full bg-[#c07a2d] mx-1"></span>
      </div>
      <h2 class="text-xl font-bold text-[#3b342f] mb-3">Waiting for your partner…</h2>
      <p class="text-sm text-[#5e564f]">Your game code is <span class="font-mono font-bold text-[#3b342f]">{{ gameCode }}</span>. Share it with your partner or have them open the same link.</p>
      <p class="mt-4 text-xs text-[#8d8379]">The game will start automatically once both players have joined.</p>
    </div>
  </div>

  <!-- POST-SURVEY STAGE -->
  <div v-else-if="stage === 'post-survey'" class="min-h-screen bg-[#faf7f4] flex items-center justify-center p-6">
    <div class="max-w-2xl w-full bg-white rounded-3xl border border-[#e8ddd6] shadow-sm p-10">
      <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#49CA81] mb-2">Game Complete</p>
      <h1 class="text-2xl font-bold text-[#3b342f] mb-8">Final survey</h1>
      <div class="space-y-8">
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">1. What is your stance on the topic <em>now</em>, after the discussion?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Strongly oppose</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 7" :key="n"
                @click="postSurvey.finalStance = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', postSurvey.finalStance === n ? 'bg-[#49CA81] text-white border-[#49CA81]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#49CA81]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Strongly support</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">2. How convincing were your partner's arguments?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Not at all</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 5" :key="n"
                @click="postSurvey.partnerConvincing = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', postSurvey.partnerConvincing === n ? 'bg-[#49CA81] text-white border-[#49CA81]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#49CA81]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Very convincing</span>
          </div>
        </div>
        <div v-if="studyCondition === 'AI_FEEDBACK'">
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">3. How helpful was the AI argument coach?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Not helpful</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 5" :key="n"
                @click="postSurvey.aiHelpfulness = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', postSurvey.aiHelpfulness === n ? 'bg-[#49CA81] text-white border-[#49CA81]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#49CA81]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Very helpful</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">{{ studyCondition === 'AI_FEEDBACK' ? '4' : '3' }}. How fair did the game feel?</label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#8d8379] w-16 text-right">Very unfair</span>
            <div class="flex gap-2 flex-1 justify-center">
              <button v-for="n in 5" :key="n"
                @click="postSurvey.fairness = n"
                :class="['w-9 h-9 rounded-full border text-sm font-semibold transition', postSurvey.fairness === n ? 'bg-[#49CA81] text-white border-[#49CA81]' : 'border-[#e8ddd6] text-[#5e564f] hover:border-[#49CA81]']">
                {{ n }}
              </button>
            </div>
            <span class="text-xs text-[#8d8379] w-16">Very fair</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#3b342f] mb-3">{{ studyCondition === 'AI_FEEDBACK' ? '5' : '4' }}. Any other thoughts or feedback? (optional)</label>
          <textarea
            v-model="postSurvey.openFeedback"
            rows="3"
            placeholder="Share anything that stood out…"
            class="w-full rounded-2xl border border-[#e8ddd6] px-4 py-3 text-sm text-[#3b342f] resize-none focus:border-[#3b342f] focus:outline-none"
          />
        </div>
      </div>
      <div class="mt-10 flex justify-end">
        <button
          :disabled="!postSurveyComplete"
          @click="submitPostSurvey"
          class="rounded-full bg-[#49CA81] text-white font-semibold px-8 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
        >Submit &amp; Finish →</button>
      </div>
    </div>
  </div>

  <!-- DONE STAGE -->
  <div v-else-if="stage === 'done'" class="min-h-screen bg-[#faf7f4] flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-white rounded-3xl border border-[#e8ddd6] shadow-sm p-10 text-center">
      <div class="text-5xl mb-6">🎉</div>
      <h1 class="text-2xl font-bold text-[#3b342f] mb-3">Thank you!</h1>
      <p class="text-sm text-[#5e564f] mb-6">Your responses have been recorded. You've completed the Point Taken study.</p>
      <div v-if="studyPid" class="bg-[#faf7f4] rounded-2xl p-5 mb-6">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#8d8379] mb-1">Your participant ID</p>
        <p class="text-2xl font-mono font-bold text-[#3b342f]">{{ studyPid }}</p>
      </div>
      <p class="text-xs text-[#8d8379]">You may close this window.</p>
    </div>
  </div>

  <!-- GAME STAGE -->
  <div v-else class="flex flex-col items-center justify-start min-h-screen pt-12 relative">
    <RoomCodeDisplay :game-code="gameCode" />

    <div class="fixed z-30 top-8 right-8 flex flex-col space-y-2 items-center">
      <div id="role" class="flex space-x-2 justify-center items-end">
        <MinusPeer class="w-14 h-14" v-if="myRole === 'minus'" />
        <PlusPeer class="w-14 h-14" v-else-if="myRole === 'plus'" />
        <h3 :style="`
          text-shadow: -4px -4px 0 white, 4px -4px 0 white, -4px 4px 0 white, 4px 4px 0 white;
          color: ${myRole === 'plus' ? '#49CA81' : '#FFB42F'}
        `">{{ myRole }} peer</h3>
      </div>
      <InfoDisplay
        :resolved-threads-count="resolvedThreadsCount"
        :resolved-threads="resolvedThreads"
        :is-topic-revised="isTopicRevised"
        :threads="resolvedThreads"
        @open-topic-revision="isTopicRevisionOpen = !isTopicRevisionOpen"
        @open-instructions="isInstructionsOpen = true"
      />
    </div>

    <div ref="boardPane" class="relative w-full flex-1">
      <div
        v-if="quickSuccessMessage"
        class="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#3b342f] px-5 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {{ quickSuccessMessage }}
      </div>

      <GameBoard
        v-if="game"
        :game="game"
        :my-role="myRole"
        :topic-proposal="topicProposal"
        :isTopicRevisionOpen="isTopicRevisionOpen"
        :hide-topic-tile="isTopicRevised || resolvedThreadsCount === 4"
        :disable-interactions="isEvaluating"
        :evaluating-tile-id="evaluatingTileId"
        @tile-typing="onTileTyping"
        @tile-confirm="onTileConfirm"
        @tile-place="onTilePlace"
        @tile-remove="onTileRemove"
        @emoji-place="onEmojiPlace"
        @undo-emoji-place="onUndoEmojiPlace"
        @update-resolved-threads="onUpdateResolvedThreads"
        @propose-topic-revision="onTopicProposal"
        @close-topic-revision="onCloseTopicRevision"
        @reject-topic-proposal="onRejectTopicProposal"
        @topic-revise="onTopicRevision(topicProposal)"
      />

      <!-- AI feedback popup — hidden for CONTROL condition -->
      <div
        v-if="aiFeedback && popupPosition && studyCondition === 'AI_FEEDBACK'"
        class="absolute z-40 w-[24rem] rounded-[1.5rem] border border-[#3b342f] bg-white p-5 shadow-[0_18px_40px_rgba(59,52,47,0.18)]"
        :style="{ left: `${popupPosition.left}px`, top: `${popupPosition.top}px` }"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d]">Argument coach</p>
            <h2 class="mt-1 text-lg font-bold">Here's a tip 💡</h2>
          </div>
          <button class="text-sm text-[#5e564f]" @click="dismissFeedback">✕</button>
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
          />
        </div>

        <div class="mt-5 flex flex-wrap gap-3">
          <button
            v-if="suggestionDraft"
            class="rounded-full border border-[#3b342f] bg-[#3b342f] px-4 py-2 text-sm font-semibold text-white"
            @click="acceptSuggestion"
          >Use this</button>
          <button
            class="rounded-full border border-[#e8ddd6] px-4 py-2 text-sm text-[#8d8379]"
            @click="dismissFeedback"
          >Keep mine</button>
        </div>
      </div>

      <!-- AI evaluating indicator — fixed top-center banner, always visible while evaluating -->
      <div
        v-if="isEvaluating && studyCondition === 'AI_FEEDBACK'"
        class="fixed z-50 top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-[#3b342f] bg-white px-5 py-2.5 shadow-[0_4px_16px_rgba(59,52,47,0.14)]"
      >
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.3s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.15s]"></span>
        <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d]"></span>
        <span class="ml-1 text-xs font-semibold text-[#5e564f]">AI coach is reading your argument…</span>
      </div>
    </div>

    <WinAlert v-if="isTopicRevised" winCondition="topic" :newTopic="game!.topic.text" />
    <WinAlert v-else-if="resolvedThreadsCount === 4" winCondition="threads" :threads="resolvedThreadsForAlert" />
    <InstructionsModal :is-open="isInstructionsOpen" @close="isInstructionsOpen = false" />
    <OnboardingModal v-if="isTutorialOpen" :is-open="isTutorialOpen" :my-role="myRole" @close="isTutorialOpen = false" />

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
definePageMeta({ requiresAuth: false })

import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { io, Socket } from 'socket.io-client'
import type { AiFeedback, Game, GamePlayer, Position, Tile } from '../../types'
import { useAlerts } from '@/composables/useAlerts'
import { useRuntimeConfig } from '#app'

const { success, error, info } = useAlerts()
const route = useRoute()
const config = useRuntimeConfig()

const gameCode = (route.params.gameCode as string) || ''
const rawPid = (route.query.pid as string) || ''
const studyPid = rawPid || `anon-${Math.random().toString(36).slice(2, 8)}`
const studyCondition = (route.query.condition as string) || 'CONTROL'
const haicUrl = (route.query.haicUrl as string) || ''

// Study pipeline stage
const stage = ref<'consent' | 'pre-survey' | 'waiting' | 'game' | 'post-survey' | 'done'>('consent')
const consentChecked = ref(false)
const topicText = ref('')
const preSurvey = ref({ ageRange: '', politicalLeaning: 0, topicFamiliarity: 0, initialStance: 0, discussionFrequency: '' })
const postSurvey = ref({ finalStance: 0, partnerConvincing: 0, aiHelpfulness: 0, fairness: 0, openFeedback: '' })

const preSurveyComplete = computed(() =>
  !!preSurvey.value.ageRange &&
  preSurvey.value.politicalLeaning > 0 &&
  preSurvey.value.topicFamiliarity > 0 &&
  preSurvey.value.initialStance > 0 &&
  !!preSurvey.value.discussionFrequency
)

const postSurveyComplete = computed(() =>
  postSurvey.value.finalStance > 0 &&
  postSurvey.value.partnerConvincing > 0 &&
  (studyCondition !== 'AI_FEEDBACK' || postSurvey.value.aiHelpfulness > 0) &&
  postSurvey.value.fairness > 0
)

const configuredBackendUrl = (config.public as any).NUXT_PUBLIC_BACKEND_URL
const backendUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? window.location.origin
  : (configuredBackendUrl || 'http://localhost:8080')

const game = ref<Game | null>(null)
const players = ref<GamePlayer[]>([])
const me = ref<string | null>(null)
const resolvedThreads = ref<Array<'wine' | 'shared-facts' | 'scale' | 'thumbs-up' | null>>([null, null, null, null])
const resolvedThreadsCount = computed(() => resolvedThreads.value.filter(Boolean).length)
const resolvedThreadsForAlert = computed(() =>
  resolvedThreads.value.filter((x): x is 'wine' | 'shared-facts' | 'scale' | 'thumbs-up' => x !== null)
)
const isTopicRevised = ref(false)
const topicProposal = ref('')
const isTopicRevisionOpen = ref(false)
const isInstructionsOpen = ref(false)
const isTutorialOpen = ref(true)

const boardPane = ref<HTMLElement | null>(null)
const aiFeedback = ref<AiFeedback | null>(null)
const suggestionDraft = ref('')
const isEvaluating = ref(false)
const evaluatingTileId = ref<string | null>(null)
const popupPosition = ref<{ left: number; top: number } | null>(null)
const loadingPosition = ref<{ left: number; top: number } | null>(null)
const quickSuccessMessage = ref('')
const lastConfirmedTileId = ref<string | null>(null)
let evaluationTimeout: number | null = null

const activeEmojiResolution = ref<{
  emoji: string; tileId: string; role: 'placer' | 'peer'
  data: { placerSubmission: string | null; peerSubmission: string | null; peerTyping: boolean; peerWaiting: boolean }
} | null>(null)
const pendingEmojiPlacement = ref(false)
const EMOJIS_REQUIRING_RESOLUTION = ['shared-facts', 'wine', 'scale']

let socket: Socket

const myRole = computed<'plus' | 'minus' | null>(() => {
  if (!game.value || !me.value) return null
  const p = players.value.find(p => p.userId === me.value)
  return p ? p.role : null
})

// Go to post-survey when game ends
watch([isTopicRevised, resolvedThreadsCount], ([revised, count]) => {
  if (revised || count === 4) {
    setTimeout(() => { stage.value = 'post-survey' }, 3000)
  }
})

const KNOWN_PREFIXES = ['Yes, because', 'No, because', 'Because', 'But']
function stripPrefix(text: string): string {
  for (const prefix of KNOWN_PREFIXES) {
    if (text.toLowerCase().startsWith(prefix.toLowerCase() + ' '))
      return text.slice(prefix.length + 1).trimStart()
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

function acceptSuggestion() {
  if (!lastConfirmedTileId.value || !game.value) return
  const text = suggestionDraft.value.trim()
  if (!text) return
  const tile = game.value.gameBoard[lastConfirmedTileId.value]
  if (!tile) return
  tile.text = text
  tile.confirmed = true
  // Re-submit so the revision is saved and the partner sees it
  socket.emit('confirmTile', { userId: me.value, tileId: lastConfirmedTileId.value, text })
  dismissFeedback()
  showQuickSuccess('Suggestion applied.')
}

function showQuickSuccess(message: string) {
  quickSuccessMessage.value = message
  window.setTimeout(() => { quickSuccessMessage.value = '' }, 2500)
}

function calculatePopupPosition(tileId: string, popupWidth: number, popupHeight: number) {
  const pane = boardPane.value
  const tileEl = document.getElementById(`tile-${tileId}`)
  if (!pane) return { left: 24, top: 24 }
  if (!tileEl) return { left: Math.max(24, (pane.clientWidth - popupWidth) / 2), top: 80 }
  const paneRect = pane.getBoundingClientRect()
  const tileRect = tileEl.getBoundingClientRect()
  const gutter = 16
  let left = tileRect.right - paneRect.left + pane.scrollLeft + gutter
  let top = tileRect.top - paneRect.top + pane.scrollTop
  const maxLeft = pane.scrollLeft + pane.clientWidth - popupWidth - 24
  if (left > maxLeft) left = tileRect.left - paneRect.left + pane.scrollLeft - popupWidth - gutter
  left = Math.max(pane.scrollLeft + 24, Math.min(left, maxLeft))
  const maxTop = pane.scrollTop + pane.clientHeight - popupHeight - 24
  top = Math.max(pane.scrollTop + 24, Math.min(top, maxTop))
  return { left, top }
}

async function initGame() {
  // Join the game (idempotent — returns 200 if already in, 400 if full)
  await fetch(`${backendUrl}/api/study/games/${gameCode}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Study-Pid': studyPid },
    body: JSON.stringify({}),
  })

  const res = await fetch(`${backendUrl}/api/study/games/${gameCode}`, {
    headers: { 'X-Study-Pid': studyPid },
  })
  if (!res.ok) throw new Error(`Could not load game (${res.status}). Check the game code in your link.`)
  const body = await res.json()
  if (!body.data?.game) throw new Error('Game not found. The game code may be invalid.')
  const { data } = body
  game.value = data.game
  players.value = data.game.players
  me.value = data.me
  game.value!.gameBoard[0].text = game.value!.topic.text
  isTopicRevised.value = game.value!.topic.revised

  socket = io(backendUrl, {
    transports: ['polling', 'websocket'],
    query: { gameCode, studyPid },
  })

  socket.emit('joinRoom', gameCode)
  socket.on('typingTile', handleTypingTile)
  socket.on('confirmTile', handleConfirmTile)
  socket.on('aiFeedback', handleAiFeedback)
  socket.on('placeTile', handleTilePlaced)
  socket.on('removeTile', handleTileRemoved)
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

  // Gate the board on LIVE presence: both players must have an active socket
  // connection, not merely exist in the DB (the host is pre-seeded at creation).
  socket.on('presence', ({ userIds }: { userIds: string[] }) => {
    const distinct = new Set(userIds || [])
    if (stage.value === 'waiting' && distinct.size >= 2) {
      stage.value = 'game'
    }
  })

  // Always start in the waiting room; the presence event promotes us to the
  // board only once a second player is actually connected.
  stage.value = 'waiting'
}

onMounted(async () => {
  // Fetch just the topic (GET only, no socket) so the pre-survey can show
  // what participants are being asked to rate their stance on.
  try {
    const res = await fetch(`${backendUrl}/api/study/games/${gameCode}`, {
      headers: { 'X-Study-Pid': studyPid },
    })
    if (res.ok) {
      const body = await res.json()
      topicText.value = body?.data?.game?.topic?.text ?? ''
    }
  } catch { /* topic display is best-effort */ }
})

const initError = ref('')

async function proceedToGame() {
  initError.value = ''
  try {
    await initGame()
  } catch (e: any) {
    initError.value = e?.message || 'Could not start game. Please check your link and try again.'
  }
}

async function submitPostSurvey() {
  // Save survey data (best-effort; don't block on failure)
  try {
    await fetch(`${backendUrl}/api/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Study-Pid': studyPid },
      body: JSON.stringify({
        surveyData: {
          pid: studyPid,
          condition: studyCondition,
          gameCode,
          preSurvey: preSurvey.value,
          postSurvey: postSurvey.value,
          submittedAt: new Date().toISOString(),
        }
      }),
    })
  } catch { /* ignore */ }
  stage.value = 'done'
  if (haicUrl) {
    const url = new URL(haicUrl)
    url.searchParams.set('pid', studyPid)
    url.searchParams.set('condition', studyCondition)
    url.searchParams.set('completed', 'true')
    setTimeout(() => { window.location.href = url.toString() }, 2000)
  }
}

function onTileTyping({ tileId, partial }: { tileId: string; partial: string }) {
  socket.emit('typingTile', { userId: me.value, tileId, partialText: partial })
}

function onTileConfirm({ tileId, text }: { tileId: string; text: string }) {
  socket.emit('confirmTile', { userId: me.value, tileId, text })
  if (game.value) game.value.gameBoard[tileId].text = text
  lastConfirmedTileId.value = tileId
  aiFeedback.value = null
  popupPosition.value = null

  if (studyCondition === 'AI_FEEDBACK') {
    isEvaluating.value = true
    evaluatingTileId.value = tileId
    nextTick(() => { loadingPosition.value = calculatePopupPosition(tileId, 140, 36) })
    evaluationTimeout = window.setTimeout(() => {
      isEvaluating.value = false
      evaluatingTileId.value = null
      loadingPosition.value = null
      evaluationTimeout = null
      showQuickSuccess('Looks good. Moving on.')
    }, 50000)
  }
}

function sweepMyEmptyTiles(exceptTileId?: string) {
  if (!game.value) return
  // Remove my own empty, unconfirmed, childless placed tiles (not the roots)
  for (const [id, t] of Object.entries(game.value.gameBoard)) {
    if (id === exceptTileId) continue
    if (['0', '1', '2', '3', '4'].includes(id)) continue
    const tile = t as Tile
    if (tile.player !== myRole.value) continue
    if (tile.confirmed) continue
    if (tile.text && tile.text.trim()) continue
    if (tile.children && tile.children.length) continue
    removeTileLocally(id)
    socket.emit('removeTile', { tileId: id })
  }
}

function onTilePlace({ parentEdge, parentId, pos }: { parentEdge: number; parentId: string; pos: Position }) {
  // Placing a new tile means abandoning any empty one — clean those up first
  sweepMyEmptyTiles()
  const existingIds = Object.keys(game.value!.gameBoard)
  // Use max+1 (not count) so IDs never collide with a slot freed by a removal
  const maxId = existingIds.reduce((m, id) => Math.max(m, parseInt(id) || 0), 0)
  const newTileId = (maxId + 1).toString()
  const newTile: Tile = {
    tileId: newTileId, parentId, parentEdge, children: [],
    player: myRole.value, text: '', emoji: null, ruleCard: null, confirmed: false, revised: false,
  }
  socket.emit('placeTile', newTile)
}

function onTileRemove({ tileId }: { tileId: string }) {
  if (!game.value) return
  const tile = game.value.gameBoard[tileId]
  // Only remove genuinely empty, unconfirmed child tiles
  if (!tile || tile.confirmed || (tile.text && tile.text.trim())) return
  if (['0', '1', '2', '3', '4'].includes(tileId)) return
  removeTileLocally(tileId)
  socket.emit('removeTile', { tileId })
}

function removeTileLocally(tileId: string) {
  if (!game.value) return
  const tile = game.value.gameBoard[tileId]
  if (!tile) return
  const parentId = tile.parentId
  if (parentId && game.value.gameBoard[parentId]) {
    const parent = game.value.gameBoard[parentId]
    parent.children = parent.children.filter((c: string) => c !== tileId)
  }
  delete game.value.gameBoard[tileId]
}

function handleTileRemoved({ userId, tileId }: { userId: string; tileId: string }) {
  if (userId === me.value) return
  removeTileLocally(tileId)
}

function onEmojiPlace({ tileId, emoji }: { tileId: string; emoji: string | null }) {
  if (!game.value || !emoji) return
  const tile = game.value.gameBoard[tileId]
  if (EMOJIS_REQUIRING_RESOLUTION.includes(emoji)) {
    tile.emoji = emoji
    pendingEmojiPlacement.value = true
    activeEmojiResolution.value = {
      emoji, tileId, role: 'placer',
      data: { placerSubmission: null, peerSubmission: null, peerTyping: false, peerWaiting: true },
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
  game.value.gameBoard[tileId].emoji = null
  resolvedThreads.value[parseInt(tileId) - 1] = null
  socket.emit('undoPlaceEmoji', { userId: me.value, tileId })
  info('Emoji removed — thread unresolved')
}

function onUpdateResolvedThreads({ thread, emoji }: { thread: number; emoji: 'wine' | 'shared-facts' | 'scale' | 'thumbs-up' }) {
  resolvedThreads.value[thread - 1] = emoji
}

function onTopicProposal(revision: string) {
  socket.emit('reviseTopicProposal', revision)
}

function onCloseTopicRevision() { isTopicRevisionOpen.value = false }

function onTopicRevision(revision: string) { socket.emit('reviseTopic', revision) }

function onRejectTopicProposal() {
  socket.emit('rejectTopicProposal', { userId: me.value })
  isTopicRevisionOpen.value = false
  topicProposal.value = ''
}

async function handleAiFeedback(feedback: AiFeedback) {
  if (evaluationTimeout) { window.clearTimeout(evaluationTimeout); evaluationTimeout = null }
  isEvaluating.value = false
  evaluatingTileId.value = null
  loadingPosition.value = null
  if (studyCondition !== 'AI_FEEDBACK') return  // double-guard: ignore if CONTROL
  if (!feedback || typeof feedback !== 'object' || !('display_feedback' in feedback || 'errors_found' in feedback)) return
  const shouldShow = feedback.display_feedback ?? feedback.errors_found
  if (!shouldShow) { showQuickSuccess('Looks good. Moving on.'); return }
  aiFeedback.value = feedback
  const rawSuggestion = feedback.suggestion ?? feedback.clarify?.rewrites?.[0] ?? ''
  suggestionDraft.value = rawSuggestion ? stripPrefix(rawSuggestion) : ''
  await nextTick()
  if (lastConfirmedTileId.value) popupPosition.value = calculatePopupPosition(lastConfirmedTileId.value, 384, 320)
}

function handleTypingTile({ userId, tileId, partialText }: any) {
  if (userId === me.value) return
  if (game.value) game.value.gameBoard[tileId].text = 'Partner is typing…'
}

function handleConfirmTile({ userId, tileId, text }: any) {
  if (game.value) {
    game.value.gameBoard[tileId].text = text
    game.value.gameBoard[tileId].confirmed = true
  }
}

function handleTilePlaced({ tile }: { userId: string; tile: Tile }) {
  if (!game.value) return
  game.value.gameBoard[tile.tileId] = tile
  game.value.gameBoard[tile.parentId!].children.push(tile.tileId)
}

function handleEmojiPlaced({ userId, tileId, emoji }: { userId: string; tileId: string; emoji: string | null }) {
  if (!game.value) return
  game.value.gameBoard[tileId].emoji = emoji
  if (userId !== me.value) info('Partner placed an emoji — thread resolved!')
}

function handleUndoPlaceEmoji({ userId, tileId }: { userId: string; tileId: string }) {
  if (!game.value) return
  game.value.gameBoard[tileId].emoji = null
  resolvedThreads.value[parseInt(tileId) - 1] = null
  if (userId !== me.value) info('Partner removed an emoji')
}

function handleTopicProposal({ userId, topic }: { userId: string; topic: string }) {
  if (userId === me.value) return
  topicProposal.value = topic
}

function handleTopicRevision(revision: string) {
  topicProposal.value = ''
  isTopicRevised.value = true
  game.value!.topic.text = revision
  game.value!.topic.revised = true
}

function handleTopicProposalRejected(userId: string) {
  if (userId !== me.value) info('Partner rejected your topic proposal')
  topicProposal.value = ''
  isTopicRevisionOpen.value = false
}

function handleEmojiResolutionOpened({ userId, tileId, emoji }: any) {
  if (userId === me.value) return
  activeEmojiResolution.value = {
    emoji, tileId, role: 'peer',
    data: { placerSubmission: null, peerSubmission: null, peerTyping: false, peerWaiting: true },
  }
}

function handleEmojiResolutionTyping({ userId }: any) {
  if (userId === me.value || !activeEmojiResolution.value) return
  activeEmojiResolution.value.data.peerTyping = true
  setTimeout(() => { if (activeEmojiResolution.value) activeEmojiResolution.value.data.peerTyping = false }, 2000)
}

function handleEmojiResolutionSubmit({ userId, submission, emoji }: any) {
  if (userId === me.value || !activeEmojiResolution.value) return
  const resolution = activeEmojiResolution.value
  if (resolution.role === 'peer') { resolution.data.placerSubmission = submission; resolution.data.peerWaiting = false }
  else resolution.data.peerSubmission = submission
  if (resolution.data.placerSubmission && resolution.data.peerSubmission) {
    socket.emit('placeEmoji', { userId: me.value, tileId: resolution.tileId, emoji })
    success('Emoji placed — thread resolved!')
    pendingEmojiPlacement.value = false
    closeEmojiResolution()
  }
}

function handleEmojiResolutionClosed({ userId }: any) {
  if (userId === me.value) return
  activeEmojiResolution.value = null
}

function handleEmojiResolutionRejected({ userId, tileId }: any) {
  if (userId === me.value) return
  if (game.value && tileId) {
    game.value.gameBoard[tileId].emoji = null
    const n = parseInt(tileId)
    if (n >= 1 && n <= 4) resolvedThreads.value[n - 1] = null
  }
  activeEmojiResolution.value = null
  pendingEmojiPlacement.value = false
  info('Partner cancelled emoji resolution')
}

function closeEmojiResolution() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  socket.emit('emojiResolutionClosed', { userId: me.value, tileId: resolution.tileId, emoji: resolution.emoji })
  activeEmojiResolution.value = null
}

function rejectEmojiResolution() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  const { tileId, emoji } = resolution
  if (game.value && tileId) {
    game.value.gameBoard[tileId].emoji = null
    const n = parseInt(tileId)
    if (n >= 1 && n <= 4) resolvedThreads.value[n - 1] = null
  }
  pendingEmojiPlacement.value = false
  socket.emit('emojiResolutionRejected', { userId: me.value, tileId, emoji })
  activeEmojiResolution.value = null
  info('Emoji resolution cancelled')
}

function emitEmojiResolutionTyping() {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  socket.emit('emojiResolutionTyping', { userId: me.value, tileId: resolution.tileId, emoji: resolution.emoji })
}

function submitEmojiResolution(text: string) {
  const resolution = activeEmojiResolution.value
  if (!resolution) return
  if (resolution.role === 'placer') resolution.data.placerSubmission = text
  else resolution.data.peerSubmission = text
  socket.emit('emojiResolutionSubmit', { userId: me.value, tileId: resolution.tileId, emoji: resolution.emoji, submission: text })
  if (resolution.data.placerSubmission && resolution.data.peerSubmission) {
    socket.emit('placeEmoji', { userId: me.value, tileId: resolution.tileId, emoji: resolution.emoji })
    success('Emoji placed — thread resolved!')
    pendingEmojiPlacement.value = false
    closeEmojiResolution()
  }
}
</script>

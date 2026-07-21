<template>
  <div class="min-h-screen bg-[#f6efe4] text-[#3b342f]">
    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 px-6 py-8 lg:flex-row">
      <aside class="w-full lg:max-w-[22rem]">
        <div class="rounded-[2rem] border-2 border-[#3b342f] bg-white/90 p-6 shadow-[0_18px_40px_rgba(59,52,47,0.12)] flex flex-col gap-5">

          <!-- Header -->
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-[#c07a2d]">Point Taken · User Test</p>
            <h1 class="mt-2 text-2xl font-bold leading-tight">Debate vs AI</h1>
          </div>

          <!-- Topic -->
          <div class="rounded-2xl bg-[#f6efe4] px-4 py-3">
            <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#8d8379]">Topic</p>
            <p class="mt-1 text-sm font-semibold leading-snug text-[#3b342f]">{{ game?.topic?.text }}</p>
            <button class="mt-2 text-xs text-[#c07a2d] underline underline-offset-2 font-medium" @click="isTopicPickerOpen = true">
              Change topic
            </button>
          </div>

          <!-- Your side -->
          <div>
            <p class="mb-2 text-sm font-bold text-[#3b342f]">Pick your side</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="setAiCopRole('plus')"
                :disabled="isAiInitializing || isAiThinking"
                :class="[
                  'rounded-2xl border-2 py-4 text-sm font-bold transition-all',
                  aiCopRole === 'plus'
                    ? 'border-[#49ca81] bg-[#f0fdf4] text-[#1a6b3c] shadow-sm'
                    : 'border-[#e8ddd6] bg-white text-[#5e564f] hover:border-[#49ca81] hover:bg-[#f0fdf4]',
                  (isAiInitializing || isAiThinking) ? 'opacity-50 cursor-not-allowed' : ''
                ]"
              >
                <div class="text-xl mb-1">👍</div>
                <div>For</div>
                <div class="text-[0.65rem] font-normal mt-0.5 opacity-70">Yes to the topic</div>
              </button>
              <button
                @click="setAiCopRole('minus')"
                :disabled="isAiInitializing || isAiThinking"
                :class="[
                  'rounded-2xl border-2 py-4 text-sm font-bold transition-all',
                  aiCopRole === 'minus'
                    ? 'border-[#ffb42f] bg-[#fffbeb] text-[#7a5300] shadow-sm'
                    : 'border-[#e8ddd6] bg-white text-[#5e564f] hover:border-[#ffb42f] hover:bg-[#fffbeb]',
                  (isAiInitializing || isAiThinking) ? 'opacity-50 cursor-not-allowed' : ''
                ]"
              >
                <div class="text-xl mb-1">👎</div>
                <div>Against</div>
                <div class="text-[0.65rem] font-normal mt-0.5 opacity-70">No to the topic</div>
              </button>
            </div>
          </div>

          <!-- How to play -->
          <div class="rounded-2xl border border-[#e8ddd6] bg-[#fafaf8] px-4 py-4">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#8d8379] mb-3">How to play</p>
            <ol class="flex flex-col gap-2.5">
              <li class="flex items-start gap-2.5 text-sm text-[#3b342f]">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b342f] text-white text-[0.6rem] font-bold flex items-center justify-center">1</span>
                <span>Type your argument in one of <strong>your tiles</strong> and press <kbd class="rounded border border-[#d8cbb7] bg-white px-1 py-0.5 text-[0.65rem] font-mono">Enter</kbd> to confirm</span>
              </li>
              <li class="flex items-start gap-2.5 text-sm text-[#3b342f]">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b342f] text-white text-[0.6rem] font-bold flex items-center justify-center">2</span>
                <span>Fill <strong>both</strong> of your starting tiles — then the AI will begin responding</span>
              </li>
              <li class="flex items-start gap-2.5 text-sm text-[#3b342f]">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-[#3b342f] text-white text-[0.6rem] font-bold flex items-center justify-center">3</span>
                <span>Keep adding arguments on the <strong>+ / –</strong> slots that appear. AI responds after each one.</span>
              </li>
            </ol>
          </div>

          <!-- AI status -->
          <div v-if="isAiInitializing || isAiThinking"
            class="flex items-center gap-3 rounded-2xl border border-[#e8d8a0] bg-[#fffbeb] px-4 py-3">
            <div class="flex gap-1 flex-shrink-0">
              <span class="h-2 w-2 rounded-full bg-[#c07a2d] animate-bounce [animation-delay:-0.3s]"></span>
              <span class="h-2 w-2 rounded-full bg-[#c07a2d] animate-bounce [animation-delay:-0.15s]"></span>
              <span class="h-2 w-2 rounded-full bg-[#c07a2d] animate-bounce"></span>
            </div>
            <p class="text-sm font-semibold text-[#7a5300]">
              {{ isAiInitializing ? 'AI is preparing its opening arguments…' : aiThinkingPhase === 'writing' ? 'AI is writing a response…' : 'AI is reading your argument…' }}
            </p>
          </div>

<!-- AI feedback toggle -->
          <button
            @click="toggleAi"
            class="flex items-center justify-between w-full rounded-2xl border px-4 py-3 transition-colors text-left"
            :class="aiEnabled
              ? 'border-[#c07a2d] bg-[#fff8ef]'
              : 'border-[#d8cbb7] bg-white hover:border-[#3b342f]'"
          >
            <div>
              <p class="text-sm font-bold" :class="aiEnabled ? 'text-[#7a5300]' : 'text-[#5e564f]'">
                💡 Argument coaching
              </p>
              <p class="text-xs mt-0.5" :class="aiEnabled ? 'text-[#a07030]' : 'text-[#8d8379]'">
                {{ aiEnabled ? 'On — you get feedback after each tile' : 'Off — no feedback shown' }}
              </p>
            </div>
            <div
              class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200"
              :class="aiEnabled ? 'bg-[#c07a2d]' : 'bg-[#d8cbb7]'"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                :class="aiEnabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </div>
          </button>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button
              class="rounded-xl border border-[#d8cbb7] bg-white px-4 py-2.5 text-sm font-semibold text-[#5e564f] hover:border-[#3b342f] hover:text-[#3b342f] transition-colors"
              @click="resetDemo"
            >
              🔄 Reset
            </button>
            <button
              class="rounded-xl border border-[#d8cbb7] bg-white px-4 py-2.5 text-sm font-semibold text-[#5e564f] hover:border-[#3b342f] hover:text-[#3b342f] transition-colors"
              @click="endSession"
            >
              ✓ End session
            </button>
          </div>

        </div>
      </aside>

      <main ref="boardPane" class="relative flex-1 overflow-x-auto overflow-y-hidden rounded-[2.5rem] border-2 border-[#3b342f] bg-[radial-gradient(circle_at_top,_#fffdf8_0%,_#f6efe4_58%,_#eadcc6_100%)] p-6 shadow-[0_22px_60px_rgba(59,52,47,0.14)]">
        <transition name="fade">
          <div
            v-if="quickSuccessMessage"
            class="absolute inset-x-0 top-1/3 z-50 flex justify-center pointer-events-none"
          >
            <div class="rounded-2xl border border-[#3b8c5e] bg-[#eef7f1] px-8 py-5 text-lg font-bold text-[#31523d] shadow-[0_18px_40px_rgba(59,52,47,0.22)]">
              ✓ {{ quickSuccessMessage }}
            </div>
          </div>
        </transition>
        <div class="h-full min-w-fit p-6 lg:p-10">
          <GameBoard
            v-if="game"
            :key="game.date"
            :game="game"
            :my-role="activeRole"
            :topic-proposal="topicProposal"
            :is-topic-revision-open="isTopicRevisionOpen"
            :hide-topic-tile="false"
            :demo-mode="true"
            :demo-editing-tile-id="editingTileId"
            :drafts-by-tile-id="draftByTile"
            :disable-interactions="demoMode === 'aicop' && isAiThinking"
            @tile-typing="onTileTyping"
            @tile-confirm="onTileConfirm"
            @tile-place="onTilePlace"
            @emoji-place="onEmojiPlace"
            @undo-emoji-place="onUndoEmojiPlace"
            @update-resolved-threads="onUpdateResolvedThreads"
            @propose-topic-revision="onTopicProposal"
            @close-topic-revision="onCloseTopicRevision"
            @reject-topic-proposal="onRejectTopicProposal"
            @topic-revise="onTopicRevision"
          />
        </div>

        <div
          v-if="aiFeedback && popupPosition"
          class="absolute z-40 w-[24rem] rounded-[1.5rem] border border-[#3b342f] bg-white p-5 shadow-[0_18px_40px_rgba(59,52,47,0.18)]"
          :style="{ left: `${popupPosition.left}px`, top: `${popupPosition.top}px` }"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.25em] text-[#c07a2d]">Argument coach</p>
              <h2 class="mt-1 text-lg font-bold">
                {{ (aiFeedback.display_feedback ?? aiFeedback.errors_found) ? "Here's a tip 💡" : "Strong argument! ✓" }}
              </h2>
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
              class="rounded-full border border-[#3b342f] px-4 py-2 text-sm font-semibold text-[#3b342f]"
              @click="startRevision"
            >
              Write my own version
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

        <!-- AI turn indicator (UX-04 / UR-04 / UR-05) — non-blocking, informative -->
        <transition name="fade">
          <div
            v-if="isAiInitializing || isAiThinking"
            class="absolute left-1/2 top-6 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border border-[#c07a2d] bg-[#fff8ef] px-5 py-2.5 shadow-[0_4px_16px_rgba(59,52,47,0.14)] pointer-events-none select-none"
          >
            <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.3s]"></span>
            <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d] [animation-delay:-0.15s]"></span>
            <span class="h-2 w-2 animate-bounce rounded-full bg-[#c07a2d]"></span>
            <span class="ml-1 text-xs font-semibold text-[#c07a2d]">{{ isAiInitializing ? 'AI is preparing opening arguments…' : aiThinkingPhase === 'writing' ? 'AI is writing a response…' : 'AI is reading the board…' }}</span>
          </div>
        </transition>

        <!-- Tile counter (UR-11 — always visible in vs AI mode) -->
        <transition name="fade">
          <div
            v-if="demoMode === 'aicop' && !sessionComplete"
            class="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold pointer-events-none select-none transition-colors duration-300"
            :class="confirmedTileCount >= AICOP_SOFT_LIMIT
              ? 'border-[#c07a2d] bg-[#fff8ef] text-[#c07a2d]'
              : 'border-[#d8cbb7] bg-white/80 text-[#8d8379]'"
          >
            {{ confirmedTileCount }} / {{ AICOP_SOFT_LIMIT }} tiles
          </div>
        </transition>

        <div
          v-if="editingTileId && revisionSuggestionRef"
          class="absolute z-30 w-[20rem] rounded-[1.5rem] border border-[#d8cbb7] bg-[#fff8ef] p-4 shadow-[0_8px_24px_rgba(59,52,47,0.10)]"
          :style="{ right: '1.5rem', top: '1.5rem' }"
        >
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#c07a2d]">Suggested version</p>
          <p class="mt-2 text-sm leading-6 text-[#3b342f]">{{ revisionSuggestionRef }}</p>
          <p class="mt-2 text-xs text-[#8d8379]">Use this as inspiration — write your own below.</p>
        </div>

        <!-- Wrap-up nudge — shown after soft limit in vs AI mode (UX-05 soft prompt) -->
        <transition name="fade">
          <div
            v-if="demoMode === 'aicop' && sessionEndTileCount > 0 && !sessionComplete"
            class="absolute bottom-6 inset-x-6 z-40 flex items-center justify-between gap-4 rounded-2xl border border-[#c07a2d] bg-[#fff8ef] px-5 py-3 shadow-[0_4px_16px_rgba(59,52,47,0.10)]"
          >
            <p class="text-sm font-semibold text-[#7a5300]">You've built a solid debate. Ready to wrap up?</p>
            <div class="flex gap-2 flex-shrink-0">
              <button
                class="rounded-full border border-[#c07a2d] bg-[#c07a2d] px-4 py-1.5 text-xs font-semibold text-white"
                @click="endSession"
              >
                End session
              </button>
              <button
                class="rounded-full border border-[#d8cbb7] px-3 py-1.5 text-xs font-semibold text-[#8d8379]"
                @click="nudgeDismissedAt = confirmedTileCount; sessionEndTileCount = 0"
              >
                Keep going
              </button>
            </div>
          </div>
        </transition>

        <!-- End-of-session overlay (UX-05 / FR-07 / UR-07) -->
        <transition name="fade">
          <div
            v-if="sessionComplete"
            class="absolute inset-0 z-50 flex items-center justify-center bg-[#3b342f]/30 p-6 backdrop-blur-sm"
          >
            <div class="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-[0_22px_60px_rgba(59,52,47,0.22)]">
              <p class="text-xs font-bold uppercase tracking-[0.3em] text-[#c07a2d]">Session complete</p>
              <h2 class="mt-3 text-2xl font-bold leading-tight text-[#3b342f]">Nice work!</h2>
              <p class="mt-3 text-sm leading-6 text-[#5e564f]">
                You practiced arguing <strong>{{ aiCopRole === 'plus' ? 'for' : 'against' }}</strong> the topic:
              </p>
              <p class="mt-2 rounded-xl bg-[#f6efe4] px-4 py-3 text-sm font-semibold text-[#3b342f] leading-6">
                {{ game?.topic?.text }}
              </p>
              <div class="mt-4 grid grid-cols-2 gap-3 text-center">
                <div class="rounded-xl bg-[#eef7f1] px-3 py-3">
                  <p class="text-2xl font-bold text-[#31523d]">{{ Object.values(game?.gameBoard ?? {}).filter((t: any) => t.tileId !== '0' && t.confirmed && !t.isAiPlaced).length }}</p>
                  <p class="mt-1 text-xs text-[#5e564f]">Your arguments</p>
                </div>
                <div class="rounded-xl bg-[#fff8ef] px-3 py-3">
                  <p class="text-2xl font-bold text-[#7a5300]">{{ Object.values(game?.gameBoard ?? {}).filter((t: any) => t.isAiPlaced && t.confirmed).length }}</p>
                  <p class="mt-1 text-xs text-[#5e564f]">AI responses</p>
                </div>
              </div>
              <p class="mt-5 text-sm text-[#5e564f] leading-6">
                Solo practice is a great warm-up. When you're ready, try a live match against another player to put these skills to the test.
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  class="rounded-full border border-[#3b342f] bg-[#3b342f] px-5 py-2.5 text-sm font-semibold text-white"
                  @click="resetDemo"
                >
                  Practice again
                </button>
                <button
                  class="rounded-full border border-[#3b342f] px-5 py-2.5 text-sm font-semibold text-[#3b342f]"
                  @click="sessionComplete = false"
                >
                  Review board
                </button>
              </div>
            </div>
          </div>
        </transition>

        <div
          v-if="isInstructionsOpen"
          class="absolute inset-0 z-50 flex items-center justify-center bg-[#3b342f]/25 p-6 backdrop-blur-sm"
          @click.self="isInstructionsOpen = false"
        >
          <div class="max-w-xl rounded-[2rem] bg-white p-6 shadow-xl">
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-[#c07a2d]">How to demo it</p>
            <ol class="mt-4 space-y-3 text-sm leading-6">
              <li>1. Place a tile on either side of the topic.</li>
              <li>2. Confirm a weak argument to show the AI coach panel.</li>
              <li>3. Switch sides and keep building the board to show the full loop.</li>
            </ol>

            <p class="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#c07a2d]">Fallacy cheat sheet</p>
            <p class="mt-1 text-xs text-[#8d8379]">Try typing one of these to trigger each category.</p>
            <ul class="mt-3 space-y-3 text-sm">
              <li>
                <span class="font-semibold">Too Broad —</span>
                <span class="text-[#5e564f]"> "Everyone gets distracted by phones."</span>
              </li>
              <li>
                <span class="font-semibold">Causal Leap —</span>
                <span class="text-[#5e564f]"> "Phone bans cause better grades because test scores went up."</span>
              </li>
              <li>
                <span class="font-semibold">Needs More Detail —</span>
                <span class="text-[#5e564f]"> "This is just bad for class."</span>
              </li>
              <li>
                <span class="font-semibold">Needs Clearer Connection —</span>
                <span class="text-[#5e564f]"> "My cousin failed math last semester."</span>
              </li>
            </ul>

            <button
              class="mt-6 rounded-full border border-[#3b342f] px-4 py-2 text-sm font-semibold"
              @click="isInstructionsOpen = false"
            >
              Close
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>

  <SuggestedTopicsModal
    :is-open="isTopicPickerOpen"
    @close="isTopicPickerOpen = false"
    @select-topic="onSelectTopic"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import GameBoard from "~/components/GameBoard.vue";
import InfoDisplay from "~/components/InfoDisplay.vue";
import SuggestedTopicsModal from "~/components/SuggestedTopicsModal.vue";
import { useAlerts } from "~/composables/useAlerts";
import { evaluateAiFeedback, logFeedbackAction } from "~/composables/useAiFeedback";
import type { AiFeedback, Game, Position, Tile } from "~/types";

type DemoRole = "plus" | "minus";

const { info, success } = useAlerts();

function createBaseTile(
  tileId: string,
  parentId: string | null,
  parentEdge: number | null,
  player: DemoRole | null
): Tile {
  return {
    tileId,
    parentId,
    parentEdge,
    children: [],
    player,
    text: "",
    emoji: null,
    ruleCard: null,
    confirmed: tileId === "0",
    revised: false,
  };
}

function createDemoGame(topicText?: string): Game {
  const topic = topicText ?? "Should schools limit student phone use during class?";
  return {
    gameId: "demo-game",
    code: "DEMO01",
    date: new Date().toISOString(),
    hostId: "demo-plus",
    gameStatus: "in-progress",
    topic: {
      text: topic,
      revised: false,
    },
    players: [
      { userId: "demo-plus", name: "Alex", role: "plus", money: 0 },
      { userId: "demo-minus", name: "Jordan", role: "minus", money: 0 },
    ],
    gameBoard: {
      "0": {
        ...createBaseTile("0", null, null, null),
        children: ["1", "2", "3", "4"],
        text: topic,
      },
      "1": createBaseTile("1", "0", 1, "plus"),
      "2": createBaseTile("2", "0", 3, "plus"),
      "3": createBaseTile("3", "0", 5, "minus"),
      "4": createBaseTile("4", "0", 7, "minus"),
    },
  };
}

function createAiCopGame(topicText?: string, userRole: DemoRole = "plus"): Game {
  const aiRole: DemoRole = userRole === "plus" ? "minus" : "plus";
  const topic = topicText ?? "Should schools limit student phone use during class?";

  // Tile IDs 1,2 always render "Yes, because" (plus side)
  // Tile IDs 3,4 always render "No, because" (minus side)
  // Assign user and AI to the correct IDs so For/Against prefix matches the role.
  const [u1, u2, u1Edge, u2Edge] = userRole === "plus"
    ? ["1", "2", 1, 3]
    : ["3", "4", 5, 7];
  const [a1, a2, a1Edge, a2Edge] = aiRole === "plus"
    ? ["1", "2", 1, 3]
    : ["3", "4", 5, 7];

  return {
    gameId: "demo-game",
    code: "DEMO01",
    date: new Date().toISOString(),
    hostId: "demo-plus",
    gameStatus: "in-progress",
    topic: { text: topic, revised: false },
    players: [
      { userId: "demo-plus", name: "You", role: userRole, money: 0 },
      { userId: "ai-coplayer", name: "AI", role: aiRole, money: 0 },
    ],
    gameBoard: {
      "0": {
        ...createBaseTile("0", null, null, null),
        children: [u1, u2, a1, a2],
        text: topic,
      },
      [u1]: createBaseTile(u1, "0", u1Edge, userRole),
      [u2]: createBaseTile(u2, "0", u2Edge, userRole),
      // AI placeholder tiles — visible immediately, filled by initAiTiles()
      [a1]: { ...createBaseTile(a1, "0", a1Edge, aiRole), isAiPlaced: true },
      [a2]: { ...createBaseTile(a2, "0", a2Edge, aiRole), isAiPlaced: true },
    },
  };
}

// ── AI toggle (default on, persisted in localStorage) ─────────────────────
const aiEnabled = ref<boolean>(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("pt_ai_enabled") !== "false"
    : true
);
watch(aiEnabled, (val) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("pt_ai_enabled", String(val));
  }
});

// Fire AI opening tiles as soon as the page loads (defaulting to aicop mode)
onMounted(() => {
  if (demoMode.value === "aicop") {
    activeRole.value = aiCopRole.value;
    aiInitGeneration.value++;
    initAiTiles();
  }
});
function toggleAi() {
  aiEnabled.value = !aiEnabled.value;
  if (!aiEnabled.value) {
    aiFeedback.value = null;
    isEvaluating.value = false;
    popupPosition.value = null;
    loadingPosition.value = null;
    evaluationErrorMessage.value = "";
  }
  info(aiEnabled.value ? "AI feedback turned on." : "AI feedback turned off.");
}

// ── AICoP constants (FR-19/FR-24/FR-25 — configurable soft limit + hard cap) ─
const AICOP_SOFT_LIMIT = 20; // confirmed tiles that trigger the wrap-up nudge
const AICOP_HARD_CAP   = 30; // confirmed tiles that force session end

// ── AICoP helpers ──────────────────────────────────────────────────────────

/**
 * Grid offsets indexed by edge number — must stay in sync with useGameBoard.ts.
 * Only edges 1,3,5,7 (diagonal) are legal placement directions; this matches
 * GameBoard's `placeableOffsets` which filters to { x !== 0 && y !== 0 }.
 */
const BOARD_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x:  0, y: -1 }, // 0 — top          (orthogonal, never used for placement)
  { x:  1, y: -1 }, // 1 — top-right    ✓ diagonal
  { x:  1, y:  0 }, // 2 — right        (orthogonal)
  { x:  1, y:  1 }, // 3 — bottom-right ✓ diagonal
  { x:  0, y:  1 }, // 4 — bottom       (orthogonal)
  { x: -1, y:  1 }, // 5 — bottom-left  ✓ diagonal
  { x: -1, y:  0 }, // 6 — left         (orthogonal)
  { x: -1, y: -1 }, // 7 — top-left     ✓ diagonal
];

/**
 * Walk the game board from the root and return:
 *   positions  — tileId → {x,y} grid coord
 *   occupancy  — "x,y"  → tileId  (which tile sits at each cell)
 */
function boardLayout(): {
  positions: Record<string, { x: number; y: number }>;
  occupancy: Record<string, string>;
} {
  if (!game.value) return { positions: {}, occupancy: {} };
  const positions: Record<string, { x: number; y: number }> = { "0": { x: 0, y: 0 } };
  const occupancy: Record<string, string> = { "0,0": "0" };
  const queue = ["0"];
  while (queue.length) {
    const pid = queue.shift()!;
    const p = positions[pid];
    for (const cid of (game.value.gameBoard[pid]?.children ?? [])) {
      const child = game.value.gameBoard[cid];
      if (child?.parentEdge == null) continue;
      const off = BOARD_OFFSETS[child.parentEdge];
      const pos = { x: p.x + off.x, y: p.y + off.y };
      positions[cid] = pos;
      occupancy[`${pos.x},${pos.y}`] = cid;
      queue.push(cid);
    }
  }
  return { positions, occupancy };
}

/**
 * Returns the first free diagonal edge on `parentId` whose target grid cell is
 * unoccupied, or null when no valid placement exists.
 *
 * Only edges 1,3,5,7 (diagonal) are considered — identical to the constraint
 * enforced by GameBoard's `placeableOffsets` and `computeEdge` for human players.
 */
function findFreeEdge(parentId: string): number | null {
  if (!game.value) return null;
  const parent = game.value.gameBoard[parentId];
  if (!parent) return null;

  // Edges already occupied by existing children of this parent
  const usedEdges = new Set(
    (parent.children ?? [])
      .map((cid) => game.value!.gameBoard[cid]?.parentEdge)
      .filter((e): e is number => e != null)
  );

  const { positions, occupancy } = boardLayout();
  const p = positions[parentId];
  if (!p) return null;

  // Prefer top-right → bottom-right → bottom-left → top-left
  for (const e of [1, 3, 5, 7]) {
    if (usedEdges.has(e)) continue;
    const off = BOARD_OFFSETS[e];
    const key = `${p.x + off.x},${p.y + off.y}`;
    if (!occupancy[key]) return e; // cell is free — valid placement
  }
  return null; // all diagonal cells taken or occupied
}

/**
 * All tile IDs that have at least one free diagonal edge whose target cell is
 * unoccupied. The topic tile ("0") is always excluded — after the initial four
 * slots its four diagonal edges are all used, and GameBoard prevents hovering it.
 */
function tilesWithFreeEdge(): string[] {
  if (!game.value) return [];
  return Object.values(game.value.gameBoard)
    .filter((t) =>
      t.tileId !== "0" &&               // topic tile never gets additional branches
      t.confirmed &&
      t.text?.trim() &&
      findFreeEdge(t.tileId) !== null && // at least one valid diagonal cell free
      !(t.isAiPlaced && !t.text?.trim()) // exclude AI placeholders still loading
    )
    .map((t) => t.tileId);
}

/** Count of confirmed non-topic tiles (user + AI) on the board. */
const confirmedTileCount = computed(() => {
  if (!game.value) return 0;
  return Object.values(game.value.gameBoard).filter(
    (t) => t.confirmed && t.tileId !== "0"
  ).length;
});

/**
 * True once the user has confirmed both of their initial tiles.
 * AI turn-taking is gated on this — the AI waits for the user to
 * complete their opening two arguments before responding (FR-AICoP).
 */
const userInitialTilesFilled = computed(() => {
  if (!game.value || demoMode.value !== "aicop") return true;
  const userIds = aiCopRole.value === "plus" ? ["1", "2"] : ["3", "4"];
  return userIds.every((id) => {
    const t = game.value!.gameBoard[id];
    return t && t.confirmed && t.text?.trim();
  });
});

/** Pre-fill the two AI placeholder tiles at game start (fired in parallel).
 *  Uses isAiInitializing (not isAiThinking) so the user can type into their
 *  own tiles immediately while the AI loads its opening arguments.
 */
async function initAiTiles() {
  if (!game.value || demoMode.value !== "aicop") return;

  // Capture generation at call-time; any role switch / reset increments this,
  // which causes the in-flight init to bail before writing to the new board.
  const myGen = ++aiInitGeneration.value;

  const aiRole: DemoRole = aiCopRole.value === "plus" ? "minus" : "plus";
  const placeholders = Object.values(game.value.gameBoard).filter(
    (t) => t.isAiPlaced && !t.confirmed && !t.text?.trim()
  );
  if (placeholders.length === 0) return;

  isAiInitializing.value = true;

  const base = (useRuntimeConfig().public.NUXT_PUBLIC_AI_EVAL_URL as string | undefined)
    ?.replace("/evaluate", "") ?? "http://127.0.0.1:8001";

  try {
    // Fire both in parallel — each call independently picks an opening angle
    const calls = placeholders.map(() =>
      fetch(`${base}/co-player/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_board: game.value!.gameBoard,
          topic: game.value!.topic.text,
          ai_role: aiRole,
          viable_parent_ids: ["0"], // opening moves always branch from the topic
        }),
      }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    );

    const results = await Promise.allSettled(calls);

    // Bail if the user switched sides or reset while we were waiting for the API
    if (myGen !== aiInitGeneration.value || !game.value) return;

    // Writing phase: show blinking cursor briefly before revealing text
    results.forEach((result, i) => {
      if (result.status === "fulfilled" && game.value) {
        game.value.gameBoard[placeholders[i].tileId].isAiWriting = true;
      }
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    // Bail again after the writing animation delay
    if (myGen !== aiInitGeneration.value || !game.value) return;

    results.forEach((result, i) => {
      if (result.status === "fulfilled" && game.value) {
        const placeholder = placeholders[i];
        game.value.gameBoard[placeholder.tileId].text = result.value.text;
        game.value.gameBoard[placeholder.tileId].confirmed = true;
        game.value.gameBoard[placeholder.tileId].isAiWriting = false;
      }
    });
  } catch {
    // AI couldn't pre-fill — tiles stay in reading state; normal turns still work
  } finally {
    if (myGen === aiInitGeneration.value) {
      isAiInitializing.value = false;
    }
  }
}

async function triggerAiTurn() {
  if (!game.value || demoMode.value !== "aicop" || isAiThinking.value) return;

  // Capture the generation so that if the user switches roles mid-turn,
  // the stale result won't be written to the new game board.
  const myGen = aiInitGeneration.value;
  const myRole = aiCopRole.value; // snapshot the user role at turn start

  // Hard cap: end the session automatically once the board is full (FR-24)
  if (confirmedTileCount.value >= AICOP_HARD_CAP) {
    endSession();
    return;
  }

  // Make sure the board has at least one tile with a free edge before calling the AI
  const viable = tilesWithFreeEdge();
  if (viable.length === 0) {
    endSession();
    return;
  }

  const aiRole: DemoRole = myRole === "plus" ? "minus" : "plus";
  isAiThinking.value = true;
  aiThinkingPhase.value = 'reading';

  const base = (useRuntimeConfig().public.NUXT_PUBLIC_AI_EVAL_URL as string | undefined)
    ?.replace("/evaluate", "") ?? "http://127.0.0.1:8001";

  try {
    // Full board sent for context; viable_parent_ids tells the strategy agent
    // which tiles have a free diagonal edge — enforces branching-only rule.
    const res = await fetch(`${base}/co-player/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_board: game.value.gameBoard,
        topic: game.value.topic.text,
        ai_role: aiRole,
        viable_parent_ids: viable,
      }),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    const data = await res.json();

    // Bail if the user switched roles while we were waiting for the API —
    // the game board has been replaced and the result no longer belongs here.
    if (myGen !== aiInitGeneration.value || !game.value) return;

    // Resolve parent: AI's chosen ID, falling back to any viable tile (game rules: new tile only)
    let parentId = String(data.parent_id);
    if (!game.value.gameBoard[parentId] || !viable.includes(parentId)) {
      parentId = viable[0]; // fallback to first available tile
    }

    let freeEdge = findFreeEdge(parentId);
    if (freeEdge === null) {
      // Parent somehow filled up between the request and now — pick another
      const alt = viable.find((id) => id !== parentId && findFreeEdge(id) !== null);
      if (!alt) { endSession(); return; }
      parentId = alt;
      freeEdge = findFreeEdge(parentId)!;
    }

    const nextTileId = String(Object.keys(game.value.gameBoard).length);

    // Switch to writing phase: place a placeholder tile with isAiWriting so Tile.vue
    // shows the writing animation before the text is revealed.
    // Also mark the parent tile so users can see which argument the AI is responding to.
    aiThinkingPhase.value = 'writing';
    game.value.gameBoard[parentId].isAiTarget = true;
    game.value.gameBoard[nextTileId] = {
      tileId: nextTileId,
      parentId,
      parentEdge: freeEdge,
      children: [],
      player: aiRole,
      text: '',
      emoji: null,
      ruleCard: null,
      confirmed: false,
      revised: false,
      isAiPlaced: true,
      isAiWriting: true,
    };
    game.value.gameBoard[parentId].children.push(nextTileId);

    // Hold the writing animation briefly so the user sees the transition
    await new Promise<void>((resolve) => setTimeout(resolve, 1400));

    // Bail again after the writing delay if role changed during animation
    if (myGen !== aiInitGeneration.value || !game.value) return;

    // Reveal the text and confirm the tile
    game.value.gameBoard[nextTileId].text = data.text;
    game.value.gameBoard[nextTileId].confirmed = true;
    game.value.gameBoard[nextTileId].isAiWriting = false;

    // Keep the parent highlight visible for 2.5 s so the user can see which
    // tile the AI responded to, then fade it out.
    setTimeout(() => {
      if (game.value) game.value.gameBoard[parentId].isAiTarget = false;
    }, 2500);

    // Fire-and-forget: log AI turn for research (FR-11 / BE-04)
    fetch(`${base}/co-player/log-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game.value?.gameId ?? null,
        tile_id: nextTileId,
        parent_id: parentId,
        text: data.text,
        ai_role: aiRole,
        strategy: data.strategy ?? null,
        angle: data.angle ?? null,
        model_name: data.model_name ?? null,
        prompt_version: data.prompt_version ?? null,
        evaluated_at: data.evaluated_at ?? null,
      }),
    }).catch(() => {});

    info("AI responded — your turn.");

    // Soft-limit nudge: show wrap-up banner after AICOP_SOFT_LIMIT confirmed tiles (FR-19).
    // Re-nudge every 5 tiles if user dismissed (don't spam every single turn).
    if (
      confirmedTileCount.value >= AICOP_SOFT_LIMIT &&
      !sessionComplete.value &&
      (nudgeDismissedAt.value === 0 || confirmedTileCount.value >= nudgeDismissedAt.value + 5)
    ) {
      sessionEndTileCount.value = confirmedTileCount.value;
    }
  } catch (err) {
    console.error("AI co-player error:", err);
    info("AI couldn't respond — keep going.");
  } finally {
    // Only clean up if this turn wasn't cancelled by a role switch.
    // If it was cancelled, setAiCopRole already reset these flags.
    if (myGen === aiInitGeneration.value) {
      // Clear any stale target highlights in case of error mid-turn
      if (game.value) {
        Object.values(game.value.gameBoard).forEach((t) => { t.isAiTarget = false; });
      }
      isAiThinking.value = false;
      aiThinkingPhase.value = null;
    }
  }
}

function endSession() {
  sessionComplete.value = true;
}

function setMode(mode: "aifeed" | "aicop") {
  if (demoMode.value === mode) return;
  demoMode.value = mode;
  const currentTopic = game.value?.topic?.text;
  game.value = mode === "aicop"
    ? createAiCopGame(currentTopic, aiCopRole.value)
    : createDemoGame(currentTopic);
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  isEvaluating.value = false;
  isAiThinking.value = false;
  isAiInitializing.value = false;
  aiThinkingPhase.value = null;
  sessionComplete.value = false;
  sessionEndTileCount.value = 0;
  nudgeDismissedAt.value = 0;
  popupPosition.value = null;
  loadingPosition.value = null;
  clearQuickSuccess();
  draftByTile.value = {};
  editingTileId.value = null;
  lastFeedbackTileId.value = null;
  resolvedThreads.value = [null, null, null, null];
  if (mode === "aicop") { aiInitGeneration.value++; initAiTiles(); }
  if (mode === "aicop") {
    activeRole.value = aiCopRole.value;
    info("Switched to vs AI mode.");
  } else {
    activeRole.value = "plus";
    info("Switched to solo practice mode.");
  }
}

function setAiCopRole(role: DemoRole) {
  if (aiCopRole.value === role && demoMode.value === "aicop") return;
  aiCopRole.value = role;
  activeRole.value = role;
  aiInitGeneration.value++; // cancel any in-flight initAiTiles
  const currentTopic = game.value?.topic?.text;
  game.value = createAiCopGame(currentTopic, role);
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  isEvaluating.value = false;
  isAiThinking.value = false;
  isAiInitializing.value = false;
  aiThinkingPhase.value = null;
  sessionComplete.value = false;
  sessionEndTileCount.value = 0;
  nudgeDismissedAt.value = 0;
  popupPosition.value = null;
  loadingPosition.value = null;
  clearQuickSuccess();
  draftByTile.value = {};
  editingTileId.value = null;
  lastFeedbackTileId.value = null;
  resolvedThreads.value = [null, null, null, null];
  initAiTiles();
  info(`You're now arguing ${role === "plus" ? "for" : "against"} the topic.`);
}

const demoMode = ref<"aifeed" | "aicop">("aicop"); // default to vs AI for user testing
const aiCopRole = ref<DemoRole>("plus");
const isAiThinking = ref(false)         // reactive turn in progress — blocks user input
const isAiInitializing = ref(false)     // opening tiles loading — does NOT block user
const aiThinkingPhase = ref<'reading' | 'writing' | null>(null)
const nudgeDismissedAt = ref(0)         // confirmedTileCount when nudge was last dismissed;
/** Incremented on every role switch / reset — lets async inits self-cancel if stale. */
const aiInitGeneration = ref(0);
const sessionComplete = ref(false);
const sessionEndTileCount = ref(0);

const game = ref<Game>(createAiCopGame());
const activeRole = ref<DemoRole>("plus");
const topicProposal = ref("");
const isTopicRevisionOpen = ref(false);
const isTopicRevised = ref(false);
const isInstructionsOpen = ref(false);
const isTopicPickerOpen = ref(false);
const aiFeedback = ref<AiFeedback | null>(null);
const isEvaluating = ref(false);
const boardPane = ref<HTMLElement | null>(null);
const popupPosition = ref<{ left: number; top: number } | null>(null);
const loadingPosition = ref<{ left: number; top: number } | null>(null);
const quickSuccessMessage = ref("");
const evaluationErrorMessage = ref("");
const draftByTile = ref<Record<string, string>>({});
const editingTileId = ref<string | null>(null);
const lastFeedbackTileId = ref<string | null>(null);
const suggestionDraft = ref<string>("");
const revisionSuggestionRef = ref<string>("");
let quickSuccessTimer: number | null = null;
const resolvedThreads = ref<Array<"wine" | "shared-facts" | "scale" | "thumbs-up" | null>>([
  null,
  null,
  null,
  null,
]);

const resolvedThreadsCount = computed(
  () => resolvedThreads.value.filter(Boolean).length
);
const activeRoleLabel = computed(() =>
  activeRole.value === "plus" ? "For the topic" : "Against the topic"
);
const readableErrorTypes = computed(() => {
  const firstWave = aiFeedback.value?.first_wave_categories;
  if (firstWave?.length) {
    return firstWave.map((c) => c.replaceAll("_", " "));
  }
  return (aiFeedback.value?.error_types ?? []).map((type) => {
    switch (type) {
      case "clarification_needed":
        return "needs more detail";
      case "irrelevant_rebuttal":
        return "needs clearer connection";
      case "false_causation":
        return "causal leap";
      case "overgeneralization":
        return "too broad";
      default:
        return type.replaceAll("_", " ");
    }
  });
});
const revisionDraft = computed(() =>
  aiFeedback.value?.suggestion ||
  aiFeedback.value?.clarify?.rewrites?.[0] ||
  ""
);

const CATEGORY_TIPS: Record<string, string> = {
  too_broad: "Narrow the claim to a specific group, case, or condition instead of making it universal.",
  causal_leap: "Explain why the cause actually leads to the outcome instead of jumping from sequence or correlation.",
  needs_more_detail: "Add a concrete reason, example, mechanism, or consequence so the point is easier to evaluate.",
  needs_clearer_connection: "Make it explicit how this point supports or rebuts the parent tile.",
  personal_attack: "Address the argument itself, not the person making it.",
  exaggeration: "Dial back the claim to what the evidence can actually support.",
  straw_man: "Represent the opposing view accurately before you respond to it.",
};

const categoryTip = computed(() => {
  const cats = aiFeedback.value?.first_wave_categories ?? [];
  for (const cat of cats) {
    if (CATEGORY_TIPS[cat]) return CATEGORY_TIPS[cat];
  }
  return null;
});

function onSelectTopic(topic: string) {
  game.value = demoMode.value === "aicop"
    ? createAiCopGame(topic, aiCopRole.value)
    : createDemoGame(topic);
  topicProposal.value = "";
  isTopicRevisionOpen.value = false;
  isTopicRevised.value = false;
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  isEvaluating.value = false;
  isAiThinking.value = false;
  isAiInitializing.value = false;
  aiThinkingPhase.value = null;
  sessionComplete.value = false;
  sessionEndTileCount.value = 0;
  nudgeDismissedAt.value = 0;
  popupPosition.value = null;
  loadingPosition.value = null;
  clearQuickSuccess();
  draftByTile.value = {};
  editingTileId.value = null;
  lastFeedbackTileId.value = null;
  revisionSuggestionRef.value = "";
  resolvedThreads.value = [null, null, null, null];
  isTopicPickerOpen.value = false;
  if (demoMode.value === "aicop") { aiInitGeneration.value++; activeRole.value = aiCopRole.value; initAiTiles(); }
  success("Topic set.");
}

function toggleRole() {
  if (demoMode.value === "aicop") return; // locked in vs AI mode
  activeRole.value = activeRole.value === "plus" ? "minus" : "plus";
  info(`Switched to the ${activeRoleLabel.value} side.`);
}

function resetDemo() {
  const currentTopic = game.value?.topic?.text;
  game.value = demoMode.value === "aicop"
    ? createAiCopGame(currentTopic, aiCopRole.value)
    : createDemoGame(currentTopic);
  topicProposal.value = "";
  isTopicRevisionOpen.value = false;
  isTopicRevised.value = false;
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  isEvaluating.value = false;
  isAiThinking.value = false;
  isAiInitializing.value = false;
  aiThinkingPhase.value = null;
  sessionComplete.value = false;
  sessionEndTileCount.value = 0;
  nudgeDismissedAt.value = 0;
  popupPosition.value = null;
  loadingPosition.value = null;
  clearQuickSuccess();
  draftByTile.value = {};
  editingTileId.value = null;
  lastFeedbackTileId.value = null;
  resolvedThreads.value = [null, null, null, null];
  if (demoMode.value === "aicop") { aiInitGeneration.value++; activeRole.value = aiCopRole.value; initAiTiles(); }
  success("Demo board reset.");
}

function getTilePrefix(tile: Tile, gameBoard: Record<string, Tile>): string {
  const id = tile.tileId;
  if (id === '0') return '';
  if (id === '1' || id === '2') return 'Yes, because';
  if (id === '3' || id === '4') return 'No, because';
  const parentPlayer = tile.parentId ? gameBoard[tile.parentId]?.player : null;
  return tile.player === parentPlayer ? 'Because' : 'But';
}

function withPrefix(tile: Tile, gameBoard: Record<string, Tile>): string {
  const prefix = getTilePrefix(tile, gameBoard);
  return prefix ? `${prefix} ${tile.text}` : tile.text;
}

const KNOWN_PREFIXES = ["Yes, because", "No, because", "Because", "But"];

function stripPrefix(text: string): string {
  for (const prefix of KNOWN_PREFIXES) {
    const lower = text.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();
    if (lower.startsWith(lowerPrefix + " ")) {
      return text.slice(prefix.length + 1).trimStart();
    }
  }
  return text;
}

function onTileTyping({ tileId, partial }: { tileId: string; partial: string }) {
  draftByTile.value[tileId] = partial;
}

async function onTileConfirm({ tileId, text }: { tileId: string; text: string }) {
  if (!game.value) return;
  // Prevent double-moves: user cannot confirm a tile while the AI is responding (UR-05)
  if (demoMode.value === "aicop" && isAiThinking.value) {
    info("The AI is still thinking — hold on a moment.");
    return;
  }
  const trimmedText = text.trim();
  if (!trimmedText) return;

  // Mutate the tile in-place. Vue 3's reactive proxy tracks individual property
  // assignments, so Tile.vue's canEditStandardTile (which reads props.tile.text)
  // invalidates immediately and the text renders — same pattern as the live game.
  game.value.gameBoard[tileId].text = trimmedText;
  game.value.gameBoard[tileId].confirmed = true;

  delete draftByTile.value[tileId];
  editingTileId.value = null;
  lastFeedbackTileId.value = tileId;
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  popupPosition.value = null;

  // Skip AI evaluation entirely if the player has turned it off
  if (!aiEnabled.value) {
    showQuickSuccess("Tile confirmed.");
    if (demoMode.value === "aicop" && userInitialTilesFilled.value) triggerAiTurn();
    return;
  }

  isEvaluating.value = true;
  await nextTick();
  positionLoadingNearTile(tileId);

  // Snapshot after the reactive assignment settles
  const confirmedTile = game.value.gameBoard[tileId];

  // Prepend the tile's visible prefix so agents have full argument context.
  // The prefix ("Yes, because", "No, because", "Because", "But") is only shown
  // in the UI — without it, a tile like "they are bad" has no context.
  const evalTile = { ...confirmedTile, text: withPrefix(confirmedTile, game.value.gameBoard) };

  try {
    const nextFeedback = await evaluateAiFeedback({
      tile: evalTile,
      topic: game.value.topic.text,
      gameBoard: game.value.gameBoard as Record<string, Tile>,
    });

    loadingPosition.value = null;
    evaluationErrorMessage.value = "";

    const shouldShowFeedback = nextFeedback.display_feedback ?? nextFeedback.errors_found;
    if (!shouldShowFeedback) {
      aiFeedback.value = null;
      showQuickSuccess("Looks good. Moving on.");
      if (demoMode.value === "aicop" && userInitialTilesFilled.value) triggerAiTurn();
      return;
    }

    aiFeedback.value = nextFeedback;
    const rawSuggestion = nextFeedback.suggestion ?? nextFeedback.clarify?.rewrites?.[0] ?? "";
    suggestionDraft.value = rawSuggestion ? stripPrefix(rawSuggestion) : "";
    await nextTick();
    positionFeedbackNearTile(tileId);
  } catch (err) {
    console.error("demo ai evaluation error:", err);
    loadingPosition.value = null;
    evaluationErrorMessage.value = "Couldn't reach the feedback service. Try again in a moment.";
    // Still let the AI take its turn even if feedback evaluation failed
    if (demoMode.value === "aicop" && userInitialTilesFilled.value) triggerAiTurn();
  } finally {
    isEvaluating.value = false;
  }
}

function onTilePlace({
  parentEdge,
  parentId,
}: {
  parentEdge: number;
  parentId: string;
  pos: Position;
}) {
  // Block new tile placement while AI is thinking (UR-05 — clear turn ownership)
  if (demoMode.value === "aicop" && isAiThinking.value) return;
  const nextTileId = String(Object.keys(game.value.gameBoard).length);
  game.value.gameBoard[nextTileId] = {
    tileId: nextTileId,
    parentId,
    parentEdge,
    children: [],
    player: activeRole.value,
    text: "",
    emoji: null,
    ruleCard: null,
    confirmed: false,
    revised: false,
  };
  game.value.gameBoard[parentId].children.push(nextTileId);
}

function onEmojiPlace({
  tileId,
  emoji,
}: {
  tileId: string;
  emoji: "thumbs-up" | "shared-facts" | "wine" | "scale" | null;
}) {
  if (!emoji) {
    return;
  }

  game.value.gameBoard[tileId].emoji = emoji;
  success("Thread marked as resolved.");
}

function onUndoEmojiPlace({ tileId }: { tileId: string }) {
  game.value.gameBoard[tileId].emoji = null;
  const threadIndex = Number.parseInt(tileId, 10) - 1;
  if (threadIndex >= 0 && threadIndex < resolvedThreads.value.length) {
    resolvedThreads.value[threadIndex] = null;
  }
  info("Resolved marker removed.");
}

function onUpdateResolvedThreads({
  thread,
  emoji,
}: {
  thread: number;
  emoji: "wine" | "shared-facts" | "scale" | "thumbs-up";
}) {
  resolvedThreads.value[thread - 1] = emoji;
}

function onTopicProposal(revision: string) {
  topicProposal.value = revision.trim();
  info("Topic revision staged for demo.");
}

function onCloseTopicRevision() {
  isTopicRevisionOpen.value = false;
}

function onTopicRevision(payload: string | { text?: string }) {
  const nextTopic =
    typeof payload === "string" ? payload : payload?.text ?? topicProposal.value;

  if (!nextTopic?.trim()) {
    return;
  }

  // Reset the entire board with the new topic so stale tiles don't persist
  game.value = demoMode.value === "aicop"
    ? createAiCopGame(nextTopic.trim(), aiCopRole.value)
    : createDemoGame(nextTopic.trim());
  topicProposal.value = "";
  isTopicRevisionOpen.value = false;
  isTopicRevised.value = false;
  aiFeedback.value = null;
  evaluationErrorMessage.value = "";
  isEvaluating.value = false;
  isAiThinking.value = false;
  isAiInitializing.value = false;
  aiThinkingPhase.value = null;
  sessionComplete.value = false;
  sessionEndTileCount.value = 0;
  nudgeDismissedAt.value = 0;
  popupPosition.value = null;
  loadingPosition.value = null;
  suggestionDraft.value = "";
  clearQuickSuccess();
  draftByTile.value = {};
  editingTileId.value = null;
  lastFeedbackTileId.value = null;
  resolvedThreads.value = [null, null, null, null];
  if (demoMode.value === "aicop") { aiInitGeneration.value++; activeRole.value = aiCopRole.value; initAiTiles(); }
  success("Topic updated — board cleared.");
}

function onRejectTopicProposal() {
  topicProposal.value = "";
  isTopicRevisionOpen.value = false;
  info("Topic revision cleared.");
}

function dismissFeedback() {
  aiFeedback.value = null;
  popupPosition.value = null;
  loadingPosition.value = null;
  suggestionDraft.value = "";
  revisionSuggestionRef.value = "";
}

function rejectFeedback() {
  // Player keeps their original tile — just close the panel
  logFeedbackAction({
    tileId: lastFeedbackTileId.value,
    action: "dismissed",
    originalSuggestion: aiFeedback.value?.suggestion ?? null,
    editedSuggestion: null,
    gameId: game.value?.gameId ?? null,
    aiFeedback: aiFeedback.value,
  });
  dismissFeedback();
  showQuickSuccess("Kept your version.");
  if (demoMode.value === "aicop" && userInitialTilesFilled.value) triggerAiTurn();
}

function acceptSuggestion() {
  if (!lastFeedbackTileId.value || !game.value) return;
  const text = suggestionDraft.value.trim();
  if (!text) return;

  const tile = game.value.gameBoard[lastFeedbackTileId.value];
  if (!tile) return;

  logFeedbackAction({
    tileId: lastFeedbackTileId.value,
    action: "accepted",
    originalSuggestion: aiFeedback.value?.suggestion ?? null,
    editedSuggestion: text,
    gameId: game.value?.gameId ?? null,
    aiFeedback: aiFeedback.value,
  });

  tile.text = text;
  tile.confirmed = true;

  dismissFeedback();
  showQuickSuccess("Suggestion applied.");
  if (demoMode.value === "aicop" && userInitialTilesFilled.value) triggerAiTurn();
}

function showQuickSuccess(message: string) {
  clearQuickSuccess();
  quickSuccessMessage.value = message;
  quickSuccessTimer = window.setTimeout(() => {
    quickSuccessMessage.value = "";
    quickSuccessTimer = null;
  }, 1800);
}

function clearQuickSuccess() {
  if (quickSuccessTimer) {
    window.clearTimeout(quickSuccessTimer);
    quickSuccessTimer = null;
  }
  quickSuccessMessage.value = "";
}

function startRevision() {
  if (!lastFeedbackTileId.value) {
    return;
  }

  const tile = game.value.gameBoard[lastFeedbackTileId.value];
  if (!tile?.player) {
    return;
  }

  // Save the player's original text BEFORE clearing so the tile input
  // pre-fills with what they wrote, not the AI suggestion.
  const originalText = tile.text;

  revisionSuggestionRef.value = suggestionDraft.value || aiFeedback.value?.suggestion || "";
  activeRole.value = tile.player;
  editingTileId.value = tile.tileId;
  draftByTile.value[tile.tileId] = originalText;
  tile.text = "";
  tile.confirmed = false;
  aiFeedback.value = null;
  popupPosition.value = null;
  loadingPosition.value = null;
}

function positionFeedbackNearTile(tileId: string) {
  popupPosition.value = calculatePopupPosition(tileId, 384, 320);
}

function positionLoadingNearTile(tileId: string) {
  loadingPosition.value = calculatePopupPosition(tileId, 140, 36);
}

function calculatePopupPosition(
  tileId: string,
  popupWidth: number,
  popupHeight: number
) {
  const pane = boardPane.value;
  const tileEl = document.getElementById(`tile-${tileId}`);
  if (!pane || !tileEl) {
    return null;
  }

  const paneRect = pane.getBoundingClientRect();
  const tileRect = tileEl.getBoundingClientRect();
  const gutter = 16;

  let left = tileRect.right - paneRect.left + pane.scrollLeft + gutter;
  let top = tileRect.top - paneRect.top + pane.scrollTop;

  const maxLeft = pane.scrollLeft + pane.clientWidth - popupWidth - 24;
  const minLeft = pane.scrollLeft + 24;
  if (left > maxLeft) {
    left = tileRect.left - paneRect.left + pane.scrollLeft - popupWidth - gutter;
  }
  left = Math.max(minLeft, Math.min(left, maxLeft));

  const maxTop = pane.scrollTop + pane.clientHeight - popupHeight - 24;
  top = Math.max(pane.scrollTop + 24, Math.min(top, maxTop));

  return { left, top };
}
</script>

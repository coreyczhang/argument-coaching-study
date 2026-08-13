<template>
  <div @mouseover="onHover(true)" @mouseleave="onHover(false)" @click="onTileClick" :id="`tile-${tile.tileId}`"
    class="relative flex">

    <label :for="`reason-${tile.tileId}`" class="sr-only">Reason</label>

    <div id="outer-wrapper" class="absolute overflow-hidden -inset-3 ">
      <div :class="`outer absolute inset-0 overflow-hidden rotate-45 border`" :style="{borderColor: tileStyle}" />
    </div>
    <div id="inner-wrapper" class="relative overflow-hidden size-[17rem] inset-0">
      <div :class="`inner absolute inset-0 overflow-hidden rotate-45 border-3`" :style="{borderColor: tileStyle}" />
      <!-- AI target pulse ring: shown on the parent tile while AI is writing a response to it,
           then lingers for 2.5 s so the user can see which tile was targeted -->
      <Transition name="ai-target-fade">
        <div v-if="tile.isAiTarget"
          class="absolute inset-0 rotate-45 rounded-sm animate-[aiTargetPulse_1.1s_ease-in-out_infinite] pointer-events-none"
          style="border: 4px solid #c07a2d; box-shadow: 0 0 0 6px rgba(192,122,45,0.30), inset 0 0 10px rgba(192,122,45,0.12);"
        />
      </Transition>
      <!-- AI coach reading THIS tile: pulsing ring so the player knows which argument is being evaluated -->
      <div v-if="isBeingEvaluated"
        class="absolute inset-0 rotate-45 rounded-sm animate-[aiTargetPulse_1.1s_ease-in-out_infinite] pointer-events-none"
        style="border: 4px solid #c07a2d; box-shadow: 0 0 0 6px rgba(192,122,45,0.30), inset 0 0 10px rgba(192,122,45,0.12);"
      />
    </div>

    <div id="content"
      :class="` absolute inset-0 flex items-center justify-center ease-in-out duration-150 ${showInteractions ? 'opacity-15 blur-[2px]' : ''}`">
      <h3 class="absolute top-0" :style="{
        color: '#FFF',
        WebkitTextStrokeWidth: '1.5px',
        WebkitTextStrokeColor: tile.player === 'plus' ? '#49CA81' : '#FFB42F',
      }">reason</h3>
      <h6 class="absolute top-10 font-semibold">{{ tilePrefix }}</h6>

      <!-- Confirmed tiles always show their text immediately -->
      <p v-if="tile.confirmed && tile.text" class="text-gray-800 text-center text-sm leading-snug px-3 line-clamp-5">
        {{ tile.text }}
      </p>

      <textarea v-else-if="canEditStandardTile && !demoMode" ref="editor" :id="`reason-${tile.tileId}`" v-model="draft"
        :readonly="disableInteractions" @paste.prevent @input="onInput" @keyup.enter="onConfirm" @blur="onEditorBlur"
        :placeholder="disableInteractions ? 'Wait for the coach to finish…' : ''"
        class="bg-transparent text-center focus:outline-none w-3/4 resize-none py-8 overflow-hidden disabled:opacity-50" />

      <textarea v-else-if="canEditInDemo" ref="editor" :id="`reason-${tile.tileId}`" v-model="draft"
        @focus="isEditing = true" @blur="isEditing = false" @paste.prevent @input="onInput" @keydown.enter.prevent="onConfirm"
        placeholder="Type here and press Enter"
        class="bg-transparent text-center focus:outline-none w-3/4 resize-none py-8 overflow-hidden" />

      <textarea v-else-if="tile.player === userRole && tile.ruleCard && !tile.revised" ref="editor"
        :id="`reason-${tile.tileId}`" v-model="draft" @paste.prevent @input="onInput" @keyup.enter="onConfirm" :placeholder="tile.text"
        class="bg-transparent text-red-600 text-center focus:outline-none w-3/4 resize-none py-8 overflow-hidden" />
      <p v-else-if="tile.text" class="text-gray-800 text-center text-sm leading-snug px-3 line-clamp-5">
        {{ tile.text }}
      </p>
      <!-- AI co-player writing phase: response received, text about to appear -->
      <div v-else-if="tile.isAiPlaced && tile.isAiWriting" class="w-full flex flex-col items-center justify-center gap-2 px-4">
        <span class="inline-block w-0.5 h-5 bg-[#c07a2d] animate-[blink_0.9s_step-end_infinite] rounded-full" />
        <p class="text-[#c07a2d] text-xs font-semibold text-center">Writing…</p>
      </div>

      <!-- AI co-player reading phase: tile reserved, strategy in-flight -->
      <div v-else-if="tile.isAiPlaced" class="w-full flex flex-col items-center justify-center gap-2">
        <div class="flex space-x-1.5 justify-center items-center">
          <div class="h-1.5 w-1.5 bg-[#c07a2d] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div class="h-1.5 w-1.5 bg-[#c07a2d] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div class="h-1.5 w-1.5 bg-[#c07a2d] rounded-full animate-bounce"></div>
        </div>
        <p class="text-[#c07a2d] text-xs font-semibold text-center px-2">AI is preparing…</p>
      </div>

      <div v-else class="w-full">
        <p class="text-gray-800 text-center p-2">
          {{ demoMode ? 'Switch sides to edit this tile' : 'Waiting for other player' }}
        </p>

        <div v-if="!demoMode" class="absolute left-1/2 -translate-x-1/2 top-[60%] flex space-x-2 justify-center items-center bg-white">
          <span class="sr-only">Loading...</span>
          <div class="h-2 w-2 bg-gray rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div class="h-2 w-2 bg-gray rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div class="h-2 w-2 bg-gray rounded-full animate-bounce"></div>
        </div>
      </div>

      <!-- AI co-player badge (vs AI demo mode only) -->
      <div
        v-if="tile.isAiPlaced && tile.confirmed"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-[#fff8ef] border border-[#c07a2d] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-[#c07a2d] pointer-events-none select-none"
      >
        ✦ AI
      </div>

      <div v-if="tile.emoji" class="absolute bottom-4 right-4 bg-white border-1 border-gray-400 rounded-sm p-1 text-xl">
        <Emoji :emoji="tile.emoji" :size="24" />
      </div>

      <!-- <div v-if="tile.ruleCard && !tile.revised"
        class="absolute -bottom-8 border-2 border-white shadow-md rounded-md py-4 px-2 text-xl z-10"
        :style="{backgroundColor: ruleCards[tile.ruleCard].color}">
        <Emoji :emoji="tile.ruleCard" :size="20" :stroke="true"
          :stroke-width="tile.ruleCard === 'honest-thinking' ? 2 : 4" />
      </div> -->

      <!-- <div v-if="tile.ruleCard && tile.revised" class="absolute bottom-2 text-xl z-10">
        <Emoji :emoji="tile.ruleCard" :size="28" :stroke="true"
          :stroke-width="tile.ruleCard === 'honest-thinking' ? 2 : 4" />
      </div> -->

      <p v-if="tooLongError" class="absolute bottom-12 text-xs text-red-600 font-semibold px-2 text-center">
        Keep it under 100 characters ({{ draft.length }}/100)
      </p>
      <p v-else-if="draft.length > 70 && draft.length <= 100" class="absolute bottom-12 text-xs font-semibold px-2 text-center" :class="draft.length > 90 ? 'text-red-500' : 'text-orange-400'">
        {{ draft.length }}/100
      </p>
      <button v-if="(!tile.text || tile.tileId === '0') && draft.trim()" @click="onConfirm"
        class="absolute bottom-4 bg-green text-white px-3 py-1 rounded z-5">
        confirm
      </button>
      <div id="icons" class="absolute bottom-2 flex space-x-4">
        <Plus class="size-6 overflow-visible" v-if="tile.player === 'plus'" v-for="i in 3" :key="i" />
        <Minus class="size-6" v-else-if="tile.player === 'minus'" v-for="j in 3" :key="j" />
      </div>
      <div v-if="!draft" id="bg" class="absolute inset-0 flex items-center justify-center opacity-8">
        <Plus class="size-24" v-if="tile.player === 'plus'" />
        <Minus class="size-24" v-else-if="tile.player === 'minus'" />
      </div>
    </div>

  
    <div v-if="showInteractions" id="interactions"
      class="absolute inset-0 flex flex-col items-center justify-center space-y-10">
      <TileEmojis @place-emoji="onEmojiPlace" />

      <!-- <div v-if="tile.player !== userRole" id="rule-cards" class="flex flex-col space-y-2 items-center">
        <h4 class="font-bold">Rule Cards</h4>

        <div class="flex flex-row space-x-4">
          <button @click="onRuleCardPlace('mutual-respect')" @mouseover="showRuleCard = 'mutual-respect'"
            @mouseleave="showRuleCard = ''"
            class="flex items-center justify-center bg-[#ECA7B2] border-2 border-white rounded-sm w-10 h-14 text-xl ease-in-out duration-150 hover:-translate-y-2">
            <Emoji :emoji="'mutual-respect'" :size="24" :stroke="true" />
          </button>
          <button @click="onRuleCardPlace('honest-thinking')" @mouseover="showRuleCard = 'honest-thinking'"
            @mouseleave="showRuleCard = ''"
            class="flex items-center justify-center bg-[#ADD2EF] border-2 border-white rounded-sm w-10 h-14 text-xl ease-in-out duration-150 hover:-translate-y-2">
            <Emoji :emoji="'honest-thinking'" :size="30" :stroke="true" :stroke-width="2" />
          </button>
          <button @click="onRuleCardPlace('shared-facts')" @mouseover="showRuleCard = 'shared-facts'"
            @mouseleave="showRuleCard = ''"
            class="flex items-center justify-center bg-[#CFC0F1] border-2 border-white rounded-sm w-10 h-14 text-xl ease-in-out duration-150 hover:-translate-y-2">
            <Emoji :emoji="'shared-facts'" :size="24" :stroke="true" />
          </button>
        </div>
      </div> -->
    </div>
    <!-- <RuleCard v-if="showRuleCard" :type="showRuleCard" class="absolute -inset-y-40" :style="{ [side]: '18rem' }" /> -->

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { Tile } from '../types'
import Plus from '~/assets/icons/plus.svg'
import Minus from '~/assets/icons/minus.svg'
import { useAlerts } from '~/composables/useAlerts'

const { error } = useAlerts()

const props = defineProps({
  tile: {
    type: Object as () => Tile,
    required: true
  },
  userRole: {
    type: String as () => 'plus' | 'minus' | null,
    required: true
  },
  side: {
    type: String as () => 'left' | 'right',
    default: 'right'
  },
  parentRole: {
    type: String as () => 'plus' | 'minus' | null,
  },
  isTopicRevisionOpen: {
    type: Boolean,
    default: false
  },
  disableInteractions: {
    type: Boolean,
    default: false
  },
  demoMode: {
    type: Boolean,
    default: false
  },
  demoEditingTileId: {
    type: String,
    default: null
  },
  isBeingEvaluated: {
    type: Boolean,
    default: false
  },
  initialDraft: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['typing', 'confirm', 'hovering', 'emoji-place', 'rule-card-place', 'propose-topic-revision', 'tile-revise', 'remove'])

const ROOT_TILE_IDS = ['0', '1', '2', '3', '4']
let justConfirmed = false

// When a freshly placed child tile is left empty and loses focus, remove it so
// it doesn't occupy an edge and block the player from working on another branch.
function onEditorBlur() {
  isEditing.value = false
  if (justConfirmed) { justConfirmed = false; return }
  if (ROOT_TILE_IDS.includes(props.tile.tileId)) return
  if (props.tile.confirmed) return
  if ((props.tile.text && props.tile.text.trim()) || draft.value.trim()) return
  emit('remove', props.tile.tileId)
}

const draft = ref<string>('')
const tooLongError = ref<boolean>(false)
const showInteractions = ref<boolean>(false)
const showReviseTopic = ref<boolean>(false)
const showRuleCard = ref<'mutual-respect' | 'honest-thinking' | 'shared-facts' | ''>('')
const editor = ref<HTMLTextAreaElement | HTMLInputElement | null>(null)
const isEditing = ref<boolean>(false)

const canEditStandardTile = computed(() =>
  props.tile.player === props.userRole && !props.tile.text && Boolean(props.tile.player)
)

const canEditInDemo = computed(() =>
  props.demoMode && (
    canEditStandardTile.value ||
    props.demoEditingTileId === props.tile.tileId
  )
)

function isEditable() {
  return (
    canEditStandardTile.value ||
    canEditInDemo.value ||
    (props.tile.player === props.userRole && props.tile.ruleCard && !props.tile.revised)
  )
}

function onTileClick(e: MouseEvent) {
  const target = e.target as Element
  if (target.closest('textarea,input,button,a,[data-no-focus]')) return
  if (!isEditable()) return
  nextTick(() => editor.value?.focus())
}


const ruleCards: Record<string, { color: string }> = {
  'mutual-respect': {
    color: '#ECA7B2'
  },
  'honest-thinking': {
    color: '#ADD2EF'
  },
  'shared-facts': {
    color: '#CFC0F1'
  }
}

watch(draft, (newDraft) => {
  draft.value = newDraft
})

// Auto-focus a freshly placed, empty, editable child tile so that clicking
// away (blur) can clean it up if the player leaves it empty.
onMounted(() => {
  if (props.demoMode) return
  if (ROOT_TILE_IDS.includes(props.tile.tileId)) return
  if (canEditStandardTile.value) {
    nextTick(() => editor.value?.focus())
  }
})

watch(
  () => props.initialDraft,
  (newDraft) => {
    draft.value = newDraft || ''
    if (newDraft && isEditable()) {
      nextTick(() => editor.value?.focus())
    }
  },
  { immediate: true }
)

const tileStyle = computed(() => {
  if (!props.tile.player) return '#1E1E1E'
  return props.tile.player === 'plus' ? '#49CA81' : '#FFB42F'
})

const tilePrefix = computed(() => {
  const tileId = props.tile.tileId
  if (tileId === '0') {
    return ''
  }
  else if (tileId === '1' || tileId === '2') {
    return 'Yes, because'
  }
  else if (tileId === '3' || tileId === '4') {
    return 'No, because'
  }
  else {
    return props.parentRole === props.tile.player ? "Because" : "But"
  }
})

function onHover(isHovering: boolean) {
  if (props.disableInteractions) {
    showInteractions.value = false
    emit('hovering', props.tile.tileId)
    return
  }

  if (props.demoMode && (!props.tile.text || isEditable() || isEditing.value)) {
    showInteractions.value = false
    emit('hovering', props.tile.tileId)
    return
  }

  showInteractions.value = (isHovering && props.tile.player && props.tile.text !== '') || false
  if(props.tile.tileId === '0') {
    showReviseTopic.value = isHovering
  }
  if (props.tile.player === props.userRole && !props.tile.revised && props.tile.ruleCard) {
    showInteractions.value = false
  }
  emit('hovering', props.tile.tileId)
}

function onInput() {
  emit('typing', draft.value)
}

function onConfirm() {
  // Block submitting another argument while the coach is evaluating a tile
  if (props.disableInteractions) return
  const nextText = props.demoMode ? draft.value.trim() : draft.value

  if (props.demoMode && !nextText) {
    return
  }

  if (nextText.length > 100) {
    error('Too long! Try to keep tile under 100 characters')
    tooLongError.value = true
    setTimeout(() => { tooLongError.value = false }, 3000)
    return
  }

  tooLongError.value = false

  justConfirmed = true
  if (props.tile.ruleCard && !props.tile.revised) {
    emit('tile-revise', nextText)
    props.tile.revised = true
    draft.value = ''
  }
  else {
    emit('confirm', nextText)
    draft.value = ''
  }
}

function onEmojiPlace(emoji: string) {
  emit('emoji-place', emoji)
  showInteractions.value = false
}

function onRuleCardPlace(card: string) {
  emit('rule-card-place', card)
  showInteractions.value = false
} 

</script>

<style scoped>

#content p, h6, textarea {
  font-family: 'Coming Soon', cursive !important;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes aiTargetPulse {
  0%, 100% { opacity: 1;   box-shadow: 0 0 0 6px rgba(192,122,45,0.30), inset 0 0 10px rgba(192,122,45,0.12); }
  50%       { opacity: 0.5; box-shadow: 0 0 0 10px rgba(192,122,45,0.10), inset 0 0 6px rgba(192,122,45,0.06); }
}

/* Fade the target ring out when isAiTarget flips to false */
.ai-target-fade-leave-active { transition: opacity 0.8s ease; }
.ai-target-fade-leave-to     { opacity: 0; }

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
  inset: -1px; /*negative value, same size as border*/
  transform: rotate(45deg);
  content: '';
  border: inherit;
  background: white
}
.inner:before {
  position: absolute;
  inset: -3px; /*negative value, same size as border*/
  transform: rotate(45deg);
  content: '';
  border: inherit;
}

</style>

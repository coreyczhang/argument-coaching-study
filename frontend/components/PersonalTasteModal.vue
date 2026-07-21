<template>
  <EmojiResolutionModal
    :is-open="isOpen"
    :role="role"
    :my-role="myRole"
    emoji="wine"
    title="Disagree on taste?"
    subtitle="Describe your personal taste. It is what it is."
    :placer-submission="placerSubmission"
    :peer-submission="peerSubmission"
    :peer-typing="peerTyping"
    :peer-waiting="peerWaiting"
    @close="emit('close')"
    @reject="emit('reject')"
    @typing="emit('typing')"
    @submit="emit('submit', $event)"
  >
    <template #default="{ colors, isPlacer, placerSubmission, peerTyping, mySubmission, myText, onTyping, updateText }">
      <div :class="cardClasses(isPlacer)" :style="cardStyles(isPlacer, colors)">
        <h3 :class="headingClasses(isPlacer)" :style="headingStyles(isPlacer, colors)">
          {{ isPlacer ? "What are your and your peer's personal tastes?" : "Does this describe your and your peer's personal tastes?" }}
        </h3>
        
        <div class="flex-1 w-full flex flex-col items-center justify-center">
          <textarea
            v-if="isPlacer && !mySubmission"
            :value="myText"
            @input="updateText(($event.target as HTMLTextAreaElement).value); onTyping()"
            placeholder="What is your and your peer's personal taste?"
            class="w-full min-h-[160px] p-4 rounded-xl text-[#747474] resize-none focus:outline-none bg-transparent border-none placeholder-text"
            :style="`--placeholder-color: ${colors.secondary}`"
          ></textarea>
          
          <p v-else-if="isPlacer && mySubmission" class="text-base leading-[22px] text-center text-[#747474]">
            {{ mySubmission }}
          </p>
          
          <div v-else-if="!placerSubmission" class="flex gap-2">
            <span v-for="i in 3" :key="i" class="w-3 h-3 bg-white rounded-full"></span>
          </div>
          
          <p v-else class="text-base leading-[22px] text-center text-white px-4">
            {{ placerSubmission }}
          </p>
        </div>
        
        <div :class="statusClasses(isPlacer)" :style="statusStyles(isPlacer, peerTyping, colors)">
          <SparkleIcon class="w-4.5 h-4.5 flex-shrink-0" :style="`color: ${colors.primary}`" />
          <span class="text-xs font-medium leading-4" :style="`color: ${colors.primary}`">
            {{ getStatusText(isPlacer, peerTyping, mySubmission) }}
          </span>
        </div>
      </div>
    </template>
  </EmojiResolutionModal>
</template>

<script setup lang="ts">
import EmojiResolutionModal from './EmojiResolutionModal.vue'
import SparkleIcon from '~/assets/icons/sparkle.svg'

defineProps<{
  isOpen: boolean
  role: 'placer' | 'peer'
  myRole: 'plus' | 'minus'
  placerSubmission: string | null
  peerSubmission: string | null
  peerTyping: boolean
  peerWaiting: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'reject'): void
  (e: 'typing'): void
  (e: 'submit', text: string): void
}>()

const cardClasses = (isPlacer: boolean) => [
  'p-5 flex flex-col items-center gap-4 min-h-[360px] relative',
  isPlacer 
    ? 'bg-white border-2 rounded-[50px_50px_50px_0px] justify-between' 
    : 'rounded-[50px] justify-center'
]

const cardStyles = (isPlacer: boolean, colors: any) => {
  const base = 'box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);'
  return isPlacer 
    ? `border-color: ${colors.primary}; ${base}` 
    : `background-color: ${colors.cardBg}; ${base}`
}

const headingClasses = (isPlacer: boolean) => [
  'text-xl font-bold leading-[27px] text-center w-full max-w-[320px]',
  isPlacer ? 'opacity-60' : 'text-white'
]

const headingStyles = (isPlacer: boolean, colors: any) => 
  isPlacer ? `color: ${colors.secondary}` : ''

const statusClasses = (isPlacer: boolean) => {
  const base = 'absolute bottom-2 left-1/2 transform -translate-x-1/2 rounded-full px-3.5 py-2.5 flex items-center gap-1.5 whitespace-nowrap'
  return isPlacer ? `${base} bg-white` : `${base} bg-[#FDF8F3]`
}

const statusStyles = (isPlacer: boolean, peerTyping: boolean, colors: any) => {
  const border = `border: 1px solid ${colors.borderColor};`
  const shadow = peerTyping && !isPlacer ? `box-shadow: 0px 0px 10px ${colors.shadowColor};` : ''
  return isPlacer 
    ? `${border} box-shadow: 0px 0px 10px ${colors.shadowColor};`
    : `${border} ${shadow}`
}

const getStatusText = (isPlacer: boolean, peerTyping: boolean, mySubmission: string | null) => {
  if (isPlacer) {
    if (peerTyping) return 'Your peer is typing'
    if (!mySubmission) return 'Your peer can see once you are done'
    return 'Waiting for your peer...'
  }
  return peerTyping ? 'Your peer is typing' : 'Waiting for your peer...'
}
</script>

<style scoped>
.placeholder-text::placeholder {
  color: var(--placeholder-color);
  opacity: 0.6;
}
</style>




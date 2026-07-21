<template>
  <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center">
    <div class="absolute inset-0 backdrop-blur-sm bg-black/20"></div>

    <div
      class="relative bg-white rounded-[24px] shadow-xl w-full max-w-[680px] p-8 md:p-14 mx-4 flex flex-col justify-between items-center gap-6 pt-12">
      <div class="absolute -top-[36px] left-1/2 -translate-x-1/2">
        <Emoji :emoji="emoji" :size="72" />
      </div>

      <button @click="handleReject"
        class="absolute top-3 right-3 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity text-black"
        aria-label="Close modal">
        <CloseIcon class="w-9 h-9" />
      </button>

      <div class="flex flex-col items-center gap-3 px-8">
        <h2 class="text-[40px] leading-[52px] font-normal text-[#747474] text-center"
          style="font-family: 'Anton', sans-serif; white-space: nowrap;">
          {{ title }}
        </h2>
        <p class="text-lg font-bold leading-[26px] text-[#747474] text-center">
          {{ subtitle }}
        </p>
      </div>

      <div class="w-full max-w-[560px] flex flex-col gap-5">
        <slot :colors="colors" :is-placer="isPlacer" :placer-submission="placerSubmission" :peer-typing="peerTyping"
          :my-submission="mySubmission" :my-text="myText" :on-typing="handleTyping"
          :update-text="(val: string) => (myText = val)" />

        <div v-if="isPlacer" class="mx-auto">
          <button @click="handleSubmit" :disabled="submitDisabled" :class="submitButtonClasses"
            :style="submitButtonStyles">
            {{ placerButtonText }}
            <CheckIcon class="w-7 h-7" />
          </button>
        </div>

        <div v-else class="mx-auto flex gap-4">
          <button @click="handleReject" :disabled="!placerSubmission" :class="rejectButtonClasses"
            :style="rejectButtonStyles">
            REJECT
            <CloseIcon class="w-7 h-7 text-[#747474]" />
          </button>

          <button @click="handleAcknowledge" :disabled="!placerSubmission" :class="checkButtonClasses"
            :style="checkButtonStyles">
            {{ peerButtonText }}
            <CheckIcon class="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import CloseIcon from '~/assets/icons/close.svg'
import CheckIcon from '~/assets/icons/check.svg'
import Emoji from './Emoji.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    role: 'placer' | 'peer'
    myRole: 'plus' | 'minus'
    emoji: string
    title: string
    subtitle: string
    placerSubmission: string | null
    peerSubmission: string | null
    peerTyping: boolean
    peerWaiting: boolean
    placerButtonText?: string
    peerButtonText?: string
    validateSubmission?: (text: string) => boolean
  }>(),
  {
    placerButtonText: 'DONE',
    peerButtonText: 'ACCEPT',
    validateSubmission: (text: string) => text.trim().length > 0
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'reject'): void
  (e: 'typing'): void
  (e: 'submit', text: string): void
}>()

const myText = ref<string>('')
const mySubmission = ref<string | null>(null)

const isPlacer = computed(() => props.role === 'placer')

const colors = computed(() => {
  const isPlus = props.myRole === 'plus'
  return {
    primary: isPlus ? '#3ABAAA' : '#F48625',
    secondary: isPlus ? '#6ED59E' : '#EDA065',
    buttonBg: isPlus ? '#3ABAAA' : '#F48625',
    cardBg: isPlus ? '#3ABAAA' : '#EDA065',
    borderColor: isPlus ? 'rgba(58, 186, 170, 0.3)' : 'rgba(244, 134, 37, 0.7)',
    shadowColor: isPlus ? 'rgba(110, 213, 158, 0.3)' : 'rgba(244, 126, 21, 0.5)'
  }
})

const submitDisabled = computed(() => {
  if (mySubmission.value) return true
  return !props.validateSubmission(myText.value)
})

const submitButtonClasses = computed(() => [
  'mx-auto w-[140px] h-14 border-[1.5px] border-[#FDF8F3] text-[#FDF8F3] font-bold text-base rounded-lg flex items-center justify-center gap-2 transition-all',
  submitDisabled.value ? 'cursor-not-allowed opacity-50' : 'hover:translate-y-[-2px] active:translate-y-0'
])

const submitButtonStyles = computed(() => {
  const bg = `background-color: ${colors.value.buttonBg};`
  const shadow = !submitDisabled.value ? `box-shadow: 0px 4px 0px ${colors.value.buttonBg};` : ''
  const opacity = submitDisabled.value ? 'opacity: 0.5;' : ''
  return `${bg} ${shadow} ${opacity}`
})

const baseButtonClasses =
  'w-[140px] h-14 border-[1.5px] font-bold text-base rounded-lg flex items-center justify-center gap-2 transition-all'

const rejectButtonClasses = computed(() => [
  baseButtonClasses,
  'border-[#747474] text-[#747474]',
  !props.placerSubmission
    ? 'bg-white/50 cursor-not-allowed opacity-50'
    : 'bg-white hover:translate-y-[-2px] active:translate-y-0 cursor-pointer'
])

const rejectButtonStyles = computed(() => (props.placerSubmission ? 'box-shadow: 0px 4px 0px #747474;' : ''))

const checkButtonClasses = computed(() => [
  baseButtonClasses,
  'border-[#FDF8F3] text-[#FDF8F3]',
  !props.placerSubmission ? 'cursor-not-allowed opacity-50' : 'hover:translate-y-[-2px] active:translate-y-0 cursor-pointer'
])

const checkButtonStyles = computed(() => {
  const bg = `background-color: ${colors.value.buttonBg};`
  const shadow = props.placerSubmission ? `box-shadow: 0px 4px 0px ${colors.value.buttonBg};` : ''
  const opacity = !props.placerSubmission ? 'opacity: 0.5;' : ''
  return `${bg} ${shadow} ${opacity}`
})

const handleReject = () => {
  emit('reject')
  emit('close')
}

const handleTyping = () => {
  emit('typing')
}

const handleSubmit = () => {
  if (props.validateSubmission(myText.value)) {
    mySubmission.value = myText.value.trim()
    emit('submit', myText.value.trim())
  }
}

const handleAcknowledge = () => {
  emit('submit', 'acknowledged')
  emit('close')
}

watch(
  () => props.isOpen,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      myText.value = ''
      mySubmission.value = null
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

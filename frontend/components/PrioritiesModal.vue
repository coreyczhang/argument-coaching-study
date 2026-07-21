<template>
  <EmojiResolutionModal
    :is-open="isOpen"
    :role="role"
    :my-role="myRole"
    emoji="scale"
    title="Disagree on priorities?"
    subtitle="You might each lean in different directions on..."
    :placer-submission="placerSubmission"
    :peer-submission="peerSubmission"
    :peer-typing="peerTyping"
    :peer-waiting="peerWaiting"
    :validate-submission="validateSubmission"
    @close="emit('close')"
    @reject="emit('reject')"
    @typing="emit('typing')"
    @submit="handleSubmit"
  >
    <template #default="{ colors, isPlacer, placerSubmission, peerTyping, updateText }">
      <div class="w-full flex flex-col gap-2">
        
        <div class="flex flex-col items-center gap-[2px]">
          <div class="flex justify-center items-center gap-[30px]">
            <template v-if="isPlacer && !hasSubmitted">
              <div 
                class="speech-bubble-left flex justify-center items-center"
                :style="`border-color: ${leftBubbleColor}; box-shadow: inset 0px 0px 4px rgba(0, 0, 0, 0.1);`"
              >
                <input
                  v-model="leftPriority"
                  @input="handleInputChange(updateText)"
                  placeholder="Your priority"
                  class="bg-transparent text-center text-base font-medium focus:outline-none w-full placeholder-text"
                  :style="`color: ${leftBubbleColor}; --placeholder-color: ${leftBubbleColor}; --placeholder-opacity: 0.4;`"
                />
              </div>
              
              <div 
                class="speech-bubble-right flex justify-center items-center"
                :style="`border-color: ${rightBubbleColor}; box-shadow: inset 0px 0px 4px rgba(0, 0, 0, 0.1);`"
              >
                <input
                  v-model="rightPriority"
                  @input="handleInputChange(updateText)"
                  placeholder="Peer's priority"
                  class="bg-transparent text-center text-base font-medium focus:outline-none w-full placeholder-text"
                  :style="`color: ${rightBubbleColor}; --placeholder-color: ${rightBubbleColor}; --placeholder-opacity: 0.4;`"
                />
              </div>
            </template>
            
            <template v-else>
              <div
                class="speech-bubble-filled-left flex justify-center items-center gap-[14px]"
                :style="`background-color: ${leftBubbleColor}; box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);`"
              >
                <template v-if="!parsedSubmission?.left">
                  <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-white"></span>
                </template>
                <span v-else class="text-base font-medium text-white">{{ parsedSubmission.left }}</span>
              </div>
              
              <div
                class="speech-bubble-filled-right flex justify-center items-center gap-[14px]"
                :style="`background-color: ${rightBubbleColor}; box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);`"
              >
                <template v-if="!parsedSubmission?.right">
                  <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-white"></span>
                </template>
                <span v-else class="text-base font-medium text-white">{{ parsedSubmission.right }}</span>
              </div>
            </template>
          </div>
          
          <div class="flex items-center px-[10px] gap-1 h-6 w-full">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background-color: ${leftBubbleColor}`"></div>
            <div class="flex-1 flex items-center">
              <div 
                class="arrow-left"
                :style="`border-right-color: ${leftBubbleColor};`"
              ></div>
              <div class="flex-1 h-[2px]" :style="`background: linear-gradient(to right, ${leftBubbleColor}, ${rightBubbleColor})`"></div>
              <div 
                class="arrow-right"
                :style="`border-left-color: ${rightBubbleColor};`"
              ></div>
            </div>
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background-color: ${rightBubbleColor}`"></div>
          </div>
          
          <div v-if="isPlacer && !hasSubmitted" class="flex items-center justify-center gap-1.5 py-[2px] px-[14px]">
            <SparkleIcon class="w-[18px] h-[18px] text-[#747474]" />
            <span class="text-xs font-medium text-[#747474]">write one word for both you and your peer</span>
          </div>
          
          <div v-if="!isPlacer && !placerSubmission" class="flex items-center justify-center gap-1.5 py-[2px] px-[14px]">
            <SparkleIcon class="w-[18px] h-[18px] text-[#747474]" />
            <span class="text-xs font-medium text-[#747474]">Your peer is typing</span>
          </div>
        </div>
        
        <!-- <div class="flex flex-col gap-2.5">
          <h4 class="text-center text-xs font-medium text-[#747474]">
            Here are some suggestions
          </h4>
          
          <div class="flex flex-col gap-2.5">
            <div 
              v-for="(_, index) in leftSuggestions" 
              :key="index" 
              class="flex justify-center items-center gap-[50px]"
            >
              <div class="suggestion-shape-left suggestion-bubble">
                <div class="flex flex-col justify-center items-center w-[120px] h-[30px]">
                  <div class="text-[11px] font-normal leading-[16px] text-center uppercase text-[#747474]" style="font-family: Anton, sans-serif;">
                    {{ leftSuggestions[index].title }}
                  </div>
                  <div class="text-[8px] font-normal leading-[12px] text-center text-[#747474]">
                    {{ leftSuggestions[index].subtitle }}
                  </div>
                </div>
                <div class="w-9 h-9 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0 text-[#747474]">
                  <component :is="leftSuggestions[index].icon" class="w-6 h-6" />
                </div>
              </div>
              
              <div class="suggestion-shape-right suggestion-bubble">
                <div class="flex flex-col justify-center items-center w-[120px] h-[30px]">
                  <div class="text-[11px] font-normal leading-[16px] text-center uppercase text-[#747474]" style="font-family: Anton, sans-serif;">
                    {{ rightSuggestions[index].title }}
                  </div>
                  <div class="text-[8px] font-normal leading-[12px] text-center text-[#747474]">
                    {{ rightSuggestions[index].subtitle }}
                  </div>
                </div>
                <div class="w-9 h-9 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0 text-[#747474]">
                  <component :is="rightSuggestions[index].icon" class="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center px-[10px] gap-1 h-6">
            <div class="w-2.5 h-2.5 rounded-full bg-[#747474] flex-shrink-0"></div>
            <div class="flex-1 flex items-center">
              <div class="arrow-left" style="border-right-color: #747474;"></div>
              <div class="flex-1 h-[2px] bg-[#747474]"></div>
              <div class="arrow-right" style="border-left-color: #747474;"></div>
            </div>
            <div class="w-2.5 h-2.5 rounded-full bg-[#747474] flex-shrink-0"></div>
          </div>
        </div> -->
        
      </div>
    </template>
  </EmojiResolutionModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EmojiResolutionModal from './EmojiResolutionModal.vue'
import SparkleIcon from '~/assets/icons/sparkle.svg'
import EquityIcon from '~/assets/icons/priority-modal/equity.svg'
import MeritIcon from '~/assets/icons/priority-modal/merit.svg'
import LibertyIcon from '~/assets/icons/priority-modal/liberty.svg'
import SafetyIcon from '~/assets/icons/priority-modal/safety.svg'
import GlobalismIcon from '~/assets/icons/priority-modal/globalism.svg'
import NationalismIcon from '~/assets/icons/priority-modal/nationalism.svg'
import ProgressIcon from '~/assets/icons/priority-modal/progress.svg'
import TraditionIcon from '~/assets/icons/priority-modal/tradition.svg'

const props = defineProps<{
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

const leftPriority = ref('')
const rightPriority = ref('')
const hasSubmitted = ref(false)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    leftPriority.value = ''
    rightPriority.value = ''
    hasSubmitted.value = false
  }
})

const leftSuggestions = [
  {
    key: 'equity',
    title: 'EQUITY = FAIRNESS',
    subtitle: 'Level the playing field',
    icon: EquityIcon,
    value: 'EQUITY = FAIRNESS'
  },
  {
    key: 'liberty',
    title: 'LIBERTY',
    subtitle: 'Individual Choice',
    icon: LibertyIcon,
    value: 'LIBERTY'
  },
  {
    key: 'globalism',
    title: 'GLOBALISM',
    subtitle: 'Support all humanity',
    icon: GlobalismIcon,
    value: 'GLOBALISM'
  },
  {
    key: 'progress',
    title: 'PROGRESS',
    subtitle: 'New non-conforming ideas',
    icon: ProgressIcon,
    value: 'PROGRESS'
  }
]

const rightSuggestions = [
  {
    key: 'merit',
    title: 'MERIT = FAIRNESS',
    subtitle: 'Reward effort objectively',
    icon: MeritIcon,
    value: 'MERIT = FAIRNESS'
  },
  {
    key: 'safety',
    title: 'SAFETY',
    subtitle: 'Collective Protection',
    icon: SafetyIcon,
    value: 'SAFETY'
  },
  {
    key: 'nationalism',
    title: 'NATIONALISM',
    subtitle: 'Focus on our people',
    icon: NationalismIcon,
    value: 'NATIONALISM'
  },
  {
    key: 'tradition',
    title: 'TRADITION',
    subtitle: 'Stability & Unity',
    icon: TraditionIcon,
    value: 'TRADITION'
  }
]

const placerSubmissionData = computed(() => {
  if (leftPriority.value.trim() && rightPriority.value.trim()) {
    return JSON.stringify({ left: leftPriority.value.trim(), right: rightPriority.value.trim() })
  }
  return null
})

const parsedSubmission = computed(() => {
  if (!props.placerSubmission) return null
  try {
    return JSON.parse(props.placerSubmission) as { left: string; right: string }
  } catch {
    return null
  }
})

//  who placed the tile
// If I'm  placer I placed it
const placerRole = computed(() => {
  if (props.role === 'placer') {
    return props.myRole
  } else {
    return props.myRole === 'plus' ? 'minus' : 'plus'
  }
})


const leftBubbleColor = computed(() => {
  return placerRole.value === 'plus' ? '#5AACA8' : '#E88B56'
})

const rightBubbleColor = computed(() => {
  return placerRole.value === 'plus' ? '#E88B56' : '#5AACA8'
})

const validateSubmission = (text: string): boolean => {
  try {
    const data = JSON.parse(text)
    return !!(data.left?.trim() && data.right?.trim())
  } catch {
    return false
  }
}

const handleInputChange = (updateText: (text: string) => void) => {
  const left = leftPriority.value.trim()
  const right = rightPriority.value.trim()
  
  if (left && right) {
    updateText(JSON.stringify({ left, right }))
  } else {
    updateText('')
  }
  
  emit('typing')
}

const handleSubmit = (data: string) => {
  hasSubmitted.value = true
  emit('submit', data)
}
</script>

<style scoped>
.speech-bubble-left {
  width: 209px;
  height: 70px;
  background: white;
  border: 2px solid;
  border-radius: 20px 20px 20px 0px;
  flex: 1 1 0;
}

.speech-bubble-right {
  width: 209px;
  height: 70px;
  background: white;
  border: 2px solid;
  border-radius: 20px 20px 0px 20px;
  flex: 1 1 0;
}

.speech-bubble-filled-left {
  width: 209px;
  height: 70px;
  border-radius: 20px 20px 20px 0px;
  flex: 1 1 0;
}

.speech-bubble-filled-right {
  width: 209px;
  height: 70px;
  border-radius: 20px 20px 0px 20px;
  flex: 1 1 0;
}

.suggestion-bubble {
  background-color: white;
  border: 2px solid #747474;
  box-shadow: inset 0px 0px 4px rgba(0, 0, 0, 0.1);
}

.suggestion-shape-left {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0px 8px;
  gap: 5px;
  width: 200px;
  height: 50px;
  border-radius: 100px 100px 100px 0px;
}

.suggestion-shape-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0px 8px;
  gap: 5px;
  width: 200px;
  height: 50px;
  border-radius: 100px 100px 100px 0px;
  transform: scaleX(-1);
}

.suggestion-shape-right > * {
  transform: scaleX(-1);
}

.placeholder-text::placeholder {
  color: var(--placeholder-color);
  opacity: var(--placeholder-opacity);
}

/* Arrow heads for decorative lines */
.arrow-left {
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-right: 6px solid;
}

.arrow-right {
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid;
}
</style>


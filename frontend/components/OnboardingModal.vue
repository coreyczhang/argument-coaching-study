<template>
    <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 backdrop-blur-sm bg-black/20"></div>

        <div
            class="relative bg-white rounded-[24px] shadow-xl w-full max-w-[680px] p-8 md:p-14 mx-4 flex flex-col items-center gap-6 pt-12">
            <!-- Close button -->
            <button @click="handleClose"
                class="absolute top-3 right-3 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity text-black cursor-pointer"
                aria-label="Close tutorial">
                <CloseIcon class="w-9 h-9" />
            </button>

            <!-- Main content -->
            <div class="w-full max-w-[560px] flex flex-col items-center gap-7 mt-2">
                <!-- Media / board diagram area -->
                <div v-if="currentIndex !== 3" class="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5">
                    <OnboardingVideo :current-index="currentIndex" :my-role="myRole" />
                </div>

                <div v-else class="flex flex-col items-center space-y-4">
                    <StepFourTop class="scale-110" />
                    <h3 class="text-gray text-lg font-semibold">OR</h3>
                    <StepFourBottom class="scale-110" />
                </div>

                <!-- Text body -->
                <div class="text-center flex flex-col items-center justify-center space-y-4">
                    <div class="flex flex-row gap-3 justify-center items-start">
                        <TileIcon class="drop-shadow-[0_8px_18px_rgba(0,0,0,0.18)] w-7 h-7"
                            :style="{ color: colors.primary }" />
                        <h3 class="text-xl max-w-[26rem] text-left leading-snug">
                            {{ currentStep.body }}
                        </h3>
                    </div>

                    <div v-if="currentStep.subtitle" id="subtitle" class="flex flex-row gap-2 items-center">
                        <SparkleIcon class="w-4 h-4 text-gray" />
                        <p class="text-sm leading-[20px] italic font-medium text-gray">
                            {{ currentStep.subtitle }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="w-full max-w-[560px] mt-6 flex flex-col gap-5 items-center">
                <!-- Progress + arrows -->
                <div id="progress" class="flex flex-row justify-between w-full px-2 overflow-visible">
                    <!-- Left arrow -->
                    <button v-if="currentIndex > 0" @click="prevStep"
                        class="w-12 h-12 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer transition overflow-visible">
                        <ArrowIcon class="rotate-180 w-7 h-7 overflow-visible" />
                    </button>
                    <div v-else class="w-12 h-12 flex items-center justify-center opacity-50 overflow-visible">
                        <ArrowIcon class="rotate-180 w-7 h-7 overflow-visible" />
                    </div>

                    <!-- Dots -->
                    <div class="flex items-center justify-center gap-2.5">
                        <button v-for="(step, idx) in steps" :key="step.id" @click="goTo(idx)"
                            class="rounded-full transition-all"
                            :class="idx === currentIndex ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'"
                            :style="idx === currentIndex ? activeDotStyle : inactiveDotStyle" />
                    </div>

                    <!-- Right arrow / finish -->
                    <button v-if="!isLastStep" @click="nextStep"
                        class="w-12 h-12 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer transition overflow-visible">
                        <ArrowIcon class="w-7 h-7 overflow-visible" />
                    </button>

                    <button v-else @click="handleComplete"
                        class="w-12 h-12 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer transition overflow-visible">
                        <FinishedIcon class="w-7 h-7 overflow-visible" :style="{ color: colors.buttonBg }" />
                    </button>
                </div>

                <!-- Skip -->
                <button class="text-base text-gray underline underline-offset-4 hover:opacity-80" @click="handleSkip">
                    Skip tutorial ✕
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import CloseIcon from '~/assets/icons/close.svg'
import ArrowIcon from '~/assets/icons/arrow-right.svg'
import FinishedIcon from '~/assets/onboarding/check.svg'
import TileIcon from '~/assets/onboarding/tile.svg'
import SparkleIcon from '~/assets/icons/sparkle.svg'
import StepFourTop from '~/assets/onboarding/step4-top.svg'
import StepFourBottom from '~/assets/onboarding/step4-bottom.svg'
import OnboardingVideo from './OnboardingVideo.vue'

const props = withDefaults(
    defineProps<{
        isOpen: boolean
        myRole: 'plus' | 'minus' | null
        steps?: any[]
    }>(),
    {
        steps: () => [
            { id: 'step-1', body: 'Each player writes down 2 starting reason tiles supporting their opinion' },
            { id: 'step-2', body: 'Hover to add a tile', subtitle: 'Write only one short idea per tile' },
            { id: 'step-3', body: 'Hover to resolve a thread by placing an emoji on the tile', subtitle: 'what does each emoji mean?' },
            { id: 'step-4', body: '2 ways to win' },
            { id: 'step-5', body: 'Learn more by watching this video', subtitle: 'You can also watch this video on YouTube' }
        ]
    }
)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'complete'): void
    (e: 'step-change', index: number): void
}>()

const currentIndex = ref(0)

const colors = computed(() => {
    const isPlus = props.myRole === 'plus'
    return {
        primary: isPlus ? '#3ABAAA' : '#F48625',
        buttonBg: isPlus ? '#3ABAAA' : '#F48625',
        borderColor: isPlus ? 'rgba(58,186,170,0.3)' : 'rgba(244,134,37,0.7)'
    }
})

const steps = computed(() => props.steps)
const currentStep = computed(() => steps.value[currentIndex.value])
const isLastStep = computed(() => currentIndex.value === steps.value.length - 1)

const activeDotStyle = computed(
    () => `background-color:${colors.value.primary}; box-shadow:0 0 0 3px ${colors.value.borderColor};`
)
const inactiveDotStyle = 'background-color:#D4D4D4;'

const goTo = (idx: number) => {
    if (idx < 0 || idx >= steps.value.length) return
    currentIndex.value = idx
    emit('step-change', idx)
}

const nextStep = () => !isLastStep.value && goTo(currentIndex.value + 1)
const prevStep = () => currentIndex.value > 0 && goTo(currentIndex.value - 1)

const handleSkip = () => emit('close')
const handleClose = () => emit('close')
const handleComplete = () => {
    emit('complete')
    emit('close')
}

watch(
    () => props.isOpen,
    (open) => {
        document.body.style.overflow = open ? 'hidden' : ''
        if (open) currentIndex.value = 0
    }
)

onUnmounted(() => {
    document.body.style.overflow = ''
})
</script>

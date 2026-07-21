<template>
    <div id="blur" class="w-full h-full absolute inset-0 flex flex-col items-center justify-center z-10"
        style="background: rgba(116, 116, 116, 0.4); backdrop-filter: blur(8px);">
        <div id="win-alert" class="flex flex-col items-center px-12 py-[48px] gap-5 bg-white rounded-[20px]">
            <div class="relative inline-flex items-center justify-center">
                <div class="absolute size-16 rounded-full bg-white shadow-md"></div>
                <Emoji :emoji="'party'" :size="48" class="relative z-10" />
            </div>
            <div v-if="winCondition === 'threads'" id="win-with-threads" class="flex flex-col items-center w-[435px]">
                <div id="headers" class="flex flex-col items-center mb-8">
                    <h3 class="!text-[32px] !leading-[48px] font-normal text-[#747474] text-center whitespace-nowrap"
                        style="font-family: 'Anton', sans-serif;">You've won!</h3>
                    <p class="text-base leading-[22px] font-semibold text-[#747474] text-center whitespace-nowrap">
                        You've resolved all threads on the game board:</p>
                </div>
                <div class="grid grid-cols-2">
                    <div v-for="(emoji, index) in emojisDisplay" :key="index" id="thread"
                        class="flex items-center justify-center size-[7rem]">
                        <ThumbsUp v-if="emoji === 'thumbs-up'" />
                        <Wine v-else-if="emoji === 'wine'" />
                        <MagnifyingGlass v-else-if="emoji === 'shared-facts'" />
                        <Scale v-else-if="emoji === 'scale'" />
                    </div>
                </div>
                <div class="flex flex-col items-center gap-2 mb-4">
                    <div v-if="threadCounts['thumbs-up']" class="flex items-center gap-2">
                        <ThumbsUp />
                        <p class="text-base leading-[22px] text-[#4D4C4A] whitespace-nowrap">You reached common ground
                            in <span class="font-semibold">{{ threadCounts['thumbs-up'] }}</span> {{
                            threadCounts['thumbs-up'] === 1 ? 'thread' : 'threads' }}</p>
                    </div>
                    <div v-if="threadCounts['scale']" class="flex items-center gap-2">
                        <Scale />
                        <p class="text-base leading-[22px] text-[#4D4C4A] whitespace-nowrap">You weighed both
                            perspectives in <span class="font-semibold">{{ threadCounts['scale'] }}</span> {{
                            threadCounts['scale'] === 1 ? 'thread' : 'threads' }}</p>
                    </div>
                    <div v-if="threadCounts['wine']" class="flex items-center gap-2">
                        <Wine/>
                        <p class="text-base leading-[22px] text-[#4D4C4A] whitespace-nowrap">You found shared values in
                            <span class="font-semibold">{{ threadCounts['wine'] }}</span> {{ threadCounts['wine'] === 1
                            ? 'thread' : 'threads' }}
                        </p>
                    </div>
                    <div v-if="threadCounts['shared-facts']" class="flex items-center gap-2">
                        <MagnifyingGlass /> 
                        <p class="text-base leading-[22px] text-[#4D4C4A] whitespace-nowrap">You identified shared facts
                            in <span class="font-semibold">{{ threadCounts['shared-facts'] }}</span> {{
                            threadCounts['shared-facts'] === 1 ? 'thread' : 'threads' }}</p>
                    </div>
                </div>
            </div>
            <div v-if="winCondition === 'topic'" id="win-with-topic" class="flex flex-col items-center gap-5 w-[435px]">
                <div id="headers" class="flex flex-col items-center gap-2">
                    <h3 class="!text-[32px] !leading-[48px] font-normal text-[#747474] text-center whitespace-nowrap"
                        style="font-family: 'Anton', sans-serif;">You've won!</h3>
                    <p class="text-base leading-[22px] font-bold text-[#747474] text-center whitespace-nowrap">You've
                        agreed on a revised topic:</p>
                </div>
                <TileShape :size="14" :color="'black'" :text="newTopic" />
            </div>
            <div id="buttons" class="flex flex-col items-center justify-center gap-4 w-[435px]">
                <div id="buttons-container" class="flex justify-center gap-[29px] w-[435px] h-11">
                    <a href="https://forms.gle/5ytQZJeRMhbvxesc7" target="_blank" rel="noopener noreferrer"
                        class="flex flex-row items-center justify-center py-3 px-6 gap-3 w-[203px] h-11 rounded-lg border-[1.5px] border-[#FDF8F3] bg-[#4D4C4A] text-[#FDF8F3] text-sm font-bold leading-[19px] whitespace-nowrap hover:bg-[#3a3939] transition-colors shadow-[0px_4px_0px_#4D4C4A]">
                        <FeedbackIcon class="w-5 h-5 text-white" />
                        Leave feedback
                    </a>
                    <button @click="shareToLinkedIn"
                        class="flex flex-row items-center justify-center py-3 px-6 gap-3 w-[203px] h-11 rounded-lg border-[1.5px] border-[#747474] bg-[#FDF8F3] text-[#4D4C4A] text-sm font-bold leading-[19px] whitespace-nowrap hover:bg-gray-50 transition-colors shadow-[0px_4px_0px_#747474]">
                        <ShareIcon class="w-5 h-5 text-[#4D4C4A]" />
                        Share to Linkedin
                    </button>
                </div>
            </div>
            <div id="sidenote" class="flex items-start gap-[6px] max-w-[435px] opacity-70">
                <SparkleIcon class="w-[18px] h-[18px] flex-shrink-0 text-[#747474]" />
                <p class="text-sm leading-[19px] italic font-medium text-[#747474]">Feel free to stay if you want to
                    review the game board, expand your arguments, or try to agree on a revised topic!</p>
            </div>
        </div>
        <NuxtLink to="/"
            class="flex items-center justify-center py-5 px-16 gap-3 w-[332px] h-[59px] mt-4.5 rounded-lg border-[1.5px] border-[#FDF8F3] bg-[#4D4C4A] text-[#FDF8F3] text-sm font-bold leading-[19px] whitespace-nowrap hover:bg-[#3a3939] transition-colors shadow-[0px_4px_0px_#4D4C4A]">
            Play Again
        </NuxtLink>
    </div>
</template>
<script setup lang="ts">
import FeedbackIcon from '~/assets/icons/feedback.svg'
import ShareIcon from '~/assets/icons/share.svg'
import SparkleIcon from '~/assets/icons/sparkle.svg'

import ThumbsUp from '~/assets/emojis/thumbs-up-hovered.svg';
import MagnifyingGlass from '~/assets/emojis/mag-glass-hovered.svg';
import Scale from '~/assets/emojis/scale-hovered.svg';
import Wine from '~/assets/emojis/wine-hovered.svg';

const props = defineProps({
    winCondition: {
        type: String as () => 'threads' | 'topic',
        required: true
    },
    newTopic: {
        type: String,
        default: null
    },
    threads: {
        type: Array as () => Array<string>,
        default: () => []
    }
})

const threadCounts = computed(() => {
    return props.threads.reduce((acc, emoji) => {
        acc[emoji] = (acc[emoji] || 0) + 1
        return acc
    }, {} as Record<string, number>)
})


const emojisDisplay = computed(() => {
    const a = props.threads // [t1, t2, t3, t4]
    return [a[3], a[0], a[2], a[1]] // [TL, TR, BL, BR]
})


const shareToLinkedIn = () => {
    const shareText = `I just played a round of Point Taken, a game designed to facilitate dialogue around controversial topics. What stood out to me: the focus isn't on "winning" an argument, but on practicing active listening and clear reasoning. In a world where civil discourse feels harder than ever, I found it refreshing—and surprisingly engaging. If you're interested in building better critical thinking and communication skills, I encourage you to check it out: https://pointtaken.social`
    const encodedText = encodeURIComponent(shareText)
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`
    window.open(linkedInUrl, '_blank')
}

</script>
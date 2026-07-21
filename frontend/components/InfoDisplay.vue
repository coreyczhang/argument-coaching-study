<template>
    <div id="container"
        class="w-[10rem] p-4 border-2 border-gray-400 rounded-lg flex flex-col items-center text-center space-y-6 z-20 bg-neutral-white">
        <h4 class="text-gold font-extrabold">PATHS TO WINNING</h4>
        <div id="threads" class="flex flex-col space-y-4 items-center">
            <h5 class="text-gray">Resolve all threads</h5>
            <div class="grid grid-cols-2 gap-3">
                <div v-for="(emoji, index) in resolvedThreadsDisplay" :key="index" id="thread"
                    class="flex items-center justify-center w-16 h-16">
                    <ThumbsUp v-if="emoji === 'thumbs-up'" />
                    <Wine v-else-if="emoji === 'wine'" />
                    <MagnifyingGlass v-else-if="emoji === 'shared-facts'" />
                    <Scale v-else-if="emoji === 'scale'" />

                    <div v-else
                        class="flex items-center justify-center size-14 border-2 border-gray rounded-lg shadow-lg text-gray-400">
                        <h3>?</h3></div>
                </div>
            </div>
            <h3 class="">{{ `${resolvedThreadsCount}/4` }}</h3>
        </div>
        <div id="topic" class="flex flex-col space-y-4 items-center">
            <h5 class="text-gray">Agree on a revised topic</h5>
            <div class="relative flex">
                <div id="inner-wrapper" class="relative overflow-hidden size-[2rem]">
                    <div
                        :class="`inner absolute inset-0 overflow-hidden rotate-45 border-1 border-neutral-black bg-${isTopicRevised ? 'gold' : ''}`" />
                </div>
            </div>
            <h3 class="font-bold">{{ isTopicRevised ? 'Revised' : 'Not yet' }}</h3>
            <button @click="emit('open-topic-revision')"
                class="flex items-center justify-center px-6 py-1 rounded-lg border-[1.5px]">Revise</button>
        </div>
        <div id="instructions" class="flex flex-col items-center -mt-2">
            <button @click="openInstructions"
                class="flex items-center justify-center px-6 py-1 rounded-lg border-[1.5px]">Instructions</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import ThumbsUp from '~/assets/emojis/thumbs-up-hovered.svg';
import MagnifyingGlass from '~/assets/emojis/mag-glass-hovered.svg';
import Scale from '~/assets/emojis/scale-hovered.svg';
import Wine from '~/assets/emojis/wine-hovered.svg';

const emit = defineEmits([
  'open-topic-revision',
  'open-instructions'
])

const props = defineProps<{
    resolvedThreads: ('thumbs-up' | 'shared-facts' | 'wine' | 'scale' | null)[]
    resolvedThreadsCount: number
    isTopicRevised: boolean
}>()

const resolvedThreadsDisplay = computed(() => {
    const a = props.resolvedThreads // [t1, t2, t3, t4]
    return [a[3], a[0], a[2], a[1]] // [TL, TR, BL, BR]
})

const openInstructions = () => {
    emit('open-instructions')
}

console.log(props.resolvedThreads)


</script>
<style scoped>

.inner:before {
    position: absolute;
    inset: -1px;
    /*negative value, same size as border*/
    transform: rotate(45deg);
    content: '';
    border: inherit;
}
</style>

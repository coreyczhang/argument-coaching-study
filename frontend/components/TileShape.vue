<template>
    <div id="tile-shape" class="relative flex">
        <div id="outer-wrapper" class="absolute overflow-hidden -inset-3 ">
            <div :class="`outer absolute inset-0 overflow-hidden rotate-45 border`"
                :style="{ borderColor: rawColor, '--bg-color': backgroundColor }" />
        </div>
        <div id="inner-wrapper" class="relative overflow-hidden inset-0"
            :style="{ width: `${size}rem`, height: `${size}rem` }">
            <div :class="`inner absolute inset-0 overflow-hidden rotate-45 border-3`"
                :style="{ borderColor: rawColor }" />
        </div>

        <div id="content" class="absolute inset-0 flex items-center justify-center">
            <h3 class="absolute top-0" :style="{
                color: '#FFF',
                WebkitTextStrokeWidth: '1.5px',
                WebkitTextStrokeColor: rawColor,
            }">{{ header }}</h3>
            <h6 v-if="prefix" class="absolute top-10 font-semibold">{{ prefix }}</h6>

            <p v-if="text" class="text-gray-800 text-center p-2">{{ text }}</p>
            <div v-if="emoji" @mouseenter="emojiHovering = true" @mouseleave="emojiHovering = false"
                @click="undoPlaceEmoji" class="absolute -bottom-8 z-100 w-20 h-20 flex items-center justify-center">
                <div v-if="emojiHovering"
                    class=" bg-gold border-3 border-white rounded-lg p-2 text-xl z-2 cursor-pointer">
                    <Undo class="text-white" />
                </div>
                <Wine v-else-if="emoji === 'wine'" />
                <MagnifyingGlass v-else-if="emoji === 'shared-facts'" />
                <Scale v-else-if="emoji === 'scale'" />
                <ThumbsUp v-else-if="emoji === 'thumbs-up'" />
            </div>


            <div v-if="ruleCard && !emoji"
                class="absolute -bottom-8 bg-white border-2 border-gray-400 rounded-md py-4 px-2 text-xl z-10">
                <Emoji :emoji="ruleCard" :size="32" />
            </div>
            <div v-if="text" id="icons" class="absolute bottom-2 flex space-x-4 z-1">
                <Plus class="size-5" v-if="color === 'green'" v-for="i in 3" :key="i" />
                <Minus class="size-5" v-else-if="color === 'orange'" v-for="j in 3" :key="j" />
            </div>
            <div id="bg" class="absolute inset-0 flex items-center justify-center opacity-8 z-1">
                <Plus class="size-24" v-if="color === 'green'" />
                <Minus class="size-24" v-else-if="color === 'orange'" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Plus from '~/assets/icons/plus.svg'
import Minus from '~/assets/icons/minus.svg'
import Undo from '~/assets/icons/undo.svg'

import ThumbsUp from '~/assets/emojis/thumbs-up-hovered.svg';
import MagnifyingGlass from '~/assets/emojis/mag-glass-hovered.svg';
import Scale from '~/assets/emojis/scale-hovered.svg';
import Wine from '~/assets/emojis/wine-hovered.svg';

const props = defineProps({
    // size in rem
    size: {
        type: Number,
        required: true
    },
    color: {
        type: String as () => 'orange' | 'green' | 'black' | 'grey',
        required: true,
    },
    header: {
        type: String as () => 'reason' | 'topic' | null,
        default: 'reason',
    },
    prefix: {
        type: String,
        default: null
    },
    text: {
        type: String,
        default: null
    },
    emoji: {
        type: String as () => 'thumbs-up' | 'wine' | 'shared-facts' | 'scale' | null,
        default: null
    },
    ruleCard: {
        type: String,
        default: null
    },
    userRole: {
        type: String as () => 'plus' | 'minus' | null,
        default: null
    },
    backgroundColor: {
        type: String,
        default: 'white'
    }
})

const emojiHovering = ref(false)

const rawColor = computed(() => {
    switch (props.color) {
        case 'orange': return '#FFB42F'
        case 'green': return '#49CA81'
        case 'black': return '#1E1E1E'
        case 'grey': return '#747474'
        default: return '#1E1E1E'
    }
})
const emit = defineEmits(['undo-place-emoji'])

const undoPlaceEmoji = () => {
    if (!emojiHovering.value) return
    emit('undo-place-emoji')
}

</script>

<style scoped>
#content p, h6, textarea {
    font-family: 'Coming Soon', cursive !important;
}
.outer:before {
    position: absolute;
    inset: -1px;
    /*negative value, same size as border*/
    transform: rotate(45deg);
    content: '';
    border: inherit;
    background: var(--bg-color, white);
}

.inner:before {
    position: absolute;
    inset: -3px;
    /*negative value, same size as border*/
    transform: rotate(45deg);
    content: '';
    border: inherit;
}
</style>

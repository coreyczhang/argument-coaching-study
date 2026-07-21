<template>
    <div id="emojis" class="flex flex-col space-y-4 items-center">
        <h3 class="text-[1rem]! text-gray font-bold">{{headerText}}</h3>

        <div class="flex flex-row">
            <button v-for="(emoji, key) in thumbsUpGroup" :key="key" @mouseenter="hovered = key"
                @mouseleave="hovered = null" @click="placeEmoji(emoji.name)" class="flex items-center justify-center size-14 text-xl overflow-visible
               hover:-translate-y-2 hover:rotate-[-10deg] ease-in-out duration-150">
                <component :is="hovered === key ? emoji.hovered : emoji.normal"
                    class="w-auto h-auto overflow-visible" />
            </button>
        </div>

        <!-- Row 2: All other emojis -->
        <div class="flex flex-row space-x-4">
            <button v-for="(emoji, key) in otherEmojis" :key="key" @mouseenter="hovered = key"
                @mouseleave="hovered = null" @click="placeEmoji(emoji.name)" class="flex items-center justify-center size-14 text-xl overflow-visible
               hover:-translate-y-2 hover:rotate-[-10deg] ease-in-out duration-150">
                <component :is="hovered === key ? emoji.hovered : emoji.normal"
                    class="w-auto h-auto overflow-visible" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const emit = defineEmits(['place-emoji']);

import ThumbsUp from '~/assets/emojis/thumbs-up.svg';
import ThumbsUpHovered from '~/assets/emojis/thumbs-up-hovered.svg';
import MagnifyingGlass from '~/assets/emojis/mag-glass.svg';
import MagnifyingGlassHovered from '~/assets/emojis/mag-glass-hovered.svg';
import Scale from '~/assets/emojis/scale.svg';
import ScaleHovered from '~/assets/emojis/scale-hovered.svg';
import Wine from '~/assets/emojis/wine.svg';
import WineHovered from '~/assets/emojis/wine-hovered.svg';

const hovered = ref<keyof typeof emojis | null>(null);

const emojis = {
    thumbsUp: {
        name: 'thumbs-up',
        text: 'Agree to agree',
        normal: ThumbsUp,
        hovered: ThumbsUpHovered,
    },
    wine: {
        name: 'wine',
        text: 'Disagree on personal taste',
        normal: Wine,
        hovered: WineHovered,
    },
    magnifyingGlass: {
        name: 'shared-facts',
        text: 'Disagree on a fact',
        normal: MagnifyingGlass,
        hovered: MagnifyingGlassHovered,
    },
    scale: {
        name: 'scale',
        text: 'Disagree on priorities',
        normal: Scale,
        hovered: ScaleHovered,
    }
};

// Computed groups for clean template logic
const thumbsUpGroup = computed(() => ({
    thumbsUp: emojis.thumbsUp
}));

const otherEmojis = computed(() => {
    const { thumbsUp, ...rest } = emojis;
    return rest;
});
const headerText = computed(() => {
    if (!hovered.value) return "Resolve Thread";
    return emojis[hovered.value]?.text ?? "Resolve Thread";
});

function placeEmoji(name: string) {
    emit('place-emoji', name);
}
</script>

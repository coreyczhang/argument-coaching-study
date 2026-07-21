<template>
    <component 
        :is="Component" 
        :style="[styleObj, twoToneStyle]" 
        :class="{'monochrome': !!color}"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import thumbsUp from '~/assets/emojis/thumbs-up.svg';
import eyes from '~/assets/emojis/eyes.svg';
import glasses from '~/assets/emojis/glasses.svg';
import heart from '~/assets/emojis/heart.svg';
import magnifyingGlass from '~/assets/emojis/mag-glass.svg';
import party from '~/assets/emojis/party.svg';
import wine from '~/assets/emojis/wine.svg';
import scale from '~/assets/emojis/scale.svg';
import monocle from '~/assets/emojis/monacle.svg';
import book from '~/assets/emojis/book.svg';

const props = defineProps<{
    emoji: string | null,
    size: number,
    color?: string | null,
    stroke?: boolean,
    strokeWidth?: number | null,
    // only needed when working with two-tone emojis
    primaryColor?: string | null,
    secondaryColor?: string | null
} > ()

const Component = computed(() => {
    switch (props.emoji) {
        case 'thumbs-up':
            return thumbsUp;
        case 'eyes':
            return eyes;
        case 'monocle':
            return monocle;
        case 'honest-thinking':
            return glasses;
        case 'mutual-respect':
            return heart;
        case 'shared-facts':
            return magnifyingGlass;
        case 'book':
            return book;
        case 'party':
            return party;
        case 'wine':
            return wine;
        case 'scale':
            return scale;
        default:
            return null;
    }
})

const styleObj = computed(() => {
    const s = typeof props.size === 'number' ? `${props.size}px` : props.size
    const style: Record<string, string> = {}
    if (s) { style.width = s; style.height = s }
    if (props.color) { style.color = props.color }
    if (props.stroke) {
        style['stroke'] = "white",
        style['stroke-width'] = props.strokeWidth ? props.strokeWidth.toString() : '4'
        style['stroke-linejoin'] = 'round'
        style['paint-order'] = 'stroke'
        style['overflow'] = 'visible'
    }
    return style
})
const twoToneStyle = computed(() => {
    const s: Record<string, string> = {}
    if (props.primaryColor) s['--emoji-base'] = props.primaryColor
    if (props.secondaryColor) s['--emoji-secondary'] = props.secondaryColor
    return s
})

</script>

<style>
.monochrome *[fill]:not([fill="none"]) {
    fill: currentColor !important;
}
.monochrome stop {
    stop-color: currentColor !important;
}
</style>
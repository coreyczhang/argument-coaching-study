<template>
    <div :class="[
        'w-full h-full',
        // only step 3 needs the extra crop/zoom wrapper
        currentIndex === 2 ? 'step3-wrapper' : ''
    ]">
        <video v-if="videoSrc" ref="videoEl" :src="videoSrc" autoplay muted playsinline :class="[
            'w-full h-full object-cover',
            // step 3: zoom/crop
            currentIndex === 2 ? 'step3-crop' : ''
        ]">
            Your browser does not support the video tag.
        </video>

        <!-- Step 5: YouTube embed (make it responsive / fill parent) -->
        <div v-else-if="props.currentIndex === 4" class="w-full h-full">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/VGJvsuhWV-Q?si=wOP-m6AIOi2q1wu8"
                title="YouTube video player" frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
    currentIndex: number
    myRole: 'plus' | 'minus' | null
}>()

const LOOP_DELAY = 800
const videoEl = ref<HTMLVideoElement | null>(null)

const videoSrc = computed(() => {
    if (props.currentIndex === 0) {
        return props.myRole === 'plus' ? '/onboarding/step1-plus.mp4' : '/onboarding/step1-minus.mp4'
    }
    if (props.currentIndex === 1) return '/onboarding/step2.mp4'
    if (props.currentIndex === 2) return '/onboarding/step3.mp4'
    if (props.currentIndex === 3) return '/onboarding/step4.mp4'
    return null
})

const attachDelayedLoop = () => {
    const v = videoEl.value
    if (!v) return

    v.onended = null
    v.onended = () => {
        setTimeout(() => {
            const vv = videoEl.value
            if (!vv) return
            vv.currentTime = 0
            vv.play().catch(() => { })
        }, LOOP_DELAY)
    }
}

watch(
    () => [props.currentIndex, props.myRole],
    async () => {
        await nextTick()
        attachDelayedLoop()
    },
    { immediate: true }
)
</script>

<style scoped>
/* Step 3 needs extra crop/zoom, but keep it clean + rounded */
.step3-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    /* matches rounded-2xl */
}

/* Zoom + crop specifically for step 3 (tuned slightly larger to match the scaled-up modal) */
.step3-crop {
    transform: scale(1.65) translateY(-4%);
    transform-origin: left center;
}
</style>

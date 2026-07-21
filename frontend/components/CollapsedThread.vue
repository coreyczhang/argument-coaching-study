<template>
    <div id="collapsed-thread" class="relative size-[17rem]" @mouseover="handleHover(true)"
        @mouseleave="handleHover(false)">
        <TileShape v-for="(t, index) in props.thread.tiles" :key="`collapsed-${t.tileId}`" :size="17"
            :color="t.player === 'plus' ? 'green' : t.player === 'minus' ? 'orange' : 'black'"
            :prefix="prefixFor(t, parentRoles[index])" :text="t.text" :emoji="t.emoji" :header="'reason'"
            :rule-card="t.ruleCard ?? undefined" :style="tileStyle(index)" @undo-place-emoji="handleUndoPlaceEmoji(t.tileId)" :user-role="props.userRole" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CollapsedThread, Tile as TileType } from '@/types'

const props = defineProps<{
    thread: CollapsedThread,
    userRole: 'plus' | 'minus' | null
}>()

const emit = defineEmits<{
    (e: 'undo-place-emoji', tileId: string): void
}>()


const side = ref<'left' | 'right'>('right')
const spacing = ref<number>(8)

const tilesLen = computed(() => props.thread.tiles.length)

function tileStyle(index: number) {
    const pos = `${index * spacing.value}rem`
    const z = 1 + (tilesLen.value - index)
    if (side.value === 'left') {
        return { position: 'absolute', top: '0', zIndex: String(z), left: pos }
    } else {
        return { position: 'absolute', top: '0', zIndex: String(z), right: pos }
    }
}

function prefixFor(t: TileType, parentRole: 'plus' | 'minus' | null): string {
    const id = t.tileId
    if (id === '0') return ''
    if (id === '1' || id === '4') return 'Yes, because'
    if (id === '2' || id === '3') return 'No, because'
    return parentRole === t.player ? 'Because' : 'But'
}

const parentRoles = computed<('plus' | 'minus' | null)[]>(() => {
    const roles: ('plus' | 'minus' | null)[] = []
    for (let i = 0; i < props.thread.tiles.length; i++) {
        roles.push(i === 0 ? 'plus' : (props.thread.tiles[i - 1].player ?? null))
    }
    return roles
})

onMounted(() => {
    if (props.thread.pos.x > 0) side.value = 'left'
})

function handleHover(isHovering: boolean) {
    spacing.value = isHovering ? 19 : 8
}

function handleUndoPlaceEmoji(tileId: string) {
    emit('undo-place-emoji', tileId)
}
</script>

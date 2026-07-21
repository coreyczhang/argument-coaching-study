<template>
    <div class="flex flex-col items-center">
        <h3 class="mb-3 text-center font-semibold text-gray-800 mb-8">
            And choose your stance
        </h3>

        <div id="roles" class="flex flex-row items-center gap-24">
            <!-- PLUS -->
            <button
                :class="`group grid h-30 w-30 place-items-center rounded-xl border-2 ${(selected == 'plus' || hover == 'plus') ? 'border-green' : 'border-gray'} transition hover:shadow-md focus:outline-none`"
                @mouseenter="hover = 'plus'" @mouseleave="hover = null" @click="onSelect('plus')">
                <component :is="iconFor('plus')" class="h-18 w-18" />
                <p :class="`${(selected == 'plus' || hover == 'plus') ? 'text-green' : 'text-gray'}`">Plus</p>
            </button>

            <!-- MINUS -->
            <button
                :class="`group grid h-30 w-30 place-items-center rounded-xl border-2 ${(selected == 'minus' || hover == 'minus') ? 'border-orange' : 'border-gray'} transition hover:shadow-md focus:outline-none`"
                @mouseenter="hover = 'minus'" @mouseleave="hover = null" @click="onSelect('minus')">
                <component :is="iconFor('minus')"
                    :class="['h-18', 'w-18', (selected == 'minus' || hover == 'minus') ? 'scale-x-[-1]' : '']" />
                <p :class="`${(selected == 'minus' || hover == 'minus') ? 'text-orange' : 'text-gray'}`">Minus</p>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Icons
import PlusNotSelected from '~/assets/icons/plus-notselected.svg'
import MinusNotSelected from '~/assets/icons/minus-notselected.svg'
import PlusSelected from '~/assets/icons/plus-peer.svg'
import MinusSelected from '~/assets/icons/minus-peer.svg'

const emit = defineEmits<{
    (e: 'selectRole', choice: 'plus' | 'minus'): void
}>()

const hover = ref<'plus' | 'minus' | null>(null)
const selected = ref<'plus' | 'minus' | null>(null)

function iconFor(c: 'plus' | 'minus') {
    // Show selected icon only while hovered or selected
    if (hover.value === c || selected.value === c) {
        return c === 'plus' ? PlusSelected : MinusSelected
    }
    return c === 'plus' ? PlusNotSelected : MinusNotSelected
}

function onSelect(choice: 'plus' | 'minus') {
    selected.value = choice
    emit('selectRole', choice)
}
</script>

<style scoped>
p {
    font-family: 'Anton', sans-serif !important;
}
</style>
<template>
    <TransitionGroup name="alert" tag="div" class="fixed bottom-4 left-4 z-50 space-y-3 w-[22rem] max-w-[92vw]">
        <div v-for="a in alerts" :key="a.id" class="rounded-lg border text-white shadow-lg p-3 flex items-start gap-3"
            :class="variantClasses[a.variant]">
            <div class="text-xl leading-none">⚑</div>
            <div class="flex-1 whitespace-pre-line">{{ a.message }}</div>
            <button class="opacity-80 hover:opacity-100" @click="remove(a.id)" aria-label="Dismiss">✕</button>
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
import { useAlerts } from '@/composables/useAlerts'

const { alerts, remove } = useAlerts()

const variantClasses: Record<'success' | 'error' | 'info' | 'warning', string> = {
    success: 'bg-green-600 border-green-700',
    error: 'bg-red-600 border-red-700',
    info: 'bg-blue-600 border-blue-700',
    warning: 'bg-amber-500 border-amber-600',
}
</script>

<style scoped>
.alert-enter-from,
.alert-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.alert-enter-active,
.alert-leave-active {
    transition: all .18s ease;
}
</style>

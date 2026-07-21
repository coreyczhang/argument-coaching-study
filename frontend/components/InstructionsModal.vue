<template>
    <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 backdrop-blur-sm bg-black/20" @click="closeModal"></div>
        
        <div class="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <button 
                @click="closeModal"
                class="absolute top-4 right-4 z-50 bg-red-500 rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                aria-label="Close instructions"
            >
                <CloseIcon class="w-6 h-6 text-white" />
            </button>
            
            <img 
                src="../assets/Instructions.jpg" 
                alt="Game Instructions" 
                class="max-w-full max-h-[90vh] object-contain"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import CloseIcon from '~/assets/icons/close.svg'

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits(['close'])

const closeModal = () => {
    emit('close')
}

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
    document.body.style.overflow = ''
})
</script>

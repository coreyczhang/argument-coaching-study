<template>
    <div id="container">
        <div id="blur" :class="{
            'fixed inset-0 flex items-center justify-center pointer-events-none backdrop-blur-sm z-10':
                isTopicRevisionOpen || topicProposal
        }" />
        <label for="topic-tile" class="relative flex z-20">
            <div id="outer-wrapper" class="absolute overflow-hidden -inset-3 ">
                <div class="outer absolute inset-0 overflow-hidden rotate-45 border-1 border-neutral-black" />
            </div>
            <div id="inner-wrapper" class="relative overflow-hidden size-[17rem] inset-0">
                <div class="inner absolute inset-0 overflow-hidden rotate-45 border-3 border-neutral-black" />
            </div>

            <div id="content" class="absolute inset-0 flex items-center justify-center">
                <h3 :style="{
                    color: '#FFF',
                    WebkitTextStrokeWidth: '1.5px',
                    WebkitTextStrokeColor: '#000'
                }" class="absolute top-2">
                    TOPIC
                </h3>

                <textarea id="topic-tile" v-if="isTopicRevisionOpen" v-model="draft" @keyup.enter="onConfirm"
                    :placeholder="topic"
                    class="bg-transparent text-gold text-[1rem] text-center focus:outline-none w-3/4 resize-none py-8 overflow-hidden" />

                <p v-if="!isTopicRevisionOpen && !topicProposal" class="text-gray-800 text-center p-2">
                    {{ topic }}
                </p>
                <p v-if="topicProposal" class="text-gold text-center p-2">
                    {{ topicProposal }}
                </p>
            </div>

            <div v-if="draft.length > 0 && isTopicRevisionOpen" id="revise-buttons">
                <button @click="onCancelEdit" id="cancel" class="absolute -bottom-2 -left-2 bg-red-500 rounded-full p-1">
                    <CloseIcon />
                </button>
                <button @click="handleTopicProposal" id="confirm"
                    class="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                    <CheckIcon />
                </button>
            </div>

            <div v-if="topicProposal" id="confirm-buttons">
                <button @click="onRejectProposal" id="cancel" class="absolute -bottom-2 -left-2 bg-red-500 rounded-full p-1">
                    <CloseIcon />
                </button>
                <button @click="handleReviseTopic" id="confirm"
                    class="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                    <CheckIcon />
                </button>
            </div>
        </label>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Tile } from '../types'
import CloseIcon from '~/assets/icons/close.svg'
import CheckIcon from '~/assets/icons/check.svg'

const props = defineProps({
    topic: {
        type: String,
        required: true
    },
    isTopicRevisionOpen: {
        type: Boolean,
        default: false
    },
    topicProposal: {
        type: String,
        default: null
    },
})

const emit = defineEmits(['close-topic-revision', 'propose-topic-revision', 'topic-revise', 'reject-topic-proposal'])

const draft = ref<string>(props.topic)
const showReviseTopic = ref<boolean>(false)

watch(draft, (newDraft) => {
    draft.value = newDraft
})
function onCancelEdit() {
    draft.value = props.topic
    emit('close-topic-revision')
}
function onConfirm() {
    if (draft.value.length > 100) {
        alert('Too long! Try to keep tile under 100 characters')
        return
    }
    emit('propose-topic-revision', draft.value)
    showReviseTopic.value = false
}

function handleTopicProposal() {
    emit('propose-topic-revision', draft.value)
}

function handleReviseTopic() {
    emit('topic-revise', { text: draft.value })
}
function onRejectProposal() {
    emit('reject-topic-proposal')
}
</script>

<style scoped>
#content p,
h6,
textarea {
    font-family: 'Coming Soon', cursive !important;
}

.outer:before {
    position: absolute;
    inset: -1px;
    /*negative value, same size as border*/
    transform: rotate(45deg);
    content: '';
    border: inherit;
    background: white
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

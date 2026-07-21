<template>
    <div id="rule-card"
        class="w-[28rem] h-[40rem] rounded-lg flex flex-col space-y-8 items-center justify-center z-100 border-3 border-white shadow-lg"
        :style="{ backgroundColor: content.color }">
        <div id="headers" class="flex flex-col space-y-2 items-center w-4/5">
            <Emoji :emoji="content.emoji" :size="72" :stroke="true"
                :stroke-width="content.emoji === 'honest-thinking' ? 2 : 4" />
            <h3 class="font-bold">{{ content.header }}</h3>
            <h3 class="text-white font-semibold text-shadow-xs">{{ content.subheader }}</h3>
            <h4 class="text-white font-semibold text-shadow-xs">Agreement</h4>
            <p class="">{{ content.agreement }}</p>
        </div>
        <div id="tiles" class="flex items-center relative">

            <div id="example-tile-1" class="relative flex mr-4">
                <div id="outer-wrapper" class="absolute overflow-hidden -inset-1 ">
                    <div class="octagon absolute inset-0 overflow-hidden rotate-45 " />
                </div>
                <div id="inner-wrapper" class="relative overflow-hidden size-44 inset-0">
                    <div class="octagon absolute inset-0 overflow-hidden rotate-45 border-1 border-gray" />
                </div>
                <div id="content" class="absolute inset-0 flex items-center justify-center text-center px-2">
                    <h3 class="absolute top-2 font-bold" :style="{
                        color: '#FFF',
                        fontSize: '1rem',
                        fontFamily: 'Anton',
                        WebkitTextStrokeWidth: '0.9px',
                        WebkitTextStrokeColor: '#000',
                    }">reason</h3>
                    <p class="text-xs">{{ content.tile1 }}</p>
                    <div id="x" class="absolute top-1/2 bottom-1/2 inset-6 pointer-events-none">
                        <div class="absolute inset-0 border-t border-red-500 rotate-45"></div>
                        <div class="absolute inset-0 border-t border-red-500 -rotate-45"></div>
                    </div>
                </div>
            </div>

            <div id="example-tile-2" class="relative flex z-10">
                <div id="outer-wrapper" class="absolute overflow-hidden -inset-1 ">
                    <div class="octagon absolute inset-0 overflow-hidden rotate-45" />
                </div>
                <div id="inner-wrapper" class="relative overflow-hidden size-44 inset-0">
                    <div class="octagon absolute inset-0 overflow-hidden rotate-45 border-1 border-gray" />
                </div>
                <div id="content" class="absolute inset-0 flex items-center justify-center text-center px-2">
                    <h3 class="absolute top-2 font-bold" :style="{
                        color: '#FFF',
                        fontSize: '1rem',
                        fontFamily: 'Anton',
                        WebkitTextStrokeWidth: '0.9px',
                        WebkitTextStrokeColor: '#000',
                    }">reason</h3>
                    <p class="text-xs">{{ content.tile2 }}</p>
                </div>
            </div>

            <div id="card"
                class="absolute -inset-y-6 left-0 right-0 mx-auto border-2 border-white rounded-xs w-16 h-24 flex items-center justify-center shadow-md"
                :style="{ backgroundColor: content.color }">
                <Emoji :emoji="content.emoji" :size="32" :stroke="true"
                    :stroke-width="content.emoji === 'honest-thinking' ? 2 : 4" />
            </div>
        </div>
        <ul v-if="type === 'mutual-respect'" id="examples" class="flex flex-col space-y-1">
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#DD2E44] bg-white rounded-full" />
                <p>'<span class="font-bold">You</span>'re only saying that because...'</p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#DD2E44] bg-white rounded-full" />
                <p>'<span class="font-bold">People</span> who believe that are...'</p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#DD2E44] bg-white rounded-full" />
                <p>'Why don't <span class="font-bold">you</span> care about...'</p>
            </li>
        </ul>

        <ul v-if="type === 'honest-thinking'" id="examples" class="flex flex-col space-y-1">
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#55ACEE] bg-white rounded-full" />
                <p>'X is important' <span class="font-bold">(for what?)</span></p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#55ACEE] bg-white rounded-full" />
                <p>'Y causes issues' <span class="font-bold">(what issues?)</span></p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#55ACEE] bg-white rounded-full" />
                <p>'There are many alternatives to Z' <span class="font-bold">(for example..?)</span></p>
            </li>
        </ul>

        <ul v-if="type === 'shared-facts'" id="examples" class="flex flex-col space-y-1">
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#9678E9] bg-white rounded-full" />
                <p>'<span class="font-bold">Everybody</span> knows...'</p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#9678E9] bg-white rounded-full" />
                <p>'The outcome is <span class="font-bold">always/never</span>...'</p>
            </li>
            <li class="flex items-center space-x-2">
                <NotAllowed class="text-[#9678E9] bg-white rounded-full" />
                <p>'<span class="font-bold">Most people</span> from Group X are...'</p>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import NotAllowed from '~/assets/icons/not-allowed.svg'

const props = defineProps({
    type: String as () => 'mutual-respect' | 'honest-thinking' | 'shared-facts',
})

const allContent = {
    'mutual-respect': {
        header: 'Mutual Respect',
        subheader: "'You' is Taboo",
        agreement: "I won't use 'you' or 'yours'. I'll critique arguments, not people.",
        tile1: "But why don't you care about nuclear waste?",
        tile2: "But nuclear waste is super toxic",
        color: '#ECA7B2',
        emoji: 'mutual-respect'
    },
    'honest-thinking': {
        header: 'Honest Thinking',
        subheader: "Let's Clarify?",
        agreement: "I'll clarify claims that are vague, oversimplified, or exaggerated.",
        tile1: "But nuclear waste isn't so bad",
        tile2: "But waste in a barrel in the desert doesn't affect anyone's health",
        color: '#ADD2EF',
        emoji: 'honest-thinking'
    },
    'shared-facts': {
        header: 'Shared Facts',
        subheader: "Fact Check?",
        agreement: "I'm willing to collaboratively track facts down, without bias for 'my side'. Wikipedia is a good start (at least it contains sources).",
        tile1: "But it's unsafe: 10% of nuclear plants leak high radiation each decade",
        tile2: "But it's unsafe: there have been 2 level-7 major nuclear accidents since 1950 (Wikipedia)",
        color: '#CFC0F1',
        emoji: 'shared-facts'
    }
}

const content = computed(() => {
    return allContent[props.type!]
})

</script>

<style scoped>
.octagon:before {
    position: absolute;
    inset: -1px; /*negative value, same size as border*/
    transform: rotate(45deg);
    content: '';
    border: inherit;
    background-color: #FFFCF5;
}
</style>
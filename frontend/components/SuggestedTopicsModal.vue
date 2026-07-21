<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-[rgba(116,116,116,0.3)] backdrop-blur-[5px]" @click="close"></div>
    
    <div class="relative bg-white rounded-[20px] shadow-xl w-[506px] h-[735px] overflow-hidden">
      <button 
        @click="close"
        class="absolute top-[3px] right-[3px] w-[33px] h-[33px] flex items-center justify-center text-[#4D4C4A] hover:opacity-70 z-10"
      >
        <svg class="w-[13.15px] h-[13.15px]" viewBox="0 0 14 14" fill="currentColor">
          <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
        </svg>
      </button>
      
      <div class="flex flex-col items-center pt-[13px] px-6 gap-[2px]">
        <h2 class="heading-suggested-topics">Suggested Topics</h2>
        <p class="subheading-instruction">
          For each topic, each player says 'yes', 'no', or 'pass'. Pick one where you disagree.
        </p>
        <div class="flex items-center gap-1">
          <span class="tip-text">the lower on the list, the better</span>
        </div>
      </div>

      <div class="relative h-[528px] mt-6 overflow-hidden">
        <div class="absolute inset-0 overflow-y-auto px-10 custom-scrollbar">
          <div class="flex flex-col gap-9">
            <div class="flex flex-col">
              <h3 class="section-heading">Practice Topics</h3>
              
              <div class="flex flex-col gap-[18px] mt-4">
                <div class="flex flex-col p-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should a hot dog be called a sandwich?')">
                  <p class="topic-text">
                    <span class="topic-number">1.</span> Should a hot dog be called a sandwich?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should astrology be taken seriously as a way to understand ourselves or others?')">
                  <p class="topic-text">
                    <span class="topic-number">2.</span> Should astrology be taken seriously as a way to understand ourselves or others?
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-col">
              <h3 class="section-heading">Topic2: Serious Stuff</h3>
              
              <div class="flex flex-col gap-[18px] mt-4">
                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should student loan debt for community college degrees be forgiven?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Fairness</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">3.</span> Should student loan debt for community college degrees be forgiven?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should people be required to have health insurance?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Fairness</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">4.</span> Should people be required to have health insurance?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should the death penalty be allowed for premeditated mass murder?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Fairness</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">5.</span> Should the death penalty be allowed for premeditated mass murder?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should the government grant special protections to union workers, like preventing workers who strike from being fired?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Rights</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">6.</span> Should the government grant special protections to union workers, like preventing workers who strike from being fired?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should people without a criminal record be allowed to own military-grade automatic weapons?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Rights</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">7.</span> Should people without a criminal record be allowed to own military-grade automatic weapons?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should sugary soda be taxed for its health effects, like cigarettes?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Rights</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">8.</span> Should sugary soda be taxed for its health effects, like cigarettes?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should AI-generated content (e.g., news, art, music) be clearly labeled to consumers?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Tech</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">9.</span> Should AI-generated content (e.g., news, art, music) be clearly labeled to consumers?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should cryptocurrency be legal?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Tech</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">10.</span> Should cryptocurrency be legal?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should self-driving cars be allowed on public streets?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">Tech</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">11.</span> Should self-driving cars be allowed on public streets?
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-col">
              <h3 class="section-heading">Topic3: Tough Topics</h3>
              
              <div class="flex flex-col gap-[18px] mt-4">
                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should the SAT be eliminated due to concerns about fairness and bias against some groups of college applicants?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">School</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">12.</span> Should the SAT be eliminated due to concerns about fairness and bias against some groups of college applicants?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should a researcher who argues that women have a genetic disadvantage in math be allowed to present their research on a college campus?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">School</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">13.</span> Should a researcher who argues that women have a genetic disadvantage in math be allowed to present their research on a college campus?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should athletes be allowed to join high school sports teams based on their gender identity instead of their sex at birth?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">School</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">14.</span> Should athletes be allowed to join high school sports teams based on their gender identity instead of their sex at birth?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should individuals facing persecution or human rights abuses in foreign countries be allowed temporary asylum in the USA?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">USA</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">15.</span> Should individuals facing persecution or human rights abuses in foreign countries be allowed temporary asylum in the USA?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should someone who entered the USA without documentation 20 years ago be deported now, even if it breaks up a family?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">USA</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">16.</span> Should someone who entered the USA without documentation 20 years ago be deported now, even if it breaks up a family?
                  </p>
                </div>

                <div class="flex flex-col p-2.5 gap-2.5 cursor-pointer hover:bg-[#fff8ef] rounded-xl transition-colors" @click="selectTopic('Should the USA abolish the Electoral College and elect a president by popular vote?')">
                  <div class="flex items-center px-2.5 py-[3.13px] gap-[4.7px] border border-[#747474] rounded-full w-fit">
                    <div class="w-[3.13px] h-[3.13px] bg-[#747474] rounded-full"></div>
                    <span class="tag-text">USA</span>
                  </div>
                  <p class="topic-text">
                    <span class="topic-number">17.</span> Should the USA abolish the Electoral College and elect a president by popular vote?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute right-[14px] top-0 bottom-0 w-[10px] bg-[#D9D9D9] rounded-[10px] pointer-events-none"></div>
      </div>

      <div class="absolute bottom-[20px] left-0 right-0 flex flex-col items-center gap-1 px-6">
        <p class="footer-heading">
          Or refine one of the claims above... or add your own!
        </p>
        <div class="flex items-center gap-1">
          <span class="tip-text">
            (Pro-tip: start with the word 'Should', as in the examples above)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  'select-topic': [topic: string]
}>()

const close = () => {
  emit('close')
}

const selectTopic = (topic: string) => {
  emit('select-topic', topic)
  close()
}

// Disable body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
@import '@/assets/suggested-topics-modal.css';
</style>


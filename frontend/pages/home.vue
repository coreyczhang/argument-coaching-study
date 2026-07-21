<template>
  <div class="min-h-screen p-8" style="background-color: var(--color-offwhite);">
    <div class="max-w-4xl mx-auto">
      <header class="mb-12 mt-8 text-center">
        <div class="mb-12">
          <h1 class="font-bold mb-4" style="color: var(--color-gold); font-size: 5rem;">Welcome!</h1>
          <div class="mx-auto" style="width: 200px; height: 3px; background-color: var(--color-gold);"></div>
        </div>
        
        <section class="mb-12">
          <h2 class="text-4xl font-bold mb-8 text-center" style="color: #4D4C4A;">How to Play</h2>
          <div class="onboarding-section">
            <div class="flex flex-row items-center justify-center mx-auto" style="gap: 60px; width: 651.11px; height: 177.04px;">
              <div class="onboarding-step">
              <TileShape :size="11" color="grey" background-color="#FFFCF5" :header="null" />
              <div class="step-content">
                <h3 class="step-number">Step 1</h3>
                <h4 class="step-title">FIND A PEER</h4>
                <p class="step-description">You need to invite one peer to start this game</p>
              </div>
            </div>
            
            <div class="onboarding-step">
              <TileShape :size="11" color="grey" background-color="#FFFCF5" :header="null" />
              <div class="step-content">
                <h3 class="step-number">Step 2</h3>
                <h4 class="step-title">RATE YOUR STANCE</h4>
                <p class="step-description">Share your positions on suggested topics</p>
              </div>
            </div>
            
              <div class="onboarding-step">
                <TileShape :size="11" color="grey" background-color="#FFFCF5" :header="null" />
                <div class="step-content">
                  <h3 class="step-number">Step 3</h3>
                  <h4 class="step-title">PICK A TOPIC</h4>
                  <p class="step-description">Compare both stances and pick a disagreement to explore</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <button @click="goToGameLobby" 
                class="form-base btn-primary"
                style="font-size: 1.5rem; padding: 1.25rem 4rem;">
          Go to Game Lobby
        </button>
      </header>

      <main>
        <section id="game-history" class="mb-20 max-w-5xl mx-auto">
          <h2 class="text-5xl font-bold mb-8 text-center" style="color: #4D4C4A;">
            Game History
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <div v-for="game in gameHistory" :key="game.code"
              class="p-6 border-2 rounded-lg transition-all hover:border-gray-400"
              style="border-color: rgba(116, 116, 116, 0.3); background-color: rgba(255, 252, 245, 0.5);">
              <p class="font-bold text-2xl mb-3" style="color: #4D4C4A;">
                Game #{{ game.code }}
              </p>
              <p class="text-base italic" style="color: var(--color-gray);">
                {{ game.topic }}
              </p>
            </div>
            <div class="p-6 border-2 rounded-lg flex items-center justify-center border-dashed"
              style="border-color: rgba(116, 116, 116, 0.2);">
              <p class="text-center italic" style="color: var(--color-gray);">
                More game history will appear here.
              </p>
            </div>
          </div>
        </section>

        <section id="topic-survey" class="max-w-3xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-5xl font-bold mb-4" style="color: #4D4C4A;">Rate your stance</h2>
            <p class="text-gray-500 italic mb-1">✦ You'll compare your stance with your peer's on the next page</p>
            <p class="text-gray-500 italic">✦ If you'd rather not discuss a topic, just leave it blank</p>
          </div>

          <form @submit.prevent="submitSurvey">
            <div v-for="(category, catIndex) in categorizedQuestions" :key="category.id || catIndex" class="mb-12">
              <h3 class="text-2xl font-bold text-center mb-8" style="color: var(--color-gray);">
                {{ category.title }}
              </h3>

              <div class="space-y-6">
                <div v-for="(question, qIndex) in category.questions" :key="question.id" class="pb-6">
                  <div v-if="question.category" class="mb-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full border"
                      style="border-color: var(--color-gray);">
                      <span class="w-1 h-1 rounded-full mr-2" style="background-color: var(--color-gray);"></span>
                      <span class="text-sm italic" style="color: var(--color-gray);">
                        {{ question.category }}
                      </span>
                    </span>
                  </div>

                  <p class="font-bold text-xl mb-4" style="color: #4D4C4A;">
                    {{ question.text }}
                  </p>

                  <div class="flex items-center justify-center gap-8">
                    <span class="text-xl font-bold" style="color: #3ABAAA;">
                      Strong YES
                    </span>

                    <div class="flex items-center gap-8">
                      <label v-for="circle in ratingScale" :key="circle.value" class="cursor-pointer">
                        <input type="radio" :name="question.id" :value="circle.value"
                          v-model="surveyAnswers[question.id]" class="sr-only">
                        <div :class="[
                          circle.size,
                          'rounded-full border-2 transition-all'
                        ]" :style="{
                          borderColor: circle.color,
                          backgroundColor:
                            surveyAnswers[question.id] === circle.value
                              ? circle.color
                              : '#FDF8F3',
                          opacity:
                            surveyAnswers[question.id] === circle.value
                              ? circle.opacity
                              : (circle.value === 0 ? 1 : 0.6)
                        }" />
                      </label>
                    </div>

                    <span class="text-xl font-bold" style="color: #F48625;">
                      Strong NO
                    </span>
                  </div>

                  <div v-if="qIndex < category.questions.length - 1" class="mt-6 border-t"
                    style="border-color: #747474; opacity: 0.6;"></div>
                </div>
              </div>
            </div>

            <button type="submit" class="mt-8 w-full form-base btn-primary text-xl">
              Submit Survey
            </button>
          </form>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true })
const { success, error, info } = useAlerts()

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Stance } from '~/types'

const router = useRouter()
const goToGameLobby = () => router.push('/')

const gameHistory = ref<Array<{ code: string; date: Date; topic: string }>>([])

const surveyAnswers = ref<Record<string, Stance>>({})

onMounted(async () => {
  const res = await fetch('http://localhost:8080/api/users/profile', {
    credentials: 'include'
  })
  const data = await res.json()
  console.log('Fetched profile:', data)

  gameHistory.value = data.gameHistory ?? data.recentGames ?? []

  if (data.stances) {
    surveyAnswers.value = data.stances
  } else if (data.userProfile?.stances) {
    surveyAnswers.value = data.userProfile.stances
  } else {
    surveyAnswers.value = {}
  }
})

const categorizedQuestions = [
  {
    id: 'practice',
    title: 'Practice Topics',
    questions: [
      {
        id: 'hotdog_sandwich',
        text: 'Should a hot dog be called a sandwich?',
        category: undefined as string | undefined
      },
      {
        id: 'astrology_serious',
        text:
          'Should astrology be taken seriously as a way to understand ourselves or others?',
        category: undefined as string | undefined
      }
    ]
  },
  {
    id: 'serious',
    title: 'Topic2: Serious Stuff',
    questions: [
      {
        id: 'loan_forgiveness',
        text: 'Should student loan debt for community college degrees be forgiven?',
        category: 'Fairness' as string | undefined
      },
      {
        id: 'health_insurance',
        text: 'Should people be required to have health insurance?',
        category: 'Fairness' as string | undefined
      },
      {
        id: 'death_penalty',
        text: 'Should the death penalty be allowed for premeditated mass murder?',
        category: 'Fairness' as string | undefined
      },
      {
        id: 'union_protections',
        text:
          'Should the government grant special protections to union workers, like preventing workers who strike from being fired?',
        category: 'Rights' as string | undefined
      },
      {
        id: 'military_weapons',
        text:
          'Should people without a criminal record be allowed to own military-grade automatic weapons?',
        category: 'Rights' as string | undefined
      },
      {
        id: 'soda_tax',
        text:
          'Should sugary soda be taxed for its health effects, like cigarettes?',
        category: 'Rights' as string | undefined
      },
      {
        id: 'ai_labeling',
        text:
          'Should AI-generated content (e.g., news, art, music) be clearly labeled to consumers?',
        category: 'Tech' as string | undefined
      },
      {
        id: 'crypto_legal',
        text: 'Should cryptocurrency be legal?',
        category: 'Tech' as string | undefined
      }
    ]
  }
]

const ratingScale = [
  { value: 2 as Stance, size: 'w-12 h-12', color: '#3ABAAA', opacity: 0.3 },
  { value: 1 as Stance, size: 'w-10 h-10', color: '#3ABAAA', opacity: 0.4 },
  { value: 0 as Stance, size: 'w-8 h-8', color: '#747474', opacity: 0.3 },
  { value: -1 as Stance, size: 'w-10 h-10', color: '#F48625', opacity: 0.4 },
  { value: -2 as Stance, size: 'w-12 h-12', color: '#F48625', opacity: 0.3 }
]

const submitSurvey = async () => {
  console.log('Survey Submitted:', surveyAnswers.value)
  try {
    const res = await fetch('http://localhost:8080/api/users/stances', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(surveyAnswers.value)
    })
    if (res.ok) {
      success('Survey submitted successfully!')
    } else {
      error('Failed to submit survey. Please try again.')
    }
  } catch (e) {
    error('Failed to submit survey. Please try again.')
  }
}
</script>

<style scoped>
.onboarding-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.onboarding-step {
  position: relative;
  width: 177px;
  height: 177px;
}

.step-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  pointer-events: none;
}

.step-number {
  font-size: 20px;
  font-weight: normal;
  color: #4D4C4A;
  margin-bottom: 6px;
  font-family: 'Anton', sans-serif;
}

.step-title {
  font-size: 12px;
  font-weight: normal;
  color: #EFAE45;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  font-family: 'Anton', sans-serif;
}

.step-description {
  font-size: 11px;
  color: #747474;
  line-height: 1.3;
  font-family: 'Inter', sans-serif;
}
</style>

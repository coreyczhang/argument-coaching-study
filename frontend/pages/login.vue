<template>
  <div id="login" class="min-h-screen flex flex-col items-center justify-center p-8"
    style="background-color: var(--color-offwhite);">
    <section id="splash" class="mb-16">
      <Logo class="h-64 w-auto" />
    </section>

    <div v-if="!showSignUpForm" id="actions" class="flex items-center space-x-6 w-full max-w-sm">
      <button @click="login" class="w-full form-base btn-primary">
        Login
      </button>

      <button @click="showSignUpForm = true" class="w-full form-base btn-primary">
        Sign Up
      </button>
    </div>

    <div v-else id="signup-form" class="flex flex-col space-y-6 w-full max-w-lg">
      <div class="flex flex-col space-y-2">
        <label for="affiliation" class="font-medium" style="color: var(--color-black);">
          What is your affiliation? <span class="text-red-500">*</span>
        </label>
        <input id="affiliation" v-model="surveyData.affiliation" type="text" class="form-base input-primary" />
      </div>

      <div class="flex flex-col space-y-2">
        <label for="role" class="font-medium" style="color: var(--color-black);">
          What is your role (e.g., student, teacher, program manager)? <span class="text-red-500">*</span>
        </label>
        <input id="role" v-model="surveyData.role" type="text" class="form-base input-primary" />
      </div>

      <div class="flex flex-col space-y-2">
        <label for="reason" class="font-medium" style="color: var(--color-black);">
          Why do you want to play this game? <span class="text-red-500">*</span>
        </label>
        <textarea id="reason" v-model="surveyData.reason" class="form-base input-primary" rows="4"></textarea>
      </div>

      <div class="flex items-start space-x-3">
        <input id="terms" v-model="agreeToTerms" type="checkbox" class="mt-1 h-5 w-5 rounded cursor-pointer" />
        <label for="terms" class="font-medium cursor-pointer" style="color: var(--color-black);">
          Do you agree to our
          <a href="https://pointtaken.social/terms-of-use" target="_blank"
            class="text-blue-600 hover:text-blue-800 underline">
            terms of use
          </a>
          and
          <a href="https://pointtaken.social/privacy-policy" target="_blank"
            class="text-blue-600 hover:text-blue-800 underline">
            privacy policy
          </a>? <span class="text-red-500">*</span>
        </label>
      </div>

      <div class="flex flex-col space-y-4">
        <button @click="submitSignUp"
          :disabled="!surveyData.affiliation || !surveyData.role || !surveyData.reason || !agreeToTerms"
          class="w-full form-base btn-primary">
          Sign Up
        </button>
        <button @click="showSignUpForm = false; agreeToTerms = false" class="w-full form-base btn-primary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signInWithRedirect, signOut } from 'aws-amplify/auth'
import Logo from '@/assets/Logo.svg?component'

const showSignUpForm = ref(false)
const agreeToTerms = ref(false)
const surveyData = ref({
  affiliation: '',
  role: '',
  reason: ''
})

const login = async () => {
  await signOut({ global: false })
  await signInWithRedirect()
}

const submitSignUp = async () => {
  console.log('Survey data being saved to localStorage:', surveyData.value)
  localStorage.setItem('pendingSurveyData', JSON.stringify(surveyData.value))
  console.log('Survey data saved to localStorage')
  
  await signOut({ global: false })
  await signInWithRedirect()
}
</script>
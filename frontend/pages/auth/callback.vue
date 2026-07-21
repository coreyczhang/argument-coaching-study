<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRuntimeConfig } from '#app'
import { fetchAuthSession } from 'aws-amplify/auth'
import 'aws-amplify/auth/enable-oauth-listener'

const router = useRouter()
const cfg = useRuntimeConfig().public

onMounted(async () => {
    try {
        // 1) Process the ?code & state from Hosted UI, populate storage
        // await confirmSignIn()

        // 2) Now tokens should be available
        const { tokens } = await fetchAuthSession()
        
        if (!tokens?.idToken) {
            throw new Error('No tokens available')
        }
        
        const isLocalhost = window.location.hostname === 'localhost'
        const backendUrl = isLocalhost ? 'http://localhost:8080' : 'http://localhost:8080'
        
        await fetch(`${backendUrl}/api/sessions`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: tokens.idToken.toString() })
        })

        window.dataLayer?.push({
            event: 'user_authenticated',
            user_id: tokens.idToken.payload.sub
        })
        
        const pendingSurveyData = localStorage.getItem('pendingSurveyData')
        
        if (pendingSurveyData) {
            try {
                const surveyData = JSON.parse(pendingSurveyData)
                
                const response = await fetch(`${backendUrl}/api/users/survey`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ surveyData: surveyData })
                })
                
                const responseData = await response.json()
                console.log('📥 Backend response:', responseData)
                
                if (response.ok) {
                    localStorage.removeItem('pendingSurveyData')
                } else {
                    console.error('Backend returned error:', responseData)
                }
            } catch (surveyError) {
                console.error('Survey submission error:', surveyError)
            }
        } else {
            console.log('No pending survey data found')
        }
        
        await router.replace('/home')
    } catch (e) {
        console.error('[callback] error', e)
        await router.replace('/login?error=oauth')
    }
})
</script>

<template>
    <div class="p-6">Completing sign-in…</div>
</template>
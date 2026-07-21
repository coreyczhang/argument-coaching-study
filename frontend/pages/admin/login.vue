<template>
    <section id="login" class="w-full h-screen flex flex-col items-center justify-center">
        <h1>Admin Login</h1>
        <form @submit.prevent="login" action="POST" class="flex flex-col">
            <label for="email">Email:</label>
            <input type="email" id="email" v-model="email" class="mb-4 p-2 border border-gray-300 rounded" />
            <label for="password">Password:</label>
            <input type="password" id="password" v-model="password" class="mb-4 p-2 border border-gray-300 rounded" />
            <button type="submit" class="bg-green text-white p-2 rounded">Login</button>
        </form>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAlerts } from '@/composables/useAlerts'
const { success, error, info } = useAlerts()

const email = ref<string>('')
const password = ref<string>('')
const loading = ref(false)

const router = useRouter()
const { setLoggedIn } = useAuth()

const login = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const res = await fetch('http://localhost:8080/api/admin/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: email.value, password: password.value })
        })

        const msg = await res.json()
        if (!res.ok) {
            error(msg.message)
            return;
        }

        success(msg.message)
        setLoggedIn(true)
        await router.push('/admin')
    } catch (e: any) {
        error(e.message)
    } finally {
        loading.value = false
    }
}

</script>
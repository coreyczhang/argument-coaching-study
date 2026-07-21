<template>
    <section id="admin" class="w-full h-screen flex flex-col items-center justify-center space-y-8">
        <h2 class="">Set new passphrase</h2>
        <form action="PATCH" @submit.prevent="setPassphrase" class="flex flex-col">
            <label for="passphrase">Passphrase:</label>
            <input type="text" id="passphrase" v-model="passphrase" class="mb-4 p-2 border border-gray-300 rounded" />
            <button type="submit" class="bg-green text-white p-2 rounded">Set passphrase</button>
        </form>
    </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin-only'] })

import { ref } from 'vue'
import { useAlerts } from '@/composables/useAlerts'
const { success, error, info } = useAlerts()

const passphrase = ref<string>('')

const setPassphrase = async () => {
    const res = await fetch('http://localhost:8080/api/admin/passphrase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passphrase: passphrase.value })
    })
    const msg = await res.json()

    if (!res.ok) {
        error(msg.message)
        return;
    }
    success(msg.message)
    passphrase.value = ''
}
</script>
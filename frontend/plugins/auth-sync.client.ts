// plugins/auth-sync.client.ts
import { defineNuxtPlugin } from "#app";
import { fetchAuthSession } from "aws-amplify/auth";

export default defineNuxtPlugin(() => {
  const sync = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) return;
      await fetch('http://localhost:8080/api/sessions', {
        method: "POST",
        credentials: "include", // so cookie is stored
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      console.debug('[auth-sync] Session cookie synced on app load');
    } catch {
      /* user not signed in; ignore */
    }
  };

  // run once on client boot (and you can also call it after login if desired)
  sync();
});

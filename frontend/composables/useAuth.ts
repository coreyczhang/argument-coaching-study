// composables/useAuth.ts
let inflight: Promise<void> | null = null;

export function useAuth() {
  const loggedIn = useState<boolean>("auth:loggedIn", () => false);
  const checked = useState<boolean>("auth:checked", () => false);

  const ensureSession = async () => {
    if (checked.value) return;
    if (!inflight) {
      inflight = (async () => {
        try {
          const res = await fetch("http://localhost:8080/api/session", {
            method: "GET",
            credentials: "include",
          });
          loggedIn.value = res.status === 204;
        } catch {
          loggedIn.value = false;
        } finally {
          checked.value = true;
          inflight = null;
        }
      })();
    }
    await inflight;
  };

  const setLoggedIn = (v: boolean) => {
    loggedIn.value = v;
    checked.value = true;
  };

  const clear = () => setLoggedIn(false);

  return { loggedIn, checked, ensureSession, setLoggedIn, clear };
}

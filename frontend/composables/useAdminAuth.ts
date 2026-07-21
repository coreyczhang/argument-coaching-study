let inflight: Promise<void> | null = null;

export function useAdminAuth() {
  const adminLoggedIn = useState<boolean>("admin:loggedIn", () => false);
  const adminChecked = useState<boolean>("admin:checked", () => false);

  const ensureAdminSession = async () => {
    if (adminChecked.value) return;
    if (!inflight) {
      inflight = (async () => {
        try {
          const res = await fetch("http://localhost:8080/api/admin/session", {
            method: "GET",
            credentials: "include",
          });
          adminLoggedIn.value = res.status === 204;
        } catch {
          adminLoggedIn.value = false;
        } finally {
          adminChecked.value = true;
          inflight = null;
        }
      })();
    }
    await inflight;
  };

  const setAdmin = (v: boolean) => {
    adminLoggedIn.value = v;
    adminChecked.value = true;
  };
  const clear = () => setAdmin(false);

  return { adminLoggedIn, adminChecked, ensureAdminSession, setAdmin, clear };
}

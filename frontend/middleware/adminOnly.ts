export default defineNuxtRouteMiddleware(async () => {
  const { adminLoggedIn, adminChecked, ensureAdminSession } = useAdminAuth();
  if (!adminChecked.value) await ensureAdminSession();
  if (!adminLoggedIn.value) return navigateTo("/admin/login");
});

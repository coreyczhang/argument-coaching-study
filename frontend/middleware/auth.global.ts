// middleware/auth.global.ts
import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { fetchAuthSession } from "aws-amplify/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ["/login", "/auth/callback"];
  if (publicRoutes.includes(to.path)) return;

  const requiresAuth = to.meta.requiresAuth === true;
  const protectedPaths = ["/", "/app", "/game", "/lobby"];
  const isProtectedPath = protectedPaths.some((p) => to.path === p || to.path.startsWith(p + "/"));

  if (!requiresAuth && !isProtectedPath) return;

  try {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) throw new Error("no session");
  } catch {
    return navigateTo("/login");
  }
});

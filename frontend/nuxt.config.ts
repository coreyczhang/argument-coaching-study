// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from "vite-svg-loader";
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  ssr: false,
  app: {
    baseURL: "/",
  },
  devtools: { enabled: true },
  css: ["~/assets/main.css"],
  modules: ["@nuxt/eslint", "@nuxtjs/tailwindcss"],
  vite: {
    plugins: [
      svgLoader({
        svgo: true,
        svgoConfig: {
          plugins: [
            { name: "prefixIds" },
            { name: "removeViewBox" },
          ],
        },
      }),
    ],
  },
  build: { transpile: ["aws-amplify"] },
  runtimeConfig: {
    // private (server-only) values go here if you have any
    public: {
      NUXT_PUBLIC_COGNITO_REGION: process.env.NUXT_PUBLIC_COGNITO_REGION,
      NUXT_PUBLIC_COGNITO_USER_POOL_ID:
        process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID,
      NUXT_PUBLIC_COGNITO_APP_CLIENT_ID:
        process.env.NUXT_PUBLIC_COGNITO_APP_CLIENT_ID,
      NUXT_PUBLIC_COGNITO_DOMAIN: process.env.NUXT_PUBLIC_COGNITO_DOMAIN,
      NUXT_PUBLIC_REDIRECT_SIGNIN: process.env.NUXT_PUBLIC_REDIRECT_SIGNIN,
      NUXT_PUBLIC_REDIRECT_SIGNOUT: process.env.NUXT_PUBLIC_REDIRECT_SIGNOUT,
      NUXT_PUBLIC_AI_EVAL_URL:
        process.env.NUXT_PUBLIC_AI_EVAL_URL || "http://127.0.0.1:8000/evaluate",
      NUXT_PUBLIC_BACKEND_URL:
        process.env.NUXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    },
  },
});

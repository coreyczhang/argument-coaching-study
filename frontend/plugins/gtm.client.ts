import { createGtm } from "@gtm-support/vue-gtm";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createGtm({
      id: "GTM-W9MG7JSF",
      defer: false,
      compatibility: false,
      enabled: true,
      loadScript: true,
      vueRouter: useRouter(),
    })
  );
});

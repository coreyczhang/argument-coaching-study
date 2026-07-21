
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    overrides: [
      {
        files: ["layouts/*.vue", "pages/**/*.vue"],
        rules: {
          // disable the “multi-word component name” rule for your pages/layouts
          "vue/multi-word-component-names": "off",
        },
      },
    ]
  }
);

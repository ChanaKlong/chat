// https://nuxt.com/docs/api/configuration/nuxt-config
import process from "node:process";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["nuxt-file-storage"],
  fileStorage: {
    mount: process.cwd(),
  },
  css: [
    "@/assets/css/tailwind.css",
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  runtimeConfig: {
    TT_SSID: process.env.TT_SSID,
    C_PATH: process.cwd(),
  },
});

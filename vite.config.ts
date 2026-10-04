import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => ({
  build: { outDir: mode === "android" ? "dist-android" : "dist" },
  plugins: [
    react(),
    mode !== "android" &&
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["art/*.png"],
        manifest: {
          name: "Ashen Vow: The Hollow Below",
          short_name: "Ashen Vow",
          description:
            "An original dark fantasy dungeon crawler. Every vow has a price.",
          theme_color: "#121113",
          background_color: "#121113",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/art/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/art/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15000000,
          globPatterns: ["**/*.{js,css,html,png,woff2,mp3}"],
          navigateFallback: "index.html",
        },
      }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4175, strictPort: true },
}));

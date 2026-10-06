import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ashenvow.rpg",
  appName: "Ashen Vow RPG",
  webDir: "dist-android",
  backgroundColor: "#121113",
  android: {
    backgroundColor: "#121113",
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      style: "DARK",
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;

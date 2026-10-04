import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { SAVE_KEY, parseSave } from "./engine";

export const isNativeApp = Capacitor.isNativePlatform();
if (isNativeApp) document.documentElement.classList.add("native-app");
let pendingWrites: Promise<void> = Promise.resolve();

export async function restoreNativeStorage() {
  if (!isNativeApp) return;
  for (const key of [SAVE_KEY, "ashen-vow-settings"]) {
    const { value } = await Preferences.get({ key });
    if (!value) continue;
    if (key === SAVE_KEY && !parseSave(value)) continue;
    if (key !== SAVE_KEY) {
      try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          continue;
      } catch {
        continue;
      }
    }
    localStorage.setItem(key, value);
  }
}

export async function saveLocalValue(key: string, value: string) {
  localStorage.setItem(key, value);
  if (!isNativeApp) return;
  pendingWrites = pendingWrites
    .catch(() => {})
    .then(() => Preferences.set({ key, value }));
  await pendingWrites;
}

export async function shareNativeSave(fileName: string, data: string) {
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: "Ashen Vow journey backup",
    files: [uri],
    dialogTitle: "Save or share your journey backup",
  });
}

export async function shareNativeGame(text: string) {
  await Share.share({
    title: "Ashen Vow",
    text,
    dialogTitle: "Share Ashen Vow",
  });
}

// JS surface for the BackupExclusion native module.
//
// On iOS this calls NSURL.setResourceValue(true, forKey: .isExcludedFromBackupKey)
// which is the only documented way to keep a file out of iCloud Backup AND
// device-to-device transfer (iTunes / Finder backup). It must be called
// per-file (directories don't propagate the flag to children) and AFTER the
// file exists.
//
// On every other platform this returns false with a "platform unsupported"
// reason — Android backup hygiene is handled wholesale via the manifest's
// `android:allowBackup="false"` (set in app.json), so per-file exclusion is
// unnecessary there.

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type NativeModule = {
  setExcludedFromBackup: (absolutePath: string, excluded: boolean) => Promise<boolean>;
  isExcludedFromBackup: (absolutePath: string) => Promise<boolean>;
};

let _module: NativeModule | null = null;
let _checked = false;

function load(): NativeModule | null {
  if (_checked) return _module;
  _checked = true;
  if (Platform.OS !== 'ios') return null;
  _module = requireOptionalNativeModule<NativeModule>('BackupExclusionModule');
  return _module;
}

export type ExcludeResult = { ok: true } | { ok: false; reason: string };

export async function setExcludedFromBackup(
  absolutePath: string,
  excluded = true,
): Promise<ExcludeResult> {
  if (Platform.OS !== 'ios') {
    // Android is covered by the manifest's allowBackup=false. Anything else
    // (web, etc.) doesn't have a backup story we care about.
    return { ok: true };
  }
  const mod = load();
  if (!mod) {
    return {
      ok: false,
      reason:
        "Native module 'BackupExclusionModule' is not installed in this build. " +
        'Run `npx expo prebuild` and rebuild the native app.',
    };
  }
  try {
    const ok = await mod.setExcludedFromBackup(absolutePath, excluded);
    if (!ok) {
      return { ok: false, reason: 'iOS rejected the resource-value write (file may not exist).' };
    }
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, reason: String(err?.message ?? e) };
  }
}

export async function isExcludedFromBackup(absolutePath: string): Promise<boolean | null> {
  if (Platform.OS !== 'ios') return null;
  const mod = load();
  if (!mod) return null;
  try {
    return await mod.isExcludedFromBackup(absolutePath);
  } catch {
    return null;
  }
}

export function backupExclusionAvailable(): boolean {
  return load() !== null;
}

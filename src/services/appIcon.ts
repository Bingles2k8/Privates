// Crash-proof wrapper around expo-dynamic-app-icon.
//
// Why not just `import { getAppIcon, setAppIcon } from 'expo-dynamic-app-icon'`?
// That package's top level calls `requireNativeModule('ExpoDynamicAppIcon')`,
// which throws synchronously when the native binary wasn't built with the
// plugin (Expo Go, out-of-date dev client, etc.). Wrapping the JS `require()`
// in try/catch is unreliable in Metro — any import chain that pulls the
// package in at evaluation time will crash the whole JS bundle.
//
// Instead we bypass the package's JS entrypoint entirely and call
// `requireOptionalNativeModule` against the bare native module name. That
// function returns `null` when the module is missing, with no throw — so we
// get a safe "feature unavailable" state that the UI can handle gracefully.

import { requireOptionalNativeModule } from 'expo-modules-core';

type DynamicIconNativeModule = {
  getAppIcon: () => string;
  setAppIcon: (name: string) => string | false;
};

let _module: DynamicIconNativeModule | null = null;
let _checked = false;
let _loadError: string | null = null;

function tryLoad(): DynamicIconNativeModule | null {
  if (_checked) return _module;
  _checked = true;
  try {
    const mod = requireOptionalNativeModule<DynamicIconNativeModule>('ExpoDynamicAppIcon');
    if (!mod) {
      _loadError =
        "Native module 'ExpoDynamicAppIcon' is not installed in this build. Rebuild the app with `npx expo prebuild` + a fresh dev client / store build.";
      return null;
    }
    // Touch getAppIcon so a runtime-level failure (e.g. method missing) also
    // shows up here rather than later from the UI.
    if (typeof mod.getAppIcon !== 'function' || typeof mod.setAppIcon !== 'function') {
      _loadError = "Native module 'ExpoDynamicAppIcon' is installed but missing expected methods.";
      return null;
    }
    _module = mod;
    return mod;
  } catch (e: unknown) {
    const err = e as { message?: string };
    _loadError = String(err?.message ?? e);
    return null;
  }
}

export function appIconModuleAvailable(): boolean {
  return tryLoad() !== null;
}

export function appIconLoadError(): string | null {
  tryLoad();
  return _loadError;
}

export function getAppIconSafe(): string {
  const mod = tryLoad();
  if (!mod) return 'DEFAULT';
  try {
    return mod.getAppIcon();
  } catch {
    return 'DEFAULT';
  }
}

export function setAppIconSafe(name: string): { ok: boolean; reason?: string } {
  const mod = tryLoad();
  if (!mod) {
    return {
      ok: false,
      reason:
        'The app icon switcher needs a native rebuild to work. Re-run `npx expo prebuild` and rebuild the dev client or ship build.',
    };
  }
  try {
    const result = mod.setAppIcon(name);
    if (result === false) {
      return { ok: false, reason: 'The system refused the switch. Try again in a moment.' };
    }
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, reason: String(err?.message ?? e) };
  }
}

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
//
// Two extra footguns we work around:
//
// 1. The native `setAppIcon` always returns the input string, even when iOS
//    silently rejects the switch (the Swift completion handler is `{ _ in }`
//    so any NSError is dropped). So we can't trust the return value — we
//    re-read `getAppIcon()` after the call and compare.
//
// 2. To restore the primary icon, iOS requires `setAlternateIconName(nil)`.
//    The package's Swift signature is `String` (non-optional), so passing `''`
//    becomes a non-nil empty NSString, which iOS rejects. We try `null` first
//    (which the Expo Modules JSI bridge may or may not pass through as nil),
//    then `undefined`, then give up and report a useful error.

import { requireOptionalNativeModule } from 'expo-modules-core';

type DynamicIconNativeModule = {
  getAppIcon: () => string;
  setAppIcon: (name: string | null | undefined) => string | false;
};

const DEFAULT_NAME = 'DEFAULT';

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
  if (!mod) return DEFAULT_NAME;
  try {
    return mod.getAppIcon();
  } catch {
    return DEFAULT_NAME;
  }
}

// Try a single setAppIcon call and swallow any thrown bridge error. Returns
// `true` if the call did not throw (which is NOT a guarantee iOS accepted it).
function attemptSet(mod: DynamicIconNativeModule, arg: string | null | undefined): boolean {
  try {
    mod.setAppIcon(arg);
    return true;
  } catch {
    return false;
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

  const wantsDefault = name === DEFAULT_NAME || name === '';

  // Skip a no-op write — iOS sometimes returns an error when you "set" the
  // icon you're already on, and that would falsely look like a failure.
  let currentBefore = DEFAULT_NAME;
  try {
    currentBefore = mod.getAppIcon();
  } catch {
    /* ignore — we'll just attempt the set */
  }
  if (wantsDefault && currentBefore === DEFAULT_NAME) return { ok: true };
  if (!wantsDefault && currentBefore === name) return { ok: true };

  if (wantsDefault) {
    // Walk through arg shapes that might reach Swift as `nil`. The package's
    // Function signature is `(name:String) -> String`, so the JSI bridge may
    // reject null/undefined — that's fine, we catch and try the next.
    for (const candidate of [null, undefined, '']) {
      if (attemptSet(mod, candidate)) {
        const after = safeGet(mod);
        if (after === DEFAULT_NAME) return { ok: true };
      }
    }
    return {
      ok: false,
      reason:
        "Couldn't restore the default icon. This is a known limitation of expo-dynamic-app-icon 1.2.0 — its native bridge can't pass `nil` to iOS, which is what's needed to reset. Switching to a different alternate works fine; only the trip back to default is broken. Tracking it separately.",
    };
  }

  if (!attemptSet(mod, name)) {
    return { ok: false, reason: `The native bridge rejected the icon name "${name}".` };
  }

  const after = safeGet(mod);
  if (after === name) return { ok: true };

  // iOS silently refused the switch. Most common cause: the app was upgraded
  // in place and iOS cached the old Info.plist that didn't list this icon,
  // or the icon PNG isn't actually in the bundle. Tell the user something
  // actionable.
  return {
    ok: false,
    reason:
      `iOS silently refused the switch to "${name}" — the picker thinks it succeeded but the system didn't change the icon. ` +
      `This usually means iOS is using a cached app bundle that pre-dates this icon being added. ` +
      `Fix: fully delete the app from the device (long-press → Remove App → Delete App), then reinstall via \`npx expo run:ios --device\`.`,
  };
}

function safeGet(mod: DynamicIconNativeModule): string {
  try {
    return mod.getAppIcon();
  } catch {
    return DEFAULT_NAME;
  }
}

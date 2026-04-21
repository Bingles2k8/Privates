# Stealth app icons

These PNGs are swapped in at runtime by `expo-dynamic-app-icon` (configured in
`app.json`). The Appearance screen in Settings lets the user pick one.

**Current state: all four files are placeholders — they are copies of the
default `assets/images/icon.png`.** Replace them with icons that actually look
like the thing they're pretending to be, before shipping:

| File | Should look like |
| --- | --- |
| `calculator.png` | iOS/Android default calculator app |
| `weather.png` | A generic weather app (sun/cloud) |
| `notes.png` | A plain lined-notepad or note-taking app |
| `paper.png` | A blank sheet of paper / abstract document icon |

### Requirements

- Square PNG, at least 1024×1024 (expo-dynamic-app-icon resizes per-platform).
- Opaque background on iOS (no transparency in the icon).
- No text overlays on iOS (Apple rejects icons that look too much like a
  screenshot of another app — but generic category icons are fine).

### Why stealth icons at all

Users in hostile environments (abusive partner, post-Roe jurisdictions) may
want the app to look like something innocuous on their homescreen. The icon
swap is instant and doesn't require a reinstall.

Note: iOS does **not** let an app change its own **display name** — the label
under the icon still says "Privates". The Appearance screen explains this to
the user. The workaround is to put the app in a folder, on a secondary
homescreen page, or (Android only) rename via launcher long-press.

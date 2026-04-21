# Stealth app icons

These PNGs are swapped in at runtime by `expo-dynamic-app-icon` (configured in
`app.json`). The Appearance screen in Settings lets the user pick one.

| File | Looks like |
| --- | --- |
| `mascot-bright.png` | Mascot face, wide smile + sparkles |
| `mascot-wink.png` | Mascot face winking, cheeky smile |
| `mascot-sleepy.png` | Mascot face with closed eyes, soft smile |
| `calculator.png` | iOS-style calculator (orange operator column) |
| `weather.png` | Sun partially behind a puffy cloud on blue sky |
| `notes.png` | Yellow legal pad with ruled lines and binding rings |
| `paper.png` | Blank off-white sheet with a folded top-right corner |

The mascot variants are the same character as the default app icon — they
aren't disguises, just different moods for users who want to personalize
without hiding the app. The calculator/weather/notes/paper icons are the
actual stealth options.

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

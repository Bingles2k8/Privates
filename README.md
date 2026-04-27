# Privates

A privacy-first period and reproductive-health tracker. Local-first, encrypted at rest, with zero outbound network calls. Built so that even the developers of the app cannot read your data.

## Why this exists

Mainstream period-tracker apps have a well-documented privacy problem. After *Dobbs v. Jackson*, [FTC-supported research](https://www.ftc.gov/system/files/ftc_gov/pdf/10-Laabadli-Understanding-Womens-Privacy-Concerns-Toward-Period-Tracking-Apps-in-the-Post-Roe-v-Wade-Era.pdf) found large numbers of users actively deleting these apps over fears of data exposure. Even apps that *advertise* end-to-end encryption have been caught leaking user data to third-party analytics: Stardust, for example, was [sending phone numbers to Mixpanel](https://techcrunch.com/2022/06/27/stardust-period-tracker-phone-number/) while marketing itself as privacy-safe.

Privates is designed so that the privacy claims are structurally true, not marketing. The app has no backend to subpoena, no analytics SDK to leak to, no cloud account to seize. Your data sits in an encrypted SQLite database on your device and goes nowhere else.

## What it does

**Core tracking**
- Period start/end, flow intensity, cycle-length history
- Symptom log (30+ built-in tags, plus custom tags)
- Mood log
- Sexual activity, protection, drive
- Cervical mucus / discharge type
- Free-text notes per day

**Fertility**
- Cycle-adaptive fertile-window and ovulation prediction (rule-based, not ML)
- BBT (basal body temperature) logging with chart + cover line
- LH test result logging

**Birth control**
- Method tracker (pill, IUD, implant, condom, etc.)
- Daily pill reminders via local-only notifications
- Missed-pill tracking

**Pregnancy mode**
- Due-date calculator, weekly milestones
- Kick counter, contraction timer
- Pre/post-pregnancy data preserved, not deleted

**Insights**
- Personal averages only — no comparison to "other users" because there aren't any from our perspective
- Year heatmap, cycle-length trend, prediction accuracy
- Symptom heatmap, mood timeline

**Privacy controls**
- Biometric / passphrase / biometric+passphrase unlock
- **Three-slot passphrase system**: one real passphrase, one optional decoy that opens an empty fake database, one optional wipe passphrase that silently panic-wipes on entry
- Stealth app icon (Calculator / Weather / Notes / blank Paper)
- One-tap panic wipe of the DB and the encryption key
- Per-category retention sweeps — e.g. auto-delete notes older than 30 days, keep BBT for 2 years, never purge cycle dates
- Encrypted `.ptbk` backup/restore to a user-chosen file location

## Security architecture

### Threat model

**In scope**
- Device theft (locked or unlocked)
- Forensic extraction from unencrypted backups (iCloud / Google)
- Hostile network observer
- Future cloud-server compromise (once v2 sync ships)
- The developers of this app being compelled to hand over user data

**Out of scope (v1)**
- Rooted / jailbroken devices with active malware
- OS-level zero-days
- Coercion of the user themselves (though the decoy / wipe passphrase slots are designed specifically to soften this)

### Key hierarchy

```
              ┌──────────────────────────────┐
              │ User passphrase              │
              └──────────────┬───────────────┘
                             │ Argon2id (ops=3, mem=64 MiB)
                             ▼
                ┌─────────────────────────┐
                │ Passphrase-derived KEK  │
                └──────────┬──────────────┘
                           │ wraps (XChaCha20-Poly1305)
                           ▼
      ┌────────────────────────────────────────┐
      │ DB master key (256-bit, random)        │
      │  - generated at first launch           │
      │  - optionally cached in Keychain/      │
      │    Keystore behind biometric           │
      │  - used as SQLCipher PRAGMA key        │
      └──────────────────┬─────────────────────┘
                         │
                         ▼
            SQLCipher-encrypted SQLite file
```

- **Passphrase mode**: the only thing stored is the passphrase-wrapped master key and its KDF salt. Nothing in SecureStore can decrypt the database without the user typing the passphrase.
- **Biometric mode**: the master key is additionally cached in Keychain / Keystore under a `requireAuthentication: true` flag, so Face ID / Touch ID can decrypt the DB without re-typing. The wrapped copy still exists so the user can always fall back to passphrase entry.
- **No recovery**: there is no "forgot passphrase" flow. Lose the passphrase (and biometric access) = data is gone. This is the deliberate price of zero-knowledge — we cannot help, by design.

### The three-slot passphrase system

The decoy and wipe slots are separate Argon2id-salted wrapped copies of *different* master keys. You can't tell from the encrypted SecureStore blobs which slot a given passphrase unlocks until you try it:

- **Real passphrase** → unwraps the real master key → real database
- **Decoy passphrase** *(optional)* → unwraps a second key → a pre-seeded fake database with plausible-looking data. If someone compels you to unlock the app, you can show them the decoy.
- **Wipe passphrase** *(optional)* → silently triggers panic wipe and shows the onboarding screen, as though the app were freshly installed.

All three live in the same SecureStore namespace. The app tries each in order on unlock.

### Network policy

v1 ships with **zero outbound network calls by default**, and exactly one explicit, user-triggered exception.

- No analytics SDK. No Sentry. No remote config. No font CDN (fonts are bundled).
- iOS: `NSAppTransportSecurity` with no exception domains.
- Android: `android:usesCleartextTraffic="false"`, no network-security-config allowances.
- An ESLint rule bans `fetch`, `axios`, `XMLHttpRequest`, and `WebSocket` outside an allowlisted `src/net/` directory (which is empty in v1).

You can verify this yourself — see [Verifying the privacy claims](#verifying-the-privacy-claims) below.

**The one exception: the tip jar.** The Settings → Support development screen contains an optional in-app tip jar. When (and only when) the user opens that screen, the app initializes a StoreKit connection to load tip prices and process payments. Specifics:

- The connection is to **Apple only**. There is no third-party payment processor, no analytics on the purchase, no data sent to any developer-controlled server.
- StoreKit talks to Apple over Apple's own infrastructure — the same channel App Store Connect already uses. We do not see card details, billing addresses, or anything beyond the transaction ID and the receipt itself.
- Receipt validation is performed **on-device** via StoreKit 2's signed JWS — no round-trip to Apple's `verifyReceipt` endpoint from this app.
- The connection is opened on screen mount and closed on screen unmount. Idle launches, the rest of the app, and even the rest of Settings stay completely offline.
- Tipping is purely cosmetic — it does not unlock features, gate functionality, or change behavior. The full app is and will remain free.

### Backup hygiene

- **iOS**: the SQLCipher DB file is marked `NSURLIsExcludedFromBackupKey = true`, so it never ends up in iCloud or iTunes backups. Cloud backup must be a deliberate user action (encrypted `.ptbk` export), not an iCloud accident.
- **Android**: `android:allowBackup="false"` in the manifest excludes the DB from auto-backup.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 54 + React Native 0.81 + TypeScript |
| Navigation | Expo Router 6 (file-based) |
| Local DB | [op-sqlite](https://github.com/OP-Engineering/op-sqlite) with SQLCipher (AES-256 page-level encryption) |
| ORM | Drizzle |
| Secure key storage | `expo-secure-store` (iOS Keychain / Android Keystore, hardware-backed where available) |
| Crypto primitives | [react-native-libsodium](https://github.com/serenity-kit/react-native-libsodium) — Argon2id for KDF, XChaCha20-Poly1305 for key wrap |
| State | Zustand + TanStack Query |
| Dates | date-fns |
| Styling | NativeWind 4 (Tailwind) |
| Charts | React Native Skia |
| Notifications | `expo-notifications` (local only, no push server) |
| Biometric | `expo-local-authentication` |

## Repository layout

```
app/                          Expo Router screens
  (tabs)/                     Today, Calendar, Insights, Settings
  settings/                   Sub-screens (Session, Reminders, Retention, Theme, etc.)
  onboarding/                 First-launch + privacy setup
  lock.tsx                    Biometric/passphrase gate
  log/[date].tsx              Per-day detail editor
src/
  crypto/                     KDF (Argon2id), AEAD (XChaCha20-Poly1305), key lifecycle
  db/                         SQLCipher client, Drizzle schema, migrations
  data/                       Typed data layer (cycles, day logs, pregnancy, settings)
  predictions/                Cycle, fertility, pregnancy math (unit-testable pure functions)
  services/                   Backup, reminders, retention sweep, panic wipe, decoy seeding
  state/                      Zustand stores (session, reminders, retention, customize)
  hooks/                      Data hooks (useDayLog, usePrediction, etc.)
  theme/                      Light/dark + accent palette
  ui/                         Shared components
```

### Critical files for audit

- `src/crypto/kdf.ts` — Argon2id parameters (`ops=3`, `mem=64 MiB`)
- `src/crypto/aead.ts` — XChaCha20-Poly1305 seal/open
- `src/crypto/keys.ts` — Master-key lifecycle, three-slot unlock, lock modes
- `src/db/client.ts` — DB open with SQLCipher PRAGMA key
- `src/services/panicWipe.ts` — Destructive reset
- `src/services/unlock.ts` — Auto-unlock, biometric gate, startup status
- `app/onboarding/privacy.tsx` — Explains the no-recovery tradeoff

## Running locally

Requires Node 20+, Xcode 16+ (for iOS), or Android Studio with a recent SDK.

```bash
git clone https://github.com/Bingles2k8/Privates.git
cd Privates
npm install

# Generate native iOS/Android projects. Required — this is not an Expo Go app;
# SQLCipher and libsodium both need native modules.
npx expo prebuild

# Run on iOS simulator
npx expo run:ios

# Or on Android
npx expo run:android
```

The `/ios` and `/android` folders are gitignored — they're regenerated deterministically from `app.json` plugin config on every prebuild.

## Verifying the privacy claims

If you don't want to trust this README, don't. Verify instead:

**Network egress test**
```bash
# Launch the app in the iOS simulator, then attach Charles or mitmproxy to
# the simulator's traffic. Exercise every feature. You should see zero
# outbound connections.
```

**Encrypted-at-rest test**
```bash
# With the app on a physical iOS device, Xcode → Window → Devices and
# Simulators → select the app → Download Container. Inside the downloaded
# xcappdata bundle, find the SQLite file and try:
sqlite3 <path-to-db>
# SQLite will refuse to open it ("file is not a database") because the file
# is SQLCipher-encrypted. Without the master key from the Keychain, the
# database is unreadable.
```

**No-network lint check**
```bash
npm run lint
# The custom rule in eslint.config.js will flag any fetch / axios / XHR /
# WebSocket import that isn't inside src/net/ (which is empty in v1).
```

**Panic wipe test**
Settings → Danger zone → Panic wipe → confirm twice. Re-open the app; you should see onboarding as though freshly installed.

## Status and roadmap

**v1 (this release)** — offline-only. Every feature above works without network access.

**v2 (planned, not started)**
- Encrypted cloud sync using Supabase as an opaque blob store. Client-side XChaCha20-Poly1305 envelope per record; server sees only ciphertext and an opaque row ID.
- Multi-device pairing via shared key transfer (QR code).
- Partner sharing (invite-only, per-share key).
- Apple Health / Health Connect bidirectional sync (opt-in, off by default).

The architecture is designed so v2 adds a sync layer on top of the existing encrypted-at-rest layer without weakening it — the cloud never sees plaintext and never holds anything that could decrypt it.

## Contributing

Bug reports, audit findings, and security-model critiques are welcome via GitHub issues. If you find something that contradicts a privacy claim in this README, please open an issue — I'd rather know.

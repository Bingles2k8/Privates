// Strips the iOS Push Notifications entitlement (`aps-environment`) from the
// generated entitlements file.
//
// Why: this app uses `expo-notifications` for *local* notifications only
// (medication reminders scheduled on-device). The package adds the push
// entitlement defensively, but enabling it requires a paid Apple Developer
// Program membership — it breaks signing on free Personal Teams, and our
// privacy-first design forbids remote push anyway (no servers, no exfiltration
// vector). So we strip it.
//
// This runs as part of `npx expo prebuild`, after expo-notifications has had
// its turn at the entitlements file.

const { withEntitlementsPlist } = require('@expo/config-plugins');

const withoutPushEntitlement = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults && 'aps-environment' in cfg.modResults) {
      delete cfg.modResults['aps-environment'];
    }
    return cfg;
  });
};

module.exports = withoutPushEntitlement;

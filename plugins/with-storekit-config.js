// Wires the canonical StoreKit Configuration file at `storekit/Privates.storekit`
// into the iOS scheme on every `expo prebuild`. Without this plugin the scheme
// wire-up done in Xcode is lost whenever native folders are regenerated.
//
// The scheme references the file via a relative path (`../../storekit/Privates.storekit`,
// resolved from inside `ios/Privates.xcodeproj/`), so we don't need to copy or
// register the file in the Xcode project — only the scheme XML needs to point
// at it. Idempotent: rewrites an existing reference or inserts one if absent.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STOREKIT_REFERENCE_PATH = '../../storekit/Privates.storekit';

function buildReference() {
  return [
    '      <StoreKitConfigurationFileReference',
    `         identifier = "${STOREKIT_REFERENCE_PATH}">`,
    '      </StoreKitConfigurationFileReference>',
  ].join('\n');
}

function withStoreKitConfig(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectName = cfg.modRequest.projectName;
      if (!projectName) return cfg;

      const schemePath = path.join(
        cfg.modRequest.platformProjectRoot,
        `${projectName}.xcodeproj`,
        'xcshareddata',
        'xcschemes',
        `${projectName}.xcscheme`,
      );

      if (!fs.existsSync(schemePath)) {
        console.warn(
          `[with-storekit-config] scheme not found at ${schemePath}; skipping`,
        );
        return cfg;
      }

      let xml = fs.readFileSync(schemePath, 'utf8');
      const reference = buildReference();

      if (/<StoreKitConfigurationFileReference[\s\S]*?<\/StoreKitConfigurationFileReference>/.test(xml)) {
        xml = xml.replace(
          /<StoreKitConfigurationFileReference[\s\S]*?<\/StoreKitConfigurationFileReference>/,
          reference.trimStart(),
        );
      } else {
        xml = xml.replace(
          /(\s*)<\/LaunchAction>/,
          `\n${reference}$1</LaunchAction>`,
        );
      }

      fs.writeFileSync(schemePath, xml);
      console.log(
        `[with-storekit-config] wired ${STOREKIT_REFERENCE_PATH} into ${projectName}.xcscheme`,
      );

      return cfg;
    },
  ]);
}

module.exports = withStoreKitConfig;

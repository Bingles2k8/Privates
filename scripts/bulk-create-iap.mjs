#!/usr/bin/env node
// Bulk-creates the Privates in-app products in Google Play Console via the
// Play Developer API. Idempotent — products that already exist are skipped.
//
// Usage:
//   node scripts/bulk-create-iap.mjs <path-to-service-account.json>
//
// Service account must have "Manage orders and subscriptions" + "View app
// information" permissions on the Privates app in Play Console.

import { google } from 'googleapis';
import { readFileSync } from 'node:fs';

const PACKAGE_NAME = 'com.bingles.privates';
const PURCHASE_OPTION_ID = 'buy';
const DEFAULT_REGION = 'US';
const DEFAULT_CURRENCY = 'USD';

// Mirror of the app's product catalog. Keep in sync with
// src/services/iap.ts and src/cosmetics/catalog.ts.
const PRODUCTS = [
  // Tips (consumable in app code; Play treats as Buy)
  {
    productId: 'com.bingles.privates.tip.small',
    title: 'Small tip',
    description: 'A small thank-you — covers a coffee. Helps offset the developer-account fees.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.tip.medium',
    title: 'Medium tip',
    description: 'A medium thank-you — like buying a sandwich. Keeps the project sustainable.',
    priceUsd: 2.99,
  },
  {
    productId: 'com.bingles.privates.tip.large',
    title: 'Large tip',
    description: 'A generous thank-you — lunch on you. Genuinely appreciated.',
    priceUsd: 4.99,
  },
  // Everything pack
  {
    productId: 'com.bingles.privates.unlock.everything',
    title: 'Everything pack',
    description: 'Unlocks every current cosmetic pack — characters, hats, glasses, the lot — plus any future permanent additions. Themed or seasonal drops are sold separately.',
    priceUsd: 9.99,
  },
  // Cosmetic packs
  {
    productId: 'com.bingles.privates.unlock.pack.characters',
    title: 'Characters pack',
    description: 'Five extra character faces for your mascot.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.hats',
    title: 'Hats pack',
    description: 'Ten lids for the mascot to wear.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.eyewear',
    title: 'Eyewear pack',
    description: 'Five pairs of glasses and other accessories for the eyes.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.facialhair',
    title: 'Facial hair pack',
    description: 'Five fuzzy options — mustaches, beards, and more.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.neck',
    title: 'Neckwear pack',
    description: 'Five accessories for around the neck — bowties, scarves, and similar.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.mouth',
    title: 'Mouth pack',
    description: 'Five mouth pieces — lollipops, smokes, and more.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.makeup',
    title: 'Makeup pack',
    description: 'Five flourishes — lipstick, eyeshadow, blush.',
    priceUsd: 0.99,
  },
  {
    productId: 'com.bingles.privates.unlock.pack.stickers',
    title: 'Stickers pack',
    description: 'Ten little floating stickers — hearts, sparkles, and more.',
    priceUsd: 0.99,
  },
];

function usdToMoney(amount) {
  const units = Math.floor(amount);
  const nanos = Math.round((amount - units) * 1e9);
  return {
    currencyCode: DEFAULT_CURRENCY,
    units: String(units),
    nanos,
  };
}

function buildOneTimeProductBody(product) {
  return {
    packageName: PACKAGE_NAME,
    productId: product.productId,
    listings: [
      {
        languageCode: 'en-US',
        title: product.title,
        description: product.description,
      },
    ],
    taxAndComplianceSettings: {
      isTokenizedDigitalAsset: false,
    },
    purchaseOptions: [
      {
        purchaseOptionId: PURCHASE_OPTION_ID,
        state: 'ACTIVE',
        buyOption: {
          legacyCompatible: true,
        },
        regionalPricingAndAvailabilityConfigs: [
          {
            regionCode: DEFAULT_REGION,
            price: usdToMoney(product.priceUsd),
            availability: 'AVAILABLE',
          },
        ],
        newRegionsConfig: {
          availability: 'AVAILABLE',
        },
      },
    ],
  };
}

async function main() {
  const keyPath = process.argv[2];
  if (!keyPath) {
    console.error('Usage: node scripts/bulk-create-iap.mjs <service-account.json>');
    process.exit(1);
  }

  const credentials = JSON.parse(readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  await auth.authorize();
  console.log(`Authenticated as ${credentials.client_email}\n`);

  const publisher = google.androidpublisher({ version: 'v3', auth });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of PRODUCTS) {
    const label = `${product.productId} (${product.title}) @ $${product.priceUsd.toFixed(2)}`;
    try {
      await publisher.monetization.onetimeproducts.create({
        packageName: PACKAGE_NAME,
        productId: product.productId,
        requestBody: buildOneTimeProductBody(product),
      });
      console.log(`✓ created  ${label}`);
      created++;
    } catch (err) {
      const status = err?.response?.status ?? err?.code;
      const message = err?.response?.data?.error?.message ?? err?.message ?? String(err);
      if (status === 409 || /already exists/i.test(message)) {
        console.log(`⤵ skipped  ${label}  (already exists)`);
        skipped++;
      } else {
        console.error(`✗ failed   ${label}`);
        console.error(`   status ${status}: ${message}`);
        failed++;
      }
    }
  }

  console.log(`\n${created} created, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

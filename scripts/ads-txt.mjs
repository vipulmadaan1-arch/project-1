// Writes ads.txt for the AdSense publisher ID in js/config.js. Usage: npm run ads-txt
import { writeFileSync } from 'node:fs';
import { ADSENSE_CLIENT } from '../js/config.js';

const pub = ADSENSE_CLIENT.replace(/^ca-/, '');
if (!/^pub-\d{10,20}$/.test(pub)) {
  console.error("Set ADSENSE_CLIENT in js/config.js first (e.g. 'ca-pub-1234567890123456').");
  process.exit(1);
}
// f08c47fec0942fa0 is Google's certification authority ID, the same for every AdSense publisher.
writeFileSync('ads.txt', `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
console.log(`Wrote ads.txt for ${pub}. Check it matches the line shown in AdSense → Sites.`);

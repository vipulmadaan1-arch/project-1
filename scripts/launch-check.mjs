// Lists anything still to set before launch. Usage: npm run launch-check
import { existsSync, readFileSync } from 'node:fs';
import { BMC_URL, SITE_NAME } from '../js/config.js';

const todo = [];
if (BMC_URL.includes('YOUR_HANDLE')) todo.push('Set BMC_URL in js/config.js (coffee button is hidden until you do).');
if (!existsSync('sitemap.xml')) todo.push('Run: npm run sitemap -- https://your-domain (once you have a domain).');
if (!readFileSync('robots.txt', 'utf8').includes('Sitemap:')) todo.push('robots.txt has no Sitemap line (the sitemap script adds it).');
console.log(`Site name: ${SITE_NAME}`);
console.log(todo.length ? `Before launch:\n- ${todo.join('\n- ')}` : 'Ready to launch.');
console.log('\nAfter merging to main: Settings → Pages → Source: GitHub Actions, then add the site to Google Search Console.');

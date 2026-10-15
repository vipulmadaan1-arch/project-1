// Shared by the privacy, about and terms pages: fills in the lines that depend on js/config.js.
import '../layout.js';
import { CONTACT_EMAIL, BMC_URL, AFFILIATES_ENABLED, AFFILIATES } from '../config.js';
import { HAS_BMC } from '../site-footer.js';
import { affiliateProblems } from '../affiliates.js';

// Only a plain address, so the mailto: link can't carry extra fields such as ?bcc=.
const contact = document.getElementById('contact-email');
if (contact && /^[^\s@<>"'?&#/:]+@[^\s@<>"'?&#/:]+\.[a-z]{2,}$/i.test(CONTACT_EMAIL)) {
  contact.textContent = CONTACT_EMAIL;
  contact.href = `mailto:${CONTACT_EMAIL}`;
  document.getElementById('contact-line').hidden = false;
}

// About: the Buy Me a Coffee line, only once BMC_URL is set.
const bmc = document.getElementById('bmc-link');
if (bmc && HAS_BMC) {
  bmc.href = BMC_URL;
  document.getElementById('bmc-line').hidden = false;
}

// Privacy: the affiliate-links paragraph, only while affiliate links are actually on.
const aff = document.getElementById('affiliate-line');
if (aff && AFFILIATES_ENABLED && AFFILIATES.some((i) => !affiliateProblems(i).length)) aff.hidden = false;

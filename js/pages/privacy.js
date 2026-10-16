// Shared by the privacy, about and terms pages: fills in the lines that depend on js/config.js.
import '../layout.js';
import { BMC_URL, AFFILIATES_ENABLED, AFFILIATES } from '../config.js';
import { contactEmail, mailtoUrl } from '../contact.js';
import { HAS_BMC } from '../site-footer.js';
import { affiliateProblems } from '../affiliates.js';

// Only a plain address (js/contact.js), so the mailto: link can't carry extra fields such as ?bcc=. The line also
// points to the contact page.
const contact = document.getElementById('contact-email');
const email = contactEmail();
if (contact && email) {
  contact.textContent = email;
  contact.href = mailtoUrl(email);
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

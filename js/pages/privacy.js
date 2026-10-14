import '../layout.js';
import { CONTACT_EMAIL } from '../config.js';

// Only a plain address, so the mailto: link can't carry extra fields such as ?bcc=.
if (/^[^\s@<>"'?&#/:]+@[^\s@<>"'?&#/:]+\.[a-z]{2,}$/i.test(CONTACT_EMAIL)) {
  const a = document.getElementById('contact-email');
  a.textContent = CONTACT_EMAIL;
  a.href = `mailto:${CONTACT_EMAIL}`;
  document.getElementById('contact-line').hidden = false;
}

import { CONTACT_EMAIL } from '../config.js';

if (CONTACT_EMAIL) {
  const a = document.getElementById('contact-email');
  a.textContent = CONTACT_EMAIL;
  a.href = `mailto:${CONTACT_EMAIL}`;
  document.getElementById('contact-line').hidden = false;
}

// Get in touch: one email button per reason to write, each opening the visitor's own email app with a subject and
// prompts filled in. Nothing is sent from the site. Until CONTACT_EMAIL (js/config.js) is a valid address the page
// says contact details are coming soon and shows no buttons.
import '../layout.js';
import { contactEmail, mailtoUrl, CONTACT_REASONS } from '../contact.js';

const email = contactEmail();
if (email) {
  for (const r of CONTACT_REASONS) {
    const a = document.querySelector(`a[data-reason="${r.key}"]`);
    if (!a) continue;
    a.href = mailtoUrl(email, { subject: r.subject, body: r.body });
    a.textContent = r.button;
    a.hidden = false;
  }
  const link = document.getElementById('contact-email');
  link.textContent = email;
  link.href = mailtoUrl(email);
  document.getElementById('contact-address').hidden = false;
  document.getElementById('contact-soon').hidden = true;
}

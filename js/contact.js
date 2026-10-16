// The contact address and the mailto: links built from it. One place checks the address, so the contact page,
// the footer link (written by scripts/seo.mjs), the "Spot a wrong figure?" link under each result and the
// about, privacy and terms pages all agree on whether it's set. Imports nothing that touches the DOM, so Node
// (scripts/seo.mjs and the tests) can use it too.
import { CONTACT_EMAIL } from './config.js';

// Only a plain address (one @, no spaces, and none of ? & # / : < > quotes), so a mailto: link built from it
// can't carry extra header fields such as ?bcc= or &cc=.
const EMAIL_RE = /^[^\s@<>"'?&#/:]+@[^\s@<>"'?&#/:]+\.[a-z]{2,}$/i;
export const validEmail = (s) => typeof s === 'string' && EMAIL_RE.test(s);

// The address to show, or '' while CONTACT_EMAIL is empty or isn't a plain address.
export const contactEmail = (email = CONTACT_EMAIL) => (validEmail(email) ? email : '');
export const HAS_CONTACT = contactEmail() !== '';

// mailto: link with an optional subject and body, each percent-encoded, so nothing typed in them can add a
// header. Returns '' for an address that isn't plain. Lines in the body are joined with CRLF (RFC 6068).
export function mailtoUrl(email, { subject = '', body = '' } = {}) {
  if (!validEmail(email)) return '';
  const fields = [];
  if (subject) fields.push(`subject=${encodeURIComponent(subject)}`);
  if (body) fields.push(`body=${encodeURIComponent(String(body).replace(/\r?\n/g, '\r\n'))}`);
  return `mailto:${email}${fields.length ? `?${fields.join('&')}` : ''}`;
}

// The questions in a wrong-figure report, so the owner can reproduce the result.
export const WRONG_FIGURE_LINES = ['What you entered: ', 'What you expected: ', 'Source (if you have one): '];

// Reasons to write, each with its own button on contact.html.
export const CONTACT_REASONS = [
  {
    key: 'wrong-figure',
    subject: 'Report a wrong figure',
    button: 'Email us about a wrong figure',
    body: ['Page: ', ...WRONG_FIGURE_LINES].join('\n'),
  },
  {
    key: 'rate-change',
    subject: 'A rate or rule has changed',
    button: 'Email us about a rate or rule change',
    body: ['Rate or rule: ', 'Which tool(s): ', 'Official source (link): ', 'When it starts: '].join('\n'),
  },
  {
    key: 'tool-idea',
    subject: 'Idea for a new tool',
    button: 'Email us your idea for a new tool',
    body: ['What it would work out: ', 'Who it would help: '].join('\n'),
  },
  {
    key: 'other',
    subject: 'Something else',
    button: 'Email us about something else',
    body: '',
  },
];

// The "Spot a wrong figure? Tell us" email for a calculator: subject names the tool, and the body starts with the
// results link (the page plus its inputs after the #), so the owner can open exactly what the visitor saw.
export const wrongFigureMail = (email, toolName, pageUrl) => mailtoUrl(email, {
  subject: `Wrong figure: ${toolName}`,
  body: [`Page: ${pageUrl}`, '(This link reopens the calculator with the figures you entered.)', ...WRONG_FIGURE_LINES].join('\n'),
});

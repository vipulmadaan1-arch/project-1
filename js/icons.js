// Line icons drawn on a 24px grid with a 1.6 stroke. They inherit colour from the text.
const P = {
  'stamp-duty-nsw': '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5M10 15.5h5"/><circle cx="16.5" cy="18.5" r="0.6" fill="currentColor"/>',
  'capital-gains-tax': '<path d="M4 20h16"/><path d="M5 16l4-4 3 3 6-7"/><path d="M14.5 8H18v3.5"/><path d="M7 20v-2M11 20v-3M15 20v-4"/>',
  'take-home-pay': '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  mortgage: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  offset: '<path d="M4 7h11"/><path d="M12 4l3 3-3 3"/><path d="M20 17H9"/><path d="M12 14l-3 3 3 3"/>',
  'rental-yield': '<path d="M3 20h18"/><path d="M5 20v-7l4-3 4 3v7"/><path d="M15 20V8l3-2 2 2v12"/><path d="M8 16h2"/>',
  gst: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9.5 14.5l5-5"/><circle cx="9.7" cy="9.7" r="0.9"/><circle cx="14.3" cy="14.3" r="0.9"/>',
  'compound-interest': '<path d="M4 20h16"/><path d="M4 17c5 0 8-2 10-6s3-6 6-7"/><path d="M16.5 4H20v3.5"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><path d="M8.5 11.5h1M11.5 11.5h1M14.5 11.5h1M8.5 14.5h1M11.5 14.5h1M14.5 14.5h1M8.5 17.5h1M11.5 17.5h1M14.5 17.5h1"/>',
  percentage: '<path d="M18 6 6 18"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  'unit-converter': '<path d="M3 15.5 15.5 3 21 8.5 8.5 21z"/><path d="M7 11.5l2 2M9.5 9l1.5 1.5M12 6.5l2 2"/>',
  'date-calculator': '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M8 13.5h2M11 13.5h2M14 13.5h2M8 16.5h2"/>',
  'world-clock': '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.4 3.4 5.3 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.3-3.4-8.5s1-6.1 3.4-8.5z"/>',
  stopwatch: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3h4M12 3v3.5M18 7.5l1.2-1.2"/>',
  timer: '<path d="M7 3h10M7 21h10"/><path d="M8 3v3.5c0 2 4 3.5 4 5.5s-4 3.5-4 5.5V21M16 3v3.5c0 2-4 3.5-4 5.5s4 3.5 4 5.5V21"/>',
  'gross-up': '<rect x="3" y="10" width="18" height="10" rx="1.5"/><circle cx="12" cy="15" r="2.2"/><path d="M12 7V2.5M9.5 5 12 2.5 14.5 5"/>',
  'hecs-help': '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3V11"/><path d="M21.5 9v5"/>',
  'work-deductions': '<path d="M3 10 9 5l6 5"/><path d="M5 8.5V14h8V8.5"/><path d="M11 20H6.5l1.2-3.2c.2-.5.6-.8 1.1-.8h8.4c.5 0 .9.3 1.1.8L19.5 20H11z"/><circle cx="9" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
  'personal-loan': '<path d="M3 15.5V12l2-4.5h10.5l3 4.5h1.5v3.5z"/><circle cx="7.5" cy="16" r="1.8"/><circle cx="16" cy="16" r="1.8"/><path d="M5.5 12h13"/>',
  'credit-card': '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 9.5h18"/><path d="M6.5 14.5h4"/>',
  'savings-goal': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  'super': '<path d="M5 20h14"/><path d="M7 20v-6h10v6"/><path d="M9 14V9a3 3 0 0 1 6 0v5"/><path d="M12 3v3"/><path d="M10.5 11.5h3"/>',
  'medicare-levy-surcharge': '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="M12 9v6M9 12h6"/>',
  'car-stamp-duty': '<path d="M5 15.5V12l1.6-4.2A1.5 1.5 0 0 1 8 6.8h8a1.5 1.5 0 0 1 1.4 1L19 12v3.5z"/><path d="M5 12h14"/><path d="M6.5 15.5V18M17.5 15.5V18"/><circle cx="8.5" cy="13.8" r="0.6" fill="currentColor"/><circle cx="15.5" cy="13.8" r="0.6" fill="currentColor"/>',
  'inflation': '<path d="M4 20h16"/><path d="M6 20v-5M10 20v-7M14 20v-9M18 20v-12"/><path d="M5 10l4-3 3 2 7-5"/><path d="M15.5 4H19v3.5"/>',
  'borrowing-power': '<path d="M3 11 10 5l7 6"/><path d="M5 9.5V19h10V9.5"/><path d="M19 9v10M16.5 11.5 19 9l2.5 2.5"/><path d="M8.5 19v-4h3v4"/>',
  'rental-cashflow': '<path d="M3 11 10 5l7 6"/><path d="M5 9.5V20h10V9.5"/><path d="M8.5 20v-4h3v4"/><path d="M19.5 4v9"/><path d="M17 10.5l2.5 2.5 2.5-2.5"/>',
  'refinance': '<path d="M3 11 9 5.5l6 5.5"/><path d="M5 9.5V19h8V9.5"/><path d="M17 7h4M19 5v4"/><path d="M17.5 14.5a3 3 0 1 1 1 4.2"/><path d="M17 20.5l1.5-1.8-2.2-.6"/>',
  'term-deposit': '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><circle cx="12" cy="14.5" r="2.6"/><path d="M12 13.3v1.2l.9.6"/>',
  'balance-transfer': '<rect x="2.5" y="4" width="12" height="8" rx="1.2"/><path d="M2.5 7h12"/><rect x="9.5" y="12" width="12" height="8" rx="1.2"/><path d="M9.5 15h12"/><path d="M18 5.5h1.5a1.5 1.5 0 0 1 1.5 1.5v2.5M19.5 8l1.5 1.5L22.5 8"/>',
  'tax-refund': '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 9h6M9 12.5h3"/><path d="M15.5 17.5h-5"/><path d="M12.5 15.5l-2 2 2 2"/>',
  'rent-vs-buy': '<path d="M2.5 11 7 7l4.5 4"/><path d="M4 10v8h6v-8"/><path d="M13 11l4.5-4 4.5 4"/><path d="M14.5 10v8h6v-8"/><path d="M17.5 18v-3"/><circle cx="7" cy="13.5" r="1.2"/>',
  'retirement': '<path d="M12 3.5c-3.6 0-6.5 5-6.5 9.5a6.5 6.5 0 0 0 13 0c0-4.5-2.9-9.5-6.5-9.5z"/><path d="M9.5 14.5h5M12 12v5"/>',
  'budget': '<path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z"/><path d="M4 7.5 15 4v3.5"/><path d="M16 13.5h4"/><circle cx="16.5" cy="13.5" r="0.6" fill="currentColor"/>',
  'lmi': '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="M8.5 12.5 12 9.5l3.5 3"/><path d="M9.8 11.4V15h4.4v-3.6"/>',
  'upfront-costs': '<path d="M3 11 10 5l7 6"/><path d="M5 9.5V20h10V9.5"/><path d="M8.5 20v-4h3v4"/><rect x="16" y="13" width="5.5" height="7" rx="1"/><path d="M17.5 15.5h2.5M17.5 18h2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  pin: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5v2.5M11.5 3.5v2.5"/>',
};

P['stamp-duty'] = P['stamp-duty-nsw'];
P['stamp-duty-vic'] = P['stamp-duty-nsw'];
P['stamp-duty-qld'] = P['stamp-duty-nsw'];
P['stamp-duty-wa'] = P['stamp-duty-nsw'];

export function icon(name, { size = 24, className = 'icon' } = {}) {
  const body = P[name];
  if (!body) return '';
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

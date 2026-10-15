import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { motorDuty, STATES } from '../motor-duty.js';

const $ = (id) => document.getElementById(id);
// Cents only when the duty isn't a whole number of dollars (VIC, WA and ACT rates can produce cents).
const dollars = (n) => fmtMoney(n, Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2);

// Disables a field that doesn't change the result in this state, and says why in its hint.
function relevance(id, on, why, normal) {
  $(id).disabled = !on;
  $(`${id}-hint`).textContent = on ? normal : why;
}

function update() {
  const state = $('state').value;
  const s = STATES.find((x) => x.code === state);
  const fuel = $('fuel').value;

  relevance('used', s.uses.includes('used'), `New and used cars pay the same rate in ${s.name}.`,
    'In the ACT, a used car pays the zero-emission rate or the standard rate, whatever its emissions.');
  relevance('fuel', s.uses.includes('fuel'), `The engine type doesn't change the rate in ${s.name}.`,
    { VIC: 'Fully electric cars always get Victoria\'s green car rate.', QLD: 'Hybrids (including plug-ins) and electric cars pay Queensland\'s lowest rate.', ACT: 'Fully electric cars pay the ACT\'s lowest (AAA) rate.', NT: 'Plug-in hybrids and electric cars get a concession in the NT until 30 June 2027.' }[state] ?? '');
  $('cyl-field').hidden = !(s.uses.includes('cylinders') && fuel === 'petrol');
  const co2Wanted = s.uses.includes('co2') && fuel !== 'ev' && !(state === 'ACT' && $('used').value === 'used');
  $('co2-field').hidden = !co2Wanted;
  $('actdate-field').hidden = state !== 'ACT';

  const value = readNumber($('value'), { name: 'Car value', unit: 'money', above: 0, max: 1e9 });
  const co2 = co2Wanted ? readNumber($('co2'), { name: 'CO2 emissions', min: 1, max: 1000, whole: true, optional: true, example: '150' }) : 0;
  const co2Known = co2Wanted && $('co2').value.trim() !== '';

  if (value === null || co2 === null) {
    $('note').textContent = '';
    $('saving-row').hidden = true;
    return blank($('total'), $('charged'), $('eff'));
  }
  const r = motorDuty({
    state, value, fuel,
    used: $('used').value === 'used',
    cylinders: $('cyl').value,
    co2: co2Known ? co2 : null,
    actFrom2027: $('actdate').value === '2027',
  });
  $('total-label').textContent = `Motor vehicle duty, ${state}`;
  $('total').textContent = dollars(r.duty);
  $('charged').textContent = fmtMoney(r.chargedOn, Number.isInteger(r.chargedOn) ? 0 : 2);
  $('eff').textContent = `${(r.effectiveRate * 100).toFixed(2)}%`;
  $('saving-row').hidden = !r.saving;
  $('saving').textContent = `−${dollars(r.saving)}`;
  $('note').textContent = [`Rate: ${r.basis}.`, ...r.notes].join(' ');
  const src = $('source');
  src.href = r.state.source;
  src.textContent = r.state.office;
}

wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

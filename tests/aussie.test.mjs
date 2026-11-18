import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analogies, comparisons, BENCH } from '../js/aussie.js';

test('every benchmark is sourced, dated and tagged', () => {
  for (const b of Object.values(BENCH)) {
    assert.match(b.url, /^https:\/\//);
    assert.ok(['verified', 'estimated'].includes(b.status));
    assert.ok(b.value > 0);
  }
});

test('analogies use the benchmarks', () => {
  const a = analogies(30000).map((x) => x.text);
  assert.equal(a[0], '1,135 hours of work at the minimum wage'); // 30,000 ÷ $26.44
  assert.equal(a[2], '42 weeks of median rent'); // 30,000 ÷ $713
  assert.match(analogies(1500000)[0].text, /years of full-time work/);
  assert.deepEqual(analogies(0), []);
});

test('comparison bars include your result and three benchmarks', () => {
  const c = comparisons(27937);
  assert.equal(c.length, 4);
  assert.equal(c.filter((b) => b.you).length, 1);
});

test('small amounts use footy tickets, not novelty prices', () => {
  assert.equal(analogies(54).at(-1).text, '2 footy tickets at the ’G (general admission)');
});

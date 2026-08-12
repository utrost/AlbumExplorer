import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('roadmap current next order starts from shipped graph/path slices and Phase 7', () => {
  const roadmap = readFileSync('docs/roadmap.md', 'utf8');

  assert.match(roadmap, /Phase 0–3: shipped\/superseded by the current static Rolling Stone atlas/);
  assert.match(roadmap, /Phase 4–6: first executable slices shipped/);
  assert.match(roadmap, /Current immediate next implementation order/);
  assert.match(roadmap, /Ship the first Phase 7 list-comparison slice/);
  assert.doesNotMatch(roadmap, /1\. Add repository skeleton and static development instructions\./);
});

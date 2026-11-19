import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, key, LIMIT, magnitude, summarize, touchesCell, TRACKS } from '../game.js';

const [tutorial, first, second, third] = TRACKS;
const point = (x, y) => ({ x, y });

test('tutorial menambahkan gerak diagonal dan negatif menjadi (2, 6)', () => {
  const moves = [point(3, 2), point(-1, 4)];
  const result = summarize(tutorial.start, moves);
  assert.deepEqual(result.end, point(2, 6));
  assert.deepEqual(result.resultant, point(2, 6));
  assert.equal(result.squared, 40);
  assert.equal(magnitude(result.resultant), Math.sqrt(40));
  assert.ok(Math.abs(result.distance - (Math.sqrt(13) + Math.sqrt(17))) < 1e-12);
  assert.equal(evaluate(tutorial, tutorial.start, moves[0]).ok, true);
  assert.match(evaluate(tutorial, tutorial.start, point(1, 0)).message, /tutorial/);
});

test('menolak diam, komponen di luar batas, dan tujuan di luar grid', () => {
  assert.match(evaluate(second, second.start, point(0, 0)).message, /Pilih/);
  assert.match(evaluate(second, second.start, point(5, 1)).message, /bilangan bulat/);
  assert.match(evaluate(second, second.start, point(-2, 0)).message, /luar grid/);
});

test('menolak ruas yang melompati tembok dan ruas yang menyentuh ujung sudutnya', () => {
  assert.match(evaluate(first, first.start, point(0, 2)).message, /tembok/);
  assert.equal(touchesCell(point(0, 0), point(1, 1), point(1, 0)), true);
  assert.equal(touchesCell(point(0, 0), point(1, 1), point(2, 0)), false);
  const cornerTrack = { ...second, walls: new Set(['1,0']) };
  assert.match(evaluate(cornerTrack, point(0, 0), point(1, 1)).message, /tembok/);
  assert.match(evaluate(cornerTrack, point(1, 1), point(-1, -1)).message, /tembok/);
});

test('checkpoint tercatat ketika ruas melewati titiknya dan urutannya wajib', () => {
  assert.equal(evaluate(third, point(0, 3), point(0, 2)).next, 1);
  assert.match(evaluate(third, point(5, 4), point(0, 1)).message, /checkpoint 1/);
  assert.match(evaluate(third, point(6, 0), point(1, 0)).message, /Finis terkunci/);
  assert.equal(evaluate(third, point(7, 3), point(0, -3), 2).finished, true);
});

function minimumTurns(track) {
  const queue = [{ position: track.start, progress: 0, turns: 0 }];
  const seen = new Set([`${key(track.start)}:0`]);
  for (const { position, progress, turns } of queue) {
    for (let x = -LIMIT; x <= LIMIT; x++) {
      for (let y = -LIMIT; y <= LIMIT; y++) {
        const step = evaluate(track, position, point(x, y), progress, turns);
        if (!step.ok) continue;
        if (step.finished) return turns + 1;
        const state = `${key(step.to)}:${step.next}`;
        if (!seen.has(state)) {
          seen.add(state);
          queue.push({ position: step.to, progress: step.next, turns: turns + 1 });
        }
      }
    }
  }
  return null;
}

test('semua lintasan dapat ditamatkan dan rekor minimum sesuai aturan Firebase', () => {
  assert.deepEqual(TRACKS.map(minimumTurns), [2, 4, 3, 5]);
});

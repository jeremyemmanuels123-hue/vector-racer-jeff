export const GRID = Object.freeze({ minX: -2, maxX: 8, minY: -1, maxY: 6 });
export const LIMIT = 4;
export const MAX_STEPS = 300;

export const key = ({ x, y }) => `${x},${y}`;
export const same = (a, b) => a.x === b.x && a.y === b.y;
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const magnitude = ({ x, y }) => Math.hypot(x, y);

function point(x, y) { return { x, y }; }

function track(details) {
  const walls = new Set();
  for (let y = GRID.minY; y <= GRID.maxY; y++) {
    for (let x = GRID.minX; x <= GRID.maxX; x++) {
      if (details.wall(x, y)) walls.add(key(point(x, y)));
    }
  }
  return { ...details, walls };
}

export const TRACKS = [
  track({
    id: 'tutorial', tag: 'Tutorial', title: 'Putaran Pemanasan', difficulty: 'Latihan',
    start: point(0, 0), finish: point(2, 6), checkpoints: [],
    lessons: [point(3, 2), point(-1, 4)],
    description: 'Gabungkan dua perpindahan untuk mencapai finis.',
    wall: (x, y) => (x === -2 && y >= 3) || (x >= 6 && y === 0),
  }),
  track({
    id: 'level-1', tag: 'Level 1', title: 'Tikungan Kota', difficulty: 'Dasar',
    start: point(0, 0), finish: point(0, 2), checkpoints: [],
    description: 'Ikuti tikungan. Coba komponen positif dan negatif.',
    wall: (x, y) => !((y === 0 || y === 4) && x >= 0 && x <= 4
      || x === 4 && y >= 0 && y <= 4 || x === 0 && y >= 2 && y <= 4),
  }),
  track({
    id: 'level-2', tag: 'Level 2', title: 'Sirkuit Diagonal', difficulty: 'Menengah',
    start: point(-1, 0), finish: point(7, 5), checkpoints: [],
    description: 'Isi kedua komponen agar mobil bergerak diagonal.',
    wall: (x, y) => x === 1 && y >= 2 || x === 4 && y <= 1
      || x === 5 && y >= 4 || x === 8 && y <= 2,
  }),
  track({
    id: 'level-3', tag: 'Level 3', title: 'Grand Prix', difficulty: 'Tantangan',
    start: point(-1, 0), finish: point(7, 0), checkpoints: [point(0, 4), point(5, 5), point(7, 2)],
    description: 'Lewati checkpoint 1–3 secara urut dengan langkah sesedikit mungkin.',
    wall: (x, y) => (x === 2 && y <= 3) || (x === 5 && y >= 0 && y <= 3)
      || (x === 7 && y === 4) || (x === -1 && y >= 5) || (x === 3 && y === 6),
  }),
];

export function within({ x, y }) {
  return x >= GRID.minX && x <= GRID.maxX && y >= GRID.minY && y <= GRID.maxY;
}

// Closed cell edges count as collisions, including a segment that touches only a corner.
export function touchesCell(from, vector, cell) {
  let entry = 0;
  let exit = 1;
  for (const axis of ['x', 'y']) {
    const low = cell[axis] - 0.5;
    const high = cell[axis] + 0.5;
    const speed = vector[axis];
    if (speed === 0) {
      if (from[axis] < low || from[axis] > high) return false;
      continue;
    }
    const t0 = (low - from[axis]) / speed;
    const t1 = (high - from[axis]) / speed;
    entry = Math.max(entry, Math.min(t0, t1));
    exit = Math.min(exit, Math.max(t0, t1));
    if (entry > exit) return false;
  }
  return true;
}

function timeAt(from, vector, target) {
  const offset = subtract(target, from);
  if (offset.x * vector.y !== offset.y * vector.x) return null;
  const time = vector.x ? offset.x / vector.x : offset.y / vector.y;
  return time > 0 && time <= 1 ? time : null;
}

export function evaluate(track, from, vector, progress = 0, turn = 0) {
  const reject = message => ({ ok: false, message });
  if (![vector.x, vector.y].every(n => Number.isInteger(n) && Math.abs(n) <= LIMIT)) {
    return reject(`Pilih bilangan bulat dari −${LIMIT} sampai +${LIMIT}.`);
  }
  if (!vector.x && !vector.y) return reject('Pilih Δx atau Δy untuk menggerakkan mobil.');
  const to = add(from, vector);
  if (!within(to)) return reject('Titik tujuan berada di luar grid.');
  for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (track.walls.has(key({ x, y })) && touchesCell(from, vector, { x, y })) {
        return reject('Panah menyentuh tembok. Ubah komponen langkah.');
      }
    }
  }
  if (track.lessons?.[turn] && !same(track.lessons[turn], vector)) {
    const { x, y } = track.lessons[turn];
    return reject(`Untuk tutorial ini, coba Δx = ${x} dan Δy = ${y}.`);
  }
  const crossed = track.checkpoints.map((target, index) => ({ index, time: timeAt(from, vector, target) }))
    .filter(({ index, time }) => index >= progress && time !== null)
    .sort((a, b) => a.time - b.time);
  let next = progress;
  for (const { index } of crossed) {
    if (index !== next) return reject(`Lewati pusat checkpoint ${next + 1} dulu.`);
    next++;
  }
  const finished = same(to, track.finish);
  if (finished && next < track.checkpoints.length) {
    return reject(`Finis terkunci. Lewati pusat checkpoint ${next + 1} dulu.`);
  }
  return { ok: true, to, next, finished };
}

export function summarize(start, moves) {
  const resultant = moves.reduce((sum, move) => add(sum, move), point(0, 0));
  return {
    resultant, end: add(start, resultant),
    distance: moves.reduce((sum, move) => sum + magnitude(move), 0),
    squared: resultant.x ** 2 + resultant.y ** 2,
  };
}

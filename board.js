import { add, GRID, key, same } from './game.js';

const CELL = 82;
const LEFT = 61;
const TOP = 18;
const WIDTH = (GRID.maxX - GRID.minX + 1) * CELL;
const HEIGHT = (GRID.maxY - GRID.minY + 1) * CELL;
const MINT = '#84ffce';
const YELLOW = '#ffd16d';
const mono = 'Consolas, monospace';

function screen({ x, y }) {
  return { x: LEFT + (x - GRID.minX + .5) * CELL, y: TOP + (GRID.maxY - y + .5) * CELL };
}

function line(ctx, a, b, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function label(ctx, value, x, y, color, size = 22) {
  ctx.font = `700 ${size}px ${mono}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function wall(ctx, x, y, track, col, row) {
  ctx.fillStyle = '#362e2b';
  ctx.fillRect(x, y, CELL, CELL);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, CELL, CELL);
  ctx.clip();
  for (let offset = (row + col) * 3 % 13 - CELL; offset < CELL; offset += 13) {
    line(ctx, { x: x + offset, y: y + CELL }, { x: x + offset + CELL, y }, '#4c3c34', 3);
  }
  ctx.restore();
  const edge = (dx, dy) => col + dx >= GRID.minX && col + dx <= GRID.maxX
    && row + dy >= GRID.minY && row + dy <= GRID.maxY && !track.walls.has(key({ x: col + dx, y: row + dy }));
  if (edge(0, 1)) line(ctx, { x, y }, { x: x + CELL, y }, '#ba8c66', 3);
  if (edge(0, -1)) line(ctx, { x, y: y + CELL }, { x: x + CELL, y: y + CELL }, '#ba8c66', 3);
  if (edge(-1, 0)) line(ctx, { x, y }, { x, y: y + CELL }, '#ba8c66', 3);
  if (edge(1, 0)) line(ctx, { x: x + CELL, y }, { x: x + CELL, y: y + CELL }, '#ba8c66', 3);
}

function stage(ctx, track) {
  ctx.fillStyle = '#0f1714';
  ctx.fillRect(0, 0, 1000, 718);
  for (let y = GRID.minY; y <= GRID.maxY; y++) {
    for (let x = GRID.minX; x <= GRID.maxX; x++) {
      const p = screen({ x, y });
      const left = p.x - CELL / 2;
      const top = p.y - CELL / 2;
      if (track.walls.has(key({ x, y }))) {
        wall(ctx, left, top, track, x, y);
      } else {
        ctx.fillStyle = (x + y) % 2 ? '#1d2723' : '#202b26';
        ctx.fillRect(left, top, CELL, CELL);
        ctx.strokeStyle = '#37473f';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(left, top, CELL, CELL);
      }
    }
  }
  const o = screen({ x: 0, y: 0 });
  ctx.setLineDash([7, 6]);
  line(ctx, { x: LEFT, y: o.y }, { x: LEFT + WIDTH, y: o.y }, '#829a89b5', 2);
  line(ctx, { x: o.x, y: TOP + HEIGHT }, { x: o.x, y: TOP }, '#829a89b5', 2);
  ctx.setLineDash([]);
  ctx.strokeStyle = '#576a5f';
  ctx.lineWidth = 2;
  ctx.strokeRect(LEFT, TOP, WIDTH, HEIGHT);
  for (let x = GRID.minX; x <= GRID.maxX; x++) {
    label(ctx, String(x).replace('-', '−'), screen({ x, y: 0 }).x, 696, x === 0 ? MINT : '#b2c2b7');
  }
  for (let y = GRID.minY; y <= GRID.maxY; y++) {
    label(ctx, String(y).replace('-', '−'), 33, screen({ x: 0, y }).y, y === 0 ? MINT : '#b2c2b7');
  }
  label(ctx, 'x→', 979, o.y, MINT, 16);
  label(ctx, '↑y', o.x, 9, MINT, 16);
}

function marker(ctx, point, text, fill, stroke) {
  const p = screen(point);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(p.x - 35, p.y - 35, 70, 70, 9);
  ctx.fill();
  ctx.stroke();
  label(ctx, text, p.x, p.y, stroke, 29);
}

function finish(ctx, point, locked) {
  const p = screen(point);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = (row + col) % 2 ? '#303836' : locked ? '#a4ada6' : '#e9ede7';
      ctx.fillRect(p.x - 32 + col * 16, p.y - 32 + row * 16, 16, 16);
    }
  }
  ctx.strokeStyle = '#e9ede7';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 32, p.y - 32, 64, 64);
}

function arrow(ctx, origin, target, color, width, tip, dashed = false) {
  if (same(origin, target)) return;
  const a = screen(origin);
  const b = screen(target);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  if (dashed) ctx.setLineDash([13, 8]);
  line(ctx, a, b, color, width);
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-tip, tip * .54);
  ctx.lineTo(-tip, -tip * .54);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function car(ctx, position, heading) {
  const p = screen(position);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(heading);
  const box = (x, y, w, h, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  };
  box(-33, -23, 65, 48, 13, '#050c09b8');
  for (const x of [-22, 14]) {
    for (const y of [-22, 14]) box(x, y, 13, 8, 3, '#090e0a');
  }
  box(-30, -19, 59, 38, 10, '#dcfb69');
  box(-16, -14, 28, 28, 6, '#18291d');
  box(5, -14, 7, 28, 3, '#45644c');
  box(-26, -13, 5, 26, 2, '#f48666');
  for (const y of [-13, 7]) box(22, y, 6, 6, 2, '#f5ffd8');
  ctx.restore();
}

export function makeBoard(canvas) {
  const ctx = canvas.getContext('2d');
  const background = document.createElement('canvas');
  background.width = canvas.width;
  background.height = canvas.height;
  let current;
  return function draw({ track, position, from, heading, trail, progress, vector, preview }) {
    if (track !== current) {
      stage(background.getContext('2d'), track);
      current = track;
    }
    ctx.drawImage(background, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(LEFT, TOP, WIDTH, HEIGHT);
    ctx.clip();
    marker(ctx, track.start, 'S', '#285348', '#78dfb7');
    finish(ctx, track.finish, progress < track.checkpoints.length);
    track.checkpoints.forEach((point, i) => marker(ctx, point, i < progress ? '✓' : String(i + 1),
      i < progress ? '#2c4a37' : '#57451e', i < progress ? '#93e5ae' : YELLOW));
    for (const step of trail) arrow(ctx, step.from, step.to, '#65c4a582', 4, 13);
    if (preview) {
      const target = add(from, vector);
      const color = preview.ok ? MINT : '#ffad9a';
      if (vector.x && vector.y) {
        const elbow = screen({ x: target.x, y: from.y });
        ctx.setLineDash([6, 7]);
        line(ctx, screen(from), elbow, '#e0f8a999', 3);
        line(ctx, elbow, screen(target), '#e0f8a999', 3);
        ctx.setLineDash([]);
      }
      arrow(ctx, from, target, color, 6, 22, !preview.ok);
      const p = screen(target);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    car(ctx, position, heading);
    ctx.restore();
  };
}

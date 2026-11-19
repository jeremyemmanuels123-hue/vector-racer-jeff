import { add, evaluate, LIMIT, magnitude, MAX_STEPS, summarize, TRACKS } from './game.js';
import { makeBoard } from './board.js';
import { configured, nicknamePattern, readScores, saveScore } from './leaderboard.js';

const $ = id => document.getElementById(id);
const board = $('board');
const draw = makeBoard(board);
const steppers = [...document.querySelectorAll('[data-axis]')];
const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const rankedTracks = TRACKS.slice(1);
let race;
let rankingRequest = 0;

const number = value => String(value).replace('-', '−');
const pair = ({ x, y }) => `(${number(x)}, ${number(y)})`;
const signed = value => value > 0 ? `+${value}` : number(value);
const text = (id, value) => { $(id).textContent = value; };

function status(id, message, state = '') {
  text(id, message);
  $(id).dataset.state = state;
}

const choices = TRACKS.map((track, index) => {
  const button = document.createElement('button');
  button.className = 'track-choice';
  button.type = 'button';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = index === 0 ? track.tag : `${track.tag} · ${track.difficulty}`;
  const title = document.createElement('span');
  title.className = 'name';
  title.textContent = track.title;
  const arrow = document.createElement('span');
  arrow.className = 'track-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  button.append(tag, title, arrow);
  button.addEventListener('click', () => { if (race.index !== index) selectTrack(index); });
  $('tracks').append(button);
  return button;
});

for (const track of rankedTracks) $('rank-level').add(new Option(`${track.tag} · ${track.title}`, track.id));

function drawRace(visualPosition = race.position) {
  const { track, position, heading, moves, progress, vector, preview } = race;
  draw({ track, position: visualPosition, from: position, heading, trail: moves, progress, vector, preview });
}

function render() {
  const { track, position, moves, vector, progress, moving, done } = race;
  const proposed = add(position, vector);
  race.preview = vector.x || vector.y ? evaluate(track, position, vector, progress, moves.length) : null;
  text('position', pair(position));
  text('step-count', moves.length);
  text('dx', signed(vector.x));
  text('dy', signed(vector.y));
  text('destination', pair(proposed));
  text('length', `${decimal.format(magnitude(vector))} m`);
  $('checkpoint-progress').hidden = !track.checkpoints.length;
  text('checkpoint-progress', `Checkpoint ${progress}/${track.checkpoints.length}`
    + (progress < track.checkpoints.length ? ` · Berikutnya ${pair(track.checkpoints[progress])}` : ' · Finis terbuka'));
  const lesson = track.lessons?.[moves.length];
  text('hint', lesson ? `Langkah ${moves.length + 1}/${track.lessons.length} · Atur Δx ${signed(lesson.x)} dan Δy ${signed(lesson.y)}.` : track.description);
  $('run').disabled = moving || done || moves.length >= MAX_STEPS;
  for (const button of steppers) {
    const next = vector[button.dataset.axis] + Number(button.dataset.change);
    button.disabled = moving || done || Math.abs(next) > LIMIT || moves.length >= MAX_STEPS;
  }
  board.setAttribute('aria-label', `${track.title}. Posisi mobil ${pair(position)}. Finis ${pair(track.finish)}. Tujuan panah ${pair(proposed)}.`);
  drawRace();
}

function selectTrack(index) {
  const track = TRACKS[index];
  race = { track, index, position: track.start, vector: { x: 0, y: 0 }, heading: 0, progress: 0, moves: [] };
  choices.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
  $('result').hidden = true;
  text('track-tag', track.tag.toUpperCase());
  text('track-title', track.title);
  status('feedback', 'Atur komponen, lihat panah, lalu tekan Jalankan.');
  render();
  if (index > 0 && $('rank-level').value !== track.id) {
    $('rank-level').value = track.id;
    loadRanking();
  }
}

for (const button of steppers) {
  button.addEventListener('click', () => {
    if (race.moving || race.done) return;
    const axis = button.dataset.axis;
    race.vector[axis] += Number(button.dataset.change);
    render();
    status('feedback', race.preview?.ok === false ? race.preview.message : 'Tekan Jalankan untuk mengikuti arah panah.',
      race.preview?.ok === false ? 'error' : '');
  });
}

function advance() {
  if (race.moving || race.done || race.moves.length >= MAX_STEPS) return;
  const run = race;
  const from = run.position;
  const vector = { ...run.vector };
  const step = evaluate(run.track, from, vector, run.progress, run.moves.length);
  if (!step.ok) {
    status('feedback', step.message, 'error');
    return;
  }
  run.moving = true;
  run.heading = Math.atan2(-vector.y, vector.x);
  render();
  status('feedback', `Mobil bergerak ${pair(vector)} m.`);

  function arrive() {
    run.moves.push({ ...vector, from, to: step.to });
    run.position = step.to;
    run.vector = { x: 0, y: 0 };
    run.moving = false;
    run.done = step.finished;
    const passed = step.next - run.progress;
    run.progress = step.next;
    render();
    if (step.finished) {
      status('feedback', `Finis dalam ${run.moves.length} langkah.`, 'ok');
      finishRun();
    } else if (run.moves.length === MAX_STEPS) {
      status('feedback', 'Batas 300 langkah tercapai. Tekan Ulang untuk memulai lagi.', 'error');
    } else {
      status('feedback', passed ? `Checkpoint tercatat (${run.progress}/${run.track.checkpoints.length}).`
        : `Mobil tiba di ${pair(step.to)}.`, 'ok');
    }
  }

  if (reducedMotion.matches) {
    arrive();
    return;
  }
  const duration = Math.min(430, 175 + magnitude(vector) * 42);
  const start = performance.now();
  function frame(now) {
    if (race !== run) return;
    const t = Math.min(1, (now - start) / duration);
    if (t === 1) arrive();
    else {
      drawRace({ x: from.x + vector.x * t, y: from.y + vector.y * t });
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

function metric(label, value) {
  const node = document.createElement('div');
  const caption = document.createElement('span');
  const number = document.createElement('strong');
  caption.textContent = label;
  number.textContent = value;
  node.append(caption, number);
  return node;
}

function finishRun() {
  const summary = summarize(race.track.start, race.moves);
  const mag = magnitude(summary.resultant);
  const length = Number.isInteger(mag) ? `${mag} m` : `√${summary.squared} ≈ ${decimal.format(mag)} m`;
  text('result-title', race.index === 0 ? 'Tutorial selesai' : 'Balapan selesai');
  const equation = race.moves.length <= 5 ? `${race.moves.map(pair).join(' + ')} = ${pair(summary.resultant)} m`
    : `Finis ${pair(summary.end)} − start ${pair(race.track.start)} = ${pair(summary.resultant)} m`;
  text('result-equation', equation);
  $('result-stats').replaceChildren(metric('Langkah', race.moves.length), metric('Besar resultan', length),
    metric('Panjang lintasan', `${decimal.format(summary.distance)} m`));
  $('moves').replaceChildren(...race.moves.map(move => {
    const row = document.createElement('li');
    row.textContent = `${pair(move.from)} → ${pair(move.to)} · Δ ${pair(move)} m`;
    return row;
  }));
  $('score-form').hidden = race.index === 0;
  $('nickname').disabled = !configured;
  $('save').disabled = !configured;
  status('save-status', configured ? '' : 'Skor belum tersimpan online. Firebase belum dikonfigurasi.');
  text('next', race.index < TRACKS.length - 1 ? `Ke ${TRACKS[race.index + 1].tag} →` : 'Ulang Level 3 ↺');
  $('result').hidden = false;
  $('result-title').focus();
}

$('score-form').addEventListener('submit', async event => {
  event.preventDefault();
  const run = race;
  if (!configured || !run.done || !run.index || run.saving || run.saved) return;
  const nickname = $('nickname').value.trim();
  if (!nicknamePattern.test(nickname)) {
    status('save-status', 'Gunakan 2–20 karakter. Awali dengan huruf A–Z atau angka. Spasi, titik, garis bawah, dan garis hubung boleh dipakai.', 'error');
    return;
  }
  if (!globalThis.crypto?.randomUUID) {
    status('save-status', 'Skor belum tersimpan online. Buka game melalui HTTPS atau localhost.', 'error');
    return;
  }
  run.score ||= { id: crypto.randomUUID(), nickname, level: run.track.id, steps: run.moves.length };
  run.saving = true;
  $('save').disabled = true;
  $('nickname').disabled = true;
  status('save-status', 'Mengirim skor ke Firebase…');
  try {
    await saveScore(run.score);
    run.saved = true;
    if (race === run) {
      status('save-status', 'Skor tersimpan di Firebase.', 'ok');
      $('rank-level').value = run.track.id;
      loadRanking();
    }
  } catch {
    if (race === run) {
      status('save-status', 'Skor belum terkonfirmasi tersimpan online. Periksa koneksi atau konfigurasi Firebase, lalu coba lagi.', 'error');
      $('save').disabled = false;
    }
  } finally {
    run.saving = false;
  }
});

async function loadRanking() {
  const request = ++rankingRequest;
  const level = $('rank-level').value;
  $('rank-table').hidden = true;
  $('rank-body').replaceChildren();
  if (!configured) {
    text('rank-status', 'Firebase belum dikonfigurasi. Skor belum tersimpan online.');
    return;
  }
  text('rank-status', 'Memuat peringkat dari Firebase…');
  try {
    const scores = await readScores(level);
    if (request !== rankingRequest) return;
    if (!scores.length) {
      text('rank-status', 'Belum ada skor online untuk lintasan ini.');
      return;
    }
    $('rank-body').replaceChildren(...scores.map((score, index) => {
      const row = document.createElement('tr');
      const date = score.createdAt?.toDate?.();
      for (const value of [index + 1, score.nickname, score.steps, date ? dateFormat.format(date) : '—']) {
        row.insertCell().textContent = value;
      }
      return row;
    }));
    text('rank-status', '');
    $('rank-table').hidden = false;
  } catch {
    if (request === rankingRequest) text('rank-status', 'Peringkat online belum bisa dimuat. Periksa koneksi dan coba muat ulang.');
  }
}

$('run').addEventListener('click', advance);
$('reset').addEventListener('click', () => selectTrack(race.index));
$('next').addEventListener('click', () => {
  selectTrack(Math.min(TRACKS.length - 1, race.index + 1));
  $('reset').focus();
});
$('rank-level').addEventListener('change', loadRanking);
$('refresh').addEventListener('click', loadRanking);
selectTrack(0);
loadRanking();

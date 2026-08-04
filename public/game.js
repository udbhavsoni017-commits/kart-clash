/* global io */
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const menu = document.querySelector('#menu');
const form = document.querySelector('#join-form');
const nameInput = document.querySelector('#name');
const roomInput = document.querySelector('#room');
const hud = document.querySelector('#hud');
const touchControls = document.querySelector('#touch-controls');
const roomCode = document.querySelector('#room-code');
const status = document.querySelector('#status span');
const leaderboard = document.querySelector('#leaderboard');
const selfCard = document.querySelector('#self-card');
const message = document.querySelector('#message');
const reconnecting = document.querySelector('#disconnected');

const socket = io({ autoConnect: false });
let game = null;
let joined = false;
let currentRoom = '';
const keys = { up: false, down: false, left: false, right: false };
let lastInput = '';
let lastShot = 0;

const palette = {
  grass: '#2f9a70', grassDark: '#23865e', road: '#30385d', roadEdge: '#52618b',
  lane: '#ffc852', shadow: 'rgba(9, 21, 53, .22)'
};

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

function setInput(next) {
  Object.assign(keys, next);
  const serial = JSON.stringify(keys);
  if (joined && serial !== lastInput) {
    socket.emit('input', keys);
    lastInput = serial;
  }
}

function fire() {
  const now = performance.now();
  if (joined && now - lastShot > 130) {
    socket.emit('fire');
    lastShot = now;
  }
}

const keyMap = {
  w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right'
};
addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === ' ' || key === 'spacebar') {
    event.preventDefault(); fire(); return;
  }
  if (keyMap[key]) { event.preventDefault(); setInput({ [keyMap[key]]: true }); }
});
addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (keyMap[key]) { event.preventDefault(); setInput({ [keyMap[key]]: false }); }
});
addEventListener('blur', () => setInput({ up: false, down: false, left: false, right: false }));

for (const button of document.querySelectorAll('[data-key]')) {
  const key = button.dataset.key;
  const activate = (event) => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); setInput({ [key]: true }); };
  const release = (event) => { event.preventDefault(); setInput({ [key]: false }); };
  button.addEventListener('pointerdown', activate);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', () => setInput({ [key]: false }));
}
document.querySelector('#touch-fire').addEventListener('pointerdown', (event) => { event.preventDefault(); fire(); });

function enterLobby(solo = false) {
  const name = nameInput.value.trim() || 'Driver';
  const room = roomInput.value.trim() || 'PITSTOP';
  socket.connect();
  socket.emit('join', { name, room, solo }, (reply) => {
    if (!reply?.ok) {
      document.querySelector('#join').textContent = reply?.error || 'Unable to join';
      setTimeout(() => { document.querySelector('#join').innerHTML = 'Start engines <span>→</span>'; }, 1800);
      return;
    }
    joined = true;
    currentRoom = reply.code;
    roomCode.textContent = currentRoom;
    menu.hidden = true;
    hud.hidden = false;
    touchControls.hidden = false;
    setInput({ up: false, down: false, left: false, right: false });
  });
}

form.addEventListener('submit', (event) => { event.preventDefault(); enterLobby(); });
document.querySelector('#solo').addEventListener('click', () => enterLobby(true));
document.querySelector('#leave').addEventListener('click', () => {
  joined = false; game = null; socket.disconnect();
  hud.hidden = true; touchControls.hidden = true; menu.hidden = false;
  setInput({ up: false, down: false, left: false, right: false });
});
socket.on('state', (state) => { game = state; });
socket.on('disconnect', () => { if (joined) reconnecting.hidden = false; });
socket.on('connect', () => {
  reconnecting.hidden = true;
  // A reconnect gets a new socket id, so register this driver in the room again.
  if (joined && currentRoom) socket.emit('join', { name: nameInput.value.trim() || 'Driver', room: currentRoom });
});

function me() { return game?.players.find((player) => player.id === socket.id); }
function camera() {
  const player = me();
  const scale = Math.max(.48, Math.min(1, Math.min(innerWidth / 970, innerHeight / 620) + .15));
  if (!player || !game) return { x: 900, y: 500, scale };
  const look = player.respawning ? 0 : 50;
  return {
    x: Math.max(innerWidth / (2 * scale), Math.min(game.world.width - innerWidth / (2 * scale), player.x + Math.cos(player.angle) * look)),
    y: Math.max(innerHeight / (2 * scale), Math.min(game.world.height - innerHeight / (2 * scale), player.y + Math.sin(player.angle) * look)),
    scale
  };
}

function worldToScreen(x, y, cam) {
  return { x: (x - cam.x) * cam.scale + innerWidth / 2, y: (y - cam.y) * cam.scale + innerHeight / 2 };
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
}

function drawGrass(cam) {
  ctx.fillStyle = palette.grass; ctx.fillRect(0, 0, innerWidth, innerHeight);
  const cell = 70 * cam.scale;
  const offsetX = ((-cam.x * cam.scale) % cell + cell) % cell;
  const offsetY = ((-cam.y * cam.scale) % cell + cell) % cell;
  ctx.fillStyle = 'rgba(23, 100, 71, .16)';
  for (let x = offsetX - cell; x < innerWidth + cell; x += cell) {
    for (let y = offsetY - cell; y < innerHeight + cell; y += cell) {
      if ((Math.floor((x - offsetX) / cell) + Math.floor((y - offsetY) / cell)) % 2) ctx.fillRect(x, y, cell, cell);
    }
  }
}

function drawTrack(cam) {
  const center = worldToScreen(900, 500, cam);
  const outerW = 1390 * cam.scale, outerH = 700 * cam.scale;
  const innerW = 820 * cam.scale, innerH = 290 * cam.scale;
  ctx.save(); ctx.translate(center.x, center.y);
  ctx.fillStyle = palette.roadEdge; roundedRect(-outerW / 2, -outerH / 2, outerW, outerH, 205 * cam.scale); ctx.fill();
  ctx.fillStyle = palette.road; roundedRect(-outerW / 2 + 10, -outerH / 2 + 10, outerW - 20, outerH - 20, 195 * cam.scale); ctx.fill();
  ctx.fillStyle = palette.grassDark; roundedRect(-innerW / 2, -innerH / 2, innerW, innerH, 125 * cam.scale); ctx.fill();
  ctx.strokeStyle = palette.lane; ctx.lineWidth = Math.max(2, 4 * cam.scale); ctx.setLineDash([21 * cam.scale, 17 * cam.scale]);
  roundedRect(-1100 * cam.scale / 2, -485 * cam.scale / 2, 1100 * cam.scale, 485 * cam.scale, 150 * cam.scale); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

function drawObstacle(obstacle, cam) {
  const at = worldToScreen(obstacle.x, obstacle.y, cam); const r = obstacle.r * cam.scale;
  ctx.save(); ctx.translate(at.x, at.y);
  ctx.fillStyle = 'rgba(12, 44, 43, .26)'; ctx.beginPath(); ctx.ellipse(5 * cam.scale, 7 * cam.scale, r * 1.05, r * .7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#16705a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#31af7e'; ctx.beginPath(); ctx.arc(-r * .18, -r * .18, r * .77, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(199, 255, 157, .35)'; ctx.beginPath(); ctx.arc(-r * .27, -r * .3, r * .32, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawPickup(pickup, cam, time) {
  const at = worldToScreen(pickup.x, pickup.y, cam); const bob = Math.sin(time / 180 + pickup.x) * 3;
  const colors = { boost: '#baff42', shield: '#55dcff', repair: '#ff6f8d' };
  const symbols = { boost: '⚡', shield: '◈', repair: '+' };
  ctx.save(); ctx.translate(at.x, at.y + bob * cam.scale); ctx.scale(cam.scale, cam.scale);
  ctx.fillStyle = 'rgba(8, 24, 52, .35)'; ctx.beginPath(); ctx.ellipse(0, 15, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors[pickup.kind]; ctx.shadowColor = colors[pickup.kind]; ctx.shadowBlur = 13;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#17344c'; ctx.font = '900 18px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(symbols[pickup.kind], 0, 1); ctx.restore();
}

function drawKart(player, cam, own) {
  if (player.respawning) return;
  const at = worldToScreen(player.x, player.y, cam);
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(player.angle); ctx.scale(cam.scale, cam.scale);
  ctx.fillStyle = 'rgba(8, 17, 43, .28)'; ctx.beginPath(); ctx.ellipse(5, 9, 29, 16, 0, 0, Math.PI * 2); ctx.fill();
  if (player.shield) { ctx.strokeStyle = 'rgba(85, 220, 255, .85)'; ctx.lineWidth = 2; ctx.shadowBlur = 13; ctx.shadowColor = '#55dcff'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  if (player.boost) { ctx.fillStyle = '#c9ff48'; ctx.beginPath(); ctx.moveTo(-31, -7); ctx.lineTo(-48, 0); ctx.lineTo(-31, 7); ctx.fill(); }
  ctx.fillStyle = '#17213b'; roundedRect(-21, -17, 42, 34, 10); ctx.fill();
  ctx.fillStyle = '#11182f'; roundedRect(-27, -17, 9, 11, 3); ctx.fill(); roundedRect(-27, 6, 9, 11, 3); ctx.fill(); roundedRect(18, -17, 9, 11, 3); ctx.fill(); roundedRect(18, 6, 9, 11, 3); ctx.fill();
  ctx.fillStyle = player.flash ? '#fff' : player.color; roundedRect(-20, -14, 40, 28, 9); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; roundedRect(-8, -11, 17, 9, 4); ctx.fill();
  ctx.fillStyle = '#24304d'; roundedRect(-16, -3, 28, 11, 6); ctx.fill();
  ctx.fillStyle = '#f7fbff'; ctx.beginPath(); ctx.arc(20, -8, 3, 0, Math.PI * 2); ctx.arc(20, 8, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const labelY = at.y - 37 * cam.scale;
  ctx.font = `900 ${Math.max(10, 12 * cam.scale)}px Nunito`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#14203e'; ctx.strokeText(player.name, at.x, labelY); ctx.fillStyle = own ? '#caff58' : '#fff'; ctx.fillText(player.name, at.x, labelY);
  if (!own) { const healthY = labelY + 6; ctx.fillStyle = '#192345'; roundedRect(at.x - 17 * cam.scale, healthY, 34 * cam.scale, 4 * cam.scale, 3); ctx.fill(); ctx.fillStyle = '#ff6072'; roundedRect(at.x - 17 * cam.scale, healthY, (34 * player.health / 3) * cam.scale, 4 * cam.scale, 3); ctx.fill(); }
}

function drawProjectile(shot, cam) {
  const at = worldToScreen(shot.x, shot.y, cam); const r = Math.max(3, 6 * cam.scale);
  ctx.save(); ctx.fillStyle = '#fff7bd'; ctx.shadowColor = '#ffc745'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function draw() {
  const time = performance.now();
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (!game) {
    ctx.fillStyle = '#101833'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < 40; i += 1) { ctx.fillStyle = i % 2 ? '#18214a' : '#141d40'; ctx.beginPath(); ctx.arc((i * 197) % innerWidth, (i * 103) % innerHeight, 45 + (i % 4) * 20, 0, Math.PI * 2); ctx.fill(); }
    requestAnimationFrame(draw); return;
  }
  const cam = camera();
  drawGrass(cam); drawTrack(cam);
  game.obstacles.forEach((o) => drawObstacle(o, cam));
  game.pickups.forEach((p) => drawPickup(p, cam, time));
  game.projectiles.forEach((p) => drawProjectile(p, cam));
  const you = me();
  [...game.players].sort((a, b) => a.y - b.y).forEach((p) => drawKart(p, cam, p.id === socket.id));
  updateHud(you);
  requestAnimationFrame(draw);
}

function updateHud(you) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  leaderboard.innerHTML = `<h2>Race control</h2>${sorted.map((player, index) => `<div class="rank ${player.id === socket.id ? 'me' : ''}"><span class="place">${index + 1}.</span><span>${escapeHtml(player.name)}</span><span class="points">${player.score}</span></div>`).join('')}`;
  status.textContent = game.players.length > 1 ? `${game.players.length} drivers on track` : 'Waiting for drivers…';
  if (!you) return;
  const hearts = Array.from({ length: 3 }, (_, index) => `<span class="heart ${index >= you.health ? 'empty' : ''}">♥</span>`).join('');
  selfCard.innerHTML = `<div>${escapeHtml(you.name)} <span style="color:#aebce4;font-size:11px">${you.score} TAKEDOWNS</span></div><div class="health">${hearts}</div>${you.boost ? '<div class="boost">⚡ TURBO ACTIVE</div>' : you.shield ? '<div class="boost" style="color:#55dcff">◈ SHIELD ACTIVE</div>' : ''}`;
  message.textContent = you.respawning ? `WRECKED!\nBack in ${(you.respawning / 1000).toFixed(1)}…` : (game.players.length === 1 ? 'Invite a friend\nto this room!' : '');
}

function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]); }
requestAnimationFrame(draw);

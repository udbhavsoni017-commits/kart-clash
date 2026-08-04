const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ['websocket', 'polling'] });

const PORT = process.env.PORT || 3000;
const TICK_RATE = 30;
const WORLD = { width: 1800, height: 1000 };
const SPAWNS = [
  [210, 215], [1590, 215], [210, 785], [1590, 785],
  [900, 170], [900, 830], [350, 500], [1450, 500]
];
const OBSTACLES = [
  { x: 900, y: 500, r: 130 },
  { x: 520, y: 335, r: 76 },
  { x: 1280, y: 665, r: 76 },
  { x: 1280, y: 335, r: 58 },
  { x: 520, y: 665, r: 58 }
];
const COLORS = ['#ff5b58', '#34c8ff', '#ffc94f', '#a98bff', '#42dd9b', '#ff80ba', '#ff9e52', '#60d8bd'];
const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.status(200).send('ok'));

function cleanText(value, fallback, max) {
  const text = String(value || fallback).replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  return (text || fallback).slice(0, max);
}

function createRoom(code) {
  return {
    code,
    players: new Map(),
    projectiles: [],
    pickups: [],
    nextPickupAt: Date.now() + 2000
  };
}

function makePlayer(id, name, index, isBot = false) {
  const spawn = SPAWNS[index % SPAWNS.length];
  return {
    id, name, x: spawn[0], y: spawn[1], angle: index % 2 ? Math.PI : 0,
    color: COLORS[index % COLORS.length], health: 3, score: 0, streak: 0,
    boost: 0, shield: 0, respawnAt: 0, lastShot: 0,
    input: { up: false, down: false, left: false, right: false },
    flash: 0, isBot
  };
}

function addSoloBots(room) {
  const botNames = ['Bolt', 'Luna', 'Rex'];
  botNames.forEach((name, index) => {
    const id = `bot-${room.code}-${index}`;
    if (!room.players.has(id)) room.players.set(id, makePlayer(id, name, room.players.size, true));
  });
}

function alive(player) {
  return !player.respawnAt;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function nudgeOutOfObstacle(entity) {
  for (const obstacle of OBSTACLES) {
    const dx = entity.x - obstacle.x;
    const dy = entity.y - obstacle.y;
    const distance = Math.hypot(dx, dy) || 1;
    const minDistance = obstacle.r + 25;
    if (distance < minDistance) {
      entity.x = obstacle.x + (dx / distance) * minDistance;
      entity.y = obstacle.y + (dy / distance) * minDistance;
    }
  }
  entity.x = clamp(entity.x, 34, WORLD.width - 34);
  entity.y = clamp(entity.y, 34, WORLD.height - 34);
}

function addPickup(room) {
  const kinds = ['boost', 'shield', 'repair'];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const pickup = {
      id: `${Date.now()}-${Math.random()}`,
      x: 120 + Math.random() * (WORLD.width - 240),
      y: 120 + Math.random() * (WORLD.height - 240),
      kind: kinds[Math.floor(Math.random() * kinds.length)]
    };
    if (OBSTACLES.every((o) => Math.hypot(pickup.x - o.x, pickup.y - o.y) > o.r + 70)) {
      room.pickups.push(pickup);
      return;
    }
  }
}

function fire(room, player) {
  const now = Date.now();
  if (!alive(player) || now - player.lastShot < 430) return;
  player.lastShot = now;
  room.projectiles.push({
    id: `${player.id}-${now}`,
    ownerId: player.id,
    x: player.x + Math.cos(player.angle) * 32,
    y: player.y + Math.sin(player.angle) * 32,
    vx: Math.cos(player.angle) * 720,
    vy: Math.sin(player.angle) * 720,
    expiresAt: now + 1500
  });
}

function killPlayer(room, victim, killer) {
  victim.health = 3;
  victim.respawnAt = Date.now() + 1400;
  victim.streak = 0;
  if (killer && killer.id !== victim.id) {
    killer.score += 1;
    killer.streak += 1;
  }
}

function angleDifference(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function updateBot(room, bot) {
  if (!alive(bot)) return;
  const targets = [...room.players.values()].filter((player) => player.id !== bot.id && alive(player));
  if (!targets.length) return;
  const target = targets.sort((a, b) => Math.hypot(a.x - bot.x, a.y - bot.y) - Math.hypot(b.x - bot.x, b.y - bot.y))[0];
  const wantedAngle = Math.atan2(target.y - bot.y, target.x - bot.x);
  const difference = angleDifference(bot.angle, wantedAngle);
  bot.input.left = difference < -0.12;
  bot.input.right = difference > 0.12;
  bot.input.up = true;
  bot.input.down = false;
  const distance = Math.hypot(target.x - bot.x, target.y - bot.y);
  if (Math.abs(difference) < 0.18 && distance < 560) fire(room, bot);
}

function updateRoom(room, dt) {
  const now = Date.now();
  for (const [index, player] of [...room.players.values()].entries()) {
    if (player.isBot) updateBot(room, player);
    if (player.respawnAt && now >= player.respawnAt) {
      const spawn = SPAWNS[(index + Math.floor(now / 1400)) % SPAWNS.length];
      player.x = spawn[0];
      player.y = spawn[1];
      player.angle = Math.atan2(WORLD.height / 2 - player.y, WORLD.width / 2 - player.x);
      player.respawnAt = 0;
      player.shield = now + 900;
      continue;
    }
    if (!alive(player)) continue;
    const turning = (player.input.right ? 1 : 0) - (player.input.left ? 1 : 0);
    player.angle += turning * 3.2 * dt;
    const direction = (player.input.up ? 1 : 0) - (player.input.down ? 0.55 : 0);
    const boosted = player.boost > now;
    const speed = direction * (boosted ? 420 : 285);
    player.x += Math.cos(player.angle) * speed * dt;
    player.y += Math.sin(player.angle) * speed * dt;
    nudgeOutOfObstacle(player);
    player.flash = Math.max(0, player.flash - dt);

    for (let i = room.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = room.pickups[i];
      if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 36) {
        if (pickup.kind === 'boost') player.boost = now + 2600;
        if (pickup.kind === 'shield') player.shield = now + 2800;
        if (pickup.kind === 'repair') player.health = Math.min(3, player.health + 1);
        room.pickups.splice(i, 1);
      }
    }
  }

  for (let i = room.projectiles.length - 1; i >= 0; i -= 1) {
    const shot = room.projectiles[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    const hitWall = shot.x < 0 || shot.x > WORLD.width || shot.y < 0 || shot.y > WORLD.height;
    const hitObstacle = OBSTACLES.some((o) => Math.hypot(shot.x - o.x, shot.y - o.y) < o.r + 8);
    if (now > shot.expiresAt || hitWall || hitObstacle) {
      room.projectiles.splice(i, 1);
      continue;
    }
    for (const player of room.players.values()) {
      if (!alive(player) || player.id === shot.ownerId) continue;
      if (Math.hypot(shot.x - player.x, shot.y - player.y) < 27) {
        const owner = room.players.get(shot.ownerId);
        if (player.shield <= now) {
          player.health -= 1;
          player.flash = 0.18;
          if (player.health <= 0) killPlayer(room, player, owner);
        }
        room.projectiles.splice(i, 1);
        break;
      }
    }
  }

  if (now >= room.nextPickupAt && room.pickups.length < 5) {
    addPickup(room);
    room.nextPickupAt = now + 2600;
  }
}

function serialiseRoom(room) {
  return {
    world: WORLD,
    obstacles: OBSTACLES,
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, x: p.x, y: p.y, angle: p.angle, color: p.color,
      health: p.health, score: p.score, streak: p.streak, boost: p.boost > Date.now(),
      shield: p.shield > Date.now(), respawning: p.respawnAt ? Math.max(0, p.respawnAt - Date.now()) : 0,
      flash: p.flash > 0, bot: p.isBot
    })),
    projectiles: room.projectiles.map((s) => ({ x: s.x, y: s.y })),
    pickups: room.pickups
  };
}

io.on('connection', (socket) => {
  socket.on('join', (payload, reply) => {
    const solo = Boolean(payload && payload.solo);
    const code = solo
      ? `SOLO-${socket.id.slice(0, 6).toUpperCase()}`
      : cleanText(payload && payload.room, 'PITSTOP', 12).toUpperCase();
    const name = cleanText(payload && payload.name, 'Driver', 14);
    if (socket.data.roomCode) {
      const oldRoom = rooms.get(socket.data.roomCode);
      oldRoom && oldRoom.players.delete(socket.id);
      socket.leave(socket.data.roomCode);
    }
    let room = rooms.get(code);
    if (!room) {
      room = createRoom(code);
      rooms.set(code, room);
    }
    if (room.players.size >= 8) return reply && reply({ ok: false, error: 'This lobby is full.' });
    const player = makePlayer(socket.id, name, room.players.size);
    room.players.set(socket.id, player);
    if (solo) addSoloBots(room);
    socket.join(code);
    socket.data.roomCode = code;
    reply && reply({ ok: true, code });
  });

  socket.on('input', (input) => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && room.players.get(socket.id);
    if (!player || !input) return;
    for (const key of ['up', 'down', 'left', 'right']) {
      if (typeof input[key] === 'boolean') player.input[key] = input[key];
    }
  });

  socket.on('fire', () => {
    const room = rooms.get(socket.data.roomCode);
    const player = room && room.players.get(socket.id);
    if (room && player) fire(room, player);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.players.delete(socket.id);
    if (![...room.players.values()].some((player) => !player.isBot)) rooms.delete(room.code);
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    updateRoom(room, 1 / TICK_RATE);
    io.to(room.code).emit('state', serialiseRoom(room));
  }
}, 1000 / TICK_RATE);

server.listen(PORT, () => console.log(`Kart Clash running at http://localhost:${PORT}`));

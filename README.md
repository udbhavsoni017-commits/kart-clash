# Kart Clash

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Multiplayer](https://img.shields.io/badge/players-1--10-34c8ff)
![License](https://img.shields.io/badge/license-MIT-baff42)

An installable arcade kart battle game. Race solo against AI karts or host a private lobby for up to 10 friends — no account required.

## Highlights

- **Host-controlled lobbies:** the first driver is host and chooses when to start.
- **Solo or multiplayer:** play against three bots or share a room code with friends.
- **Three-round match:** 3:00, 1:00, then 1:00, with score-based winners.
- **Power-ups:** turbo, shield, repair, rocket, and triple-shot pickups.
- **PWA ready:** install it from Chrome, Edge, Safari, or an Android home screen.

## Quick start

```bash
git clone https://github.com/udbhavsoni017-commits/kart-clash.git
cd kart-clash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Run it locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. To play on the same Wi-Fi network, open `http://YOUR-COMPUTER-IP:3000` on each friend's device.

## Run on Windows

1. Install the current [Node.js LTS](https://nodejs.org/).
2. Download this repository as a ZIP from GitHub and extract it, or clone it with Git.
3. Open **PowerShell** in the `kart-clash` folder and run:
   ```powershell
   npm install
   npm start
   ```
4. Open `http://localhost:3000` in Chrome or Microsoft Edge.
5. Enter a name and room code. The first human driver is the **HOST**. Wait for everyone to join, then the host presses **Start match**.

To install it like a Windows app, open the running or deployed game in **Microsoft Edge** or **Google Chrome**, then choose **Install Kart Clash** from the address-bar app/install icon. It will be added to the Start menu like a normal app.

## Controls

- **W / Up** — accelerate
- **S / Down** — brake / reverse
- **A,D / Left,Right** — steer
- **Space** — fire
- Touch controls appear on mobile

## Match rules and power-ups

Every match begins in a lobby. The first human driver is marked **HOST**, sees the list of all drivers (up to 10), and is the only player who can press **Start match**. Every match then has three timed rounds: **3 minutes**, then **1 minute**, then **1 minute**. Takedowns add to your high score; the leading driver is celebrated for three seconds after each round, and the final high-score leader wins the match.

- ⚡ **Turbo** — temporary speed boost
- ◈ **Shield** — temporary damage protection
- + **Repair** — restore one health point
- **R Rocket** — a slow, powerful two-hit shot for nine seconds
- **≋ Triple Shot** — fires three bolts at once for nine seconds

## Install it like an app

After the game is deployed to an HTTPS address, open it in Chrome, Edge, or Safari:

- **Desktop:** click **Install Kart Clash** when it appears, or use the browser's install icon in the address bar.
- **iPhone/iPad:** open the game in Safari, tap **Share**, then choose **Add to Home Screen**.
- **Android:** open it in Chrome and choose **Install app** / **Add to Home screen**.

The installed app has its own icon and opens without the browser address bar. An internet connection is still needed for multiplayer matches.

## Put it online for friends

1. Fork this repository or use your own GitHub copy.
2. In [Render](https://render.com), create a **New Web Service** and connect the repository. The included `render.yaml` supplies the configuration.
3. Deploy and send the Render URL to friends. Everyone enters the same room code from the landing screen.

The game uses Socket.IO, so all players in the same room see the same server-authoritative game state.

## Project structure

```text
public/       Browser game, PWA manifest, icons, and service worker
server.js     Socket.IO game server and authoritative match rules
render.yaml   One-click deployment configuration for Render
```

## Contributing

Ideas and improvements are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

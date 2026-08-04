# Kart Clash

A small, no-account kart battle game inspired by arcade kart combat games. Start a **Solo battle** against three AI karts, or share a room code with friends for multiplayer (up to 10 drivers per room).

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

1. Create a new empty GitHub repository.
2. Add it as `origin` and push this project:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/kart-clash.git
   git push -u origin main
   ```
3. In [Render](https://render.com), create a **New Web Service**, connect the repository, and deploy. The included `render.yaml` supplies the configuration.
4. Send the Render URL to friends. Everyone enters the same room code from the landing screen.

The game uses Socket.IO, so all players in the same room see the same server-authoritative game state.

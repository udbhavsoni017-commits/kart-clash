# Kart Clash

A small, no-account kart battle game inspired by arcade kart combat games. Start a **Solo battle** against three AI karts, or share a room code with friends for multiplayer.

## Run it locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. To play on the same Wi-Fi network, open `http://YOUR-COMPUTER-IP:3000` on each friend's device.

## Controls

- **W / Up** — accelerate
- **S / Down** — brake / reverse
- **A,D / Left,Right** — steer
- **Space** — fire
- Touch controls appear on mobile

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

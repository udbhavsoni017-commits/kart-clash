# Contributing to Kart Clash

Thanks for helping improve the game.

## Local setup

```bash
git clone https://github.com/udbhavsoni017-commits/kart-clash.git
cd kart-clash
npm install
npm start
```

Open `http://localhost:3000` and use a second browser window to test multiplayer changes.

## Before opening a pull request

1. Keep changes focused on one improvement.
2. Run `node --check server.js` and `node --check public/game.js`.
3. Test both solo play and a shared-room match when changing gameplay.
4. Describe what changed and how you tested it in the pull request.

Please do not commit `node_modules`, environment files, or credentials.

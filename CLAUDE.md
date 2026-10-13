# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multiplayer browser version of the Swiss card game **Hosenabe-Jass** (rules: https://www.jasswelt.ch/blogs/neuigkeiten/jassregel-vom-hosenabe-jass). There are two packages, each with its own `package.json` and `node_modules`:

- **Server** (repo root, `src/`): Node + TypeScript. It runs Express (serves the built client from `client/build`) and a Socket.IO server that holds all game state in memory.
- **Client** (`client/`): Create React App, plain JavaScript, Material-UI v4, React 17.

User-facing strings (log messages, validation errors, UI) are in Swiss German, e.g. `'hät gchlopfet.'`. Keep that style when adding text.

## Commands

All commands run from the repo root unless noted.

- `npm run clean-install`: `npm ci` for both server and client.
- `npm run dev`: runs the server (`ts-node-dev src/server.ts`, port 3000) and the CRA dev server (port 3001, from `client/.env.development`) in parallel. In development the client connects to `localhost:3000` (see `client/src/api.js`).
- `npm run build`: builds the client into `client/build`, then compiles the server with `tsc` into `dist/`.
- `npm run build-ts`: compiles only the server.
- `npm start`: compiles the server and runs `dist/server.js`. It serves `client/build`, so build the client first.
- Client tests: `cd client && npm test` (Jest in watch mode). For a single test: `cd client && npx react-scripts test --watchAll=false -t "<name>"`.

The root `npm test` does nothing. The only client test (`App.test.js`) is leftover CRA boilerplate that looks for "learn react", so it is stale. No linter is configured beyond CRA's built-in `eslintConfig`. CI (`.github/workflows/nodejs.yml`) runs clean-install, build and test on Node 10.x/12.x. Those versions are older than the current dependencies support (Express 5, TS 5).

## Architecture

### Server layers (`src/`)

`server.ts` → `api.ts` (`API`) → `gameLobby.ts` (`Lobby`) → `game.ts` (`Game`), with `ai.ts` attached to the lobby.

- **`game.ts`** holds the pure game model: `Card`, `CardStack`, `JassDeck`, `HandStack` (enforces at most 3 cards; `analyzeHand()` does the scoring), `Player`, and `Game`. It does no I/O. Every player action follows the same pattern: `canPlayerTakeAction(playerId, Action.X)` → `takeActionX()` → log message → `endTurn()` or `endRound()`. `getAllowedActions(playerId)` is the single source of truth for what a player may do. The client and the AI both read it from the game state. `getGameState(playerId)` returns a per-player view: only that player's hand, the table, and a JSON deep clone.
- **`gameLobby.ts`**: `Lobby` tracks `LobbyPlayer`s (player ↔ socketId ↔ gameId) and the list of games. It spawns and joins games, and `cleanUpGame` deletes a game (and kills its AIs) once no human players are left.
- **`api.ts`**: one `socket.on('request …')` handler per action, all built from the same boilerplate: check the player exists, find their game, check the action is allowed, apply it, then `emitGameUpdate`. Socket.IO rooms: `'lobby'` for players not in a game, and one room per game ID. Game updates go to each player's socket individually because they're personalized. Exceptions are caught and logged, never sent to clients, except `'server error' {type: 'player not found'}`. The message interfaces (`RegisterMessage`, `SwitchMessage`, …) define the wire protocol. When a human player's socket disconnects, their seat is kept for `RECONNECT_GRACE_MS`. A new socket can reclaim it with `'request reconnect' {playerId}`, which rebinds `LobbyPlayer.socketId`. The client keeps the player in `sessionStorage`, so a page refresh doesn't make the player leave the game.
- **Spectators**: `'request spectate game' {playerId, gameId}` lets a lobby player watch any game, started or not. `Game` keeps them in a separate `spectators` list, so they never count as players (turns, tokens, `getNHumanPlayers`). Their `getGameState` has `isSpectator: true`, every player's hand in `playerHands`, and no allowed actions. In the lobby they're `LobbyPlayer`s with `isInGame` and `isSpectator`, so reconnect, disconnect, game exit and trash talk use the same paths as for players. `API.canPlayerControlGame` keeps them from starting games or rounds and from adding AIs. When `cleanUpGame` removes a game, its spectators are sent back to the lobby.
- **`ai.ts`**: AI players are **Socket.IO clients that run inside the server process**. They connect back to `localhost:$PORT` and register and play through the same API as humans. `AIPlayerManager.spawnPlayer` creates them. `DeterministicAIPlayer` (the one in use) picks the action that maximizes immediate hand points; `RandomAIPlayer` also exists. The AIs act after a 1–3 s random delay, and the first AI starts the next round when no active humans are left.

### Client (`client/src/`)

`App.js` decides which screen to show from its state flags: `RegistrationPage` → `GameLobby` → `Game` (which contains `GameWaitingArea` / `GameScreen` / `TableTop` / `Scorecard` / `GameLog`). Every component talks to the server through the singleton socket wrapper in `api.js` (`emitToServer`, `setCallbackOnMessage`, `removeCallbackOnMessage`) and registers its own listeners. **Event names are plain strings duplicated between `src/api.ts`, `src/ai.ts` and the client components.** When you add or rename an event, update all of them. `karten.js` maps server card names (`suit + rank`, e.g. `"RosenAs"`) to the images in `karten/`.

## Game rules as implemented (`game.ts`)

- 36-card Swiss deck (Schilten/Eicheln/Rosen/Schellen × Sechs…As), 2–11 players, 3 tokens each. A player with 0 tokens is inactive, and the game ends when fewer than 2 are active.
- Card values: As 11, Banner/Under/Ober/König 10, number cards their face value. Hand value = the highest single-suit sum. Three of a kind = 30.5. Three Asses = **Feuer** (33). Single suit worth exactly 31 = **Hosenabe**.
- On your turn: `Switch` (one card with the table) or `SwitchAll`. During the first lap you can also `Losen` (pass); after that you can `Chlopfen` (knock, the "Stopp" in the official rules). Knocking gives everyone else exactly one more turn, then the round ends. `Hosenaben`/`Feuer` can be played at any time, even out of turn, if you hold the combo, and they end the round immediately.
- How a round ends: after Chlopf or Hosenabe, every player with the lowest points loses a token. After Feuer, everyone except the Feuer player loses a token.
- Known differences from the official rules (see `todo.txt`): the dealer can't swap their hand for fresh cards, `SwitchAll` is allowed from the start, there's no "schwimmen", and there's no penalty for a missed Hosenabe.

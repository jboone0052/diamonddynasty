# Baseball Franchise Simulator Starter Repository

A monorepo starter for a cross-platform baseball franchise simulator targeting:

- Web
- iOS
- Android

Tech choices:

- Expo + React Native + Expo Router
- TypeScript
- Zustand
- Zod
- Shared `game-core` package
- Shared `ui`, `content`, and `config` packages

## Status

This is a **starter repository scaffold**, not a finished game.
It includes:

- monorepo layout
- package wiring
- core schemas and types
- starter world generation
- save/load abstraction
- stub simulation/actions
- starter Expo app screens

## Structure

```text
/apps
  /game-app
/packages
  /game-core
  /ui
  /content
  /config
```

## Quick start

1. Install dependencies

```bash
npm install
```

2. Run the app

```bash
npm run dev
```

3. Run tests

```bash
npm run test
```

## Next implementation priorities

1. Flesh out world generation in `packages/game-core/src/factories`
2. Replace stub simulation in `packages/game-core/src/sim`
3. Wire real persistence for native/web
4. Expand UI screens in `apps/game-app/src/screens`
5. Add balancing values in `packages/config`

## Notes

- The simulation is intentionally stubbed so you can iterate safely.
- The packages are designed so multiplayer can be added later with a server-authoritative simulation.

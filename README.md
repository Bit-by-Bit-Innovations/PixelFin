# PixelFin

A retro pixel-art finance dashboard that turns money management into a tiny game. Instead of endless spreadsheets or boring graphs, you get: pixel coins 🪙, a 16-bit piggy bank 🐷, and a little virtual world that reacts to how you save or spend. Think Tamagotchi × budget tracker × Game Boy.

## Getting started (Expo SDK 51 + TypeScript + tailwind-rn)

Prereqs: Node 18+, Yarn or npm.

- Install dependencies
  - Yarn: `yarn install`
  - npm: `npm install`
- Generate Tailwind styles (tailwind-rn)
  - `yarn tailwind:gen` (or `npx tailwind-rn`) – creates/updates `styles.json`
- Start the app with a tunnel (good for devices)
  - `yarn start:tunnel`

When the Expo Dev Tools open, scan the QR to run on your device or press i / a to open on iOS simulator / Android emulator.

## Tech and configuration

- Expo SDK 51 (managed)
- TypeScript (strict)
- Tailwind RN via `tailwind-rn`
- Fonts
  - Balance: Google VT323
  - Buttons/labels: Google Press Start 2P
- Baseline deps also include: AsyncStorage, LinearGradient, Haptics, Lottie
- EAS build profiles are configured in `eas.json` (development, preview, production)

## Design defaults (will be used in upcoming features)

- Currency: USD
- One-tap increments:
  - Savings: +$1
  - Expense: -$1

These constants live in `src/constants.ts` if you want to reference them.

## Tailwind RN

- Config: `tailwind.config.js`
- Generated mapping: `styles.json` (committed so the app runs immediately)
- Provider wiring: see `App.tsx`

If you change the Tailwind config, run `yarn tailwind:gen` to regenerate `styles.json`.

## Assets

- App icon and splash placeholders live in `assets/` and are wired in `app.json`
- Pixel-style Lottie placeholders are available for future animations:
  - `assets/lottie/idle.json`
  - `assets/lottie/happy.json`
  - `assets/lottie/sad.json`

## Notes

This repo is set up to run with `expo start --tunnel` and should work out of the box. Future tasks will add the actual finance interactions, game loop, and UI.

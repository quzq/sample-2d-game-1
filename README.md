# sample-2d-game-1

A small Web Canvas jump game.

The rule for this repository is simple: the game must run from the top-level README.
No game engine. No build step. No ceremony, because apparently we are still pretending software can be simple.

## Run

Clone this repository and open `index.html` in a browser.

```bash
git clone https://github.com/quzq/sample-2d-game-1.git
cd sample-2d-game-1
```

Then either open `index.html` directly, or run a tiny local server:

```bash
python3 -m http.server 5173
```

Open:

```txt
http://localhost:5173
```

## Controls

```txt
Left / A   : move left
Right / D  : move right
Space / Z  : jump
R          : restart after game over
P          : pause
```

## Game

Survive as long as possible.
Jump over blocks, collect coins, and avoid getting pushed off the screen.

The canvas logical resolution is fixed at **256x240**.
This is intentional. The sample is designed as a small old-style Canvas game that can later be wrapped by `capacitor-canvas-game-kit`.

## Current goal

This repository is the first sample game for testing the mobile-app wrapper flow:

```txt
Web Canvas game
  -> confirm in browser
  -> wrap with capacitor-canvas-game-kit
  -> build Android/iOS app
  -> confirm on device
```

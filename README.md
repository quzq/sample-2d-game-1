# sample-2d-game-1

A small Web Canvas jump game.

[▶ Play the game](https://quzq.github.io/sample-2d-game-1/)

The rule for this repository is simple: the game should be playable from the top of this README.
GitHub README files cannot run the JavaScript game inline, so the top link opens the GitHub Pages build.

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

## Local run

```bash
git clone https://github.com/quzq/sample-2d-game-1.git
cd sample-2d-game-1
python3 -m http.server 5173
```

Open:

```txt
http://localhost:5173
```

## Current goal

This repository is the first sample game for testing the mobile-app wrapper flow:

```txt
Web Canvas game
  -> confirm in browser
  -> wrap with capacitor-canvas-game-kit
  -> build Android/iOS app
  -> confirm on device
```

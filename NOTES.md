# Cozy Rapids — Notes

## Decisions (ChatGPT writes here)

- Task A: Low-resolution 360px-max-tall WebGL canvas (nearest/pixelated via CSS); local Three.js only; open-water testing first. Auto throttle + left-side swipe, keyboard or optional device-tilt steer. Boats and wakes use procedural geometry/points until art assets exist.
- Boat kinematics use arcade acceleration and inertial velocity blending rather than expensive rigid-body simulation. Wave displacement uses a 64x64 local mesh and the same analytic function for boat bob.
- No service worker: reserved for Claude as required in README. Portrait playable, landscape preferred.

## Known bugs / TODO

## Playtest feedback (owner + Claude write here)

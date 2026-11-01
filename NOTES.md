# Cozy Rapids — Notes

## Decisions (ChatGPT writes here)

- Task A: Low-resolution 360px-max-tall WebGL canvas (nearest/pixelated via CSS); local Three.js only; open-water testing first. Auto throttle + left-side swipe, keyboard or optional device-tilt steer. Boats and wakes use procedural geometry/points until art assets exist.
- Boat kinematics use arcade acceleration and inertial velocity blending rather than expensive rigid-body simulation. Wave displacement uses a 64x64 local mesh and the same analytic function for boat bob.
- No service worker: reserved for Claude as required in README. Portrait playable, landscape preferred.

- Task B: Sunny Cove is a closed Catmull-Rom path; buoy-marked navigable area is bounded by soft corrective side pushes. 12 ordered checkpoint sectors per lap prevent shortcutting across the start. Two ramps launch with ballistic motion; midair steering accumulates trick spin, rewarding a complete rotation with boost. Respawning blue pickups refill boost pips. Solo three-lap finish uses a temporary results overlay (expanded in Task C).
- Task B scope: track records for future maps are placeholders, not playable yet; only Sunny Cove is instantiated. Keyboard Space or BOOST button consumes pickups; holding BOOST consumes subsequent pips as effects expire.

## Known bugs / TODO

## Playtest feedback (owner + Claude write here)

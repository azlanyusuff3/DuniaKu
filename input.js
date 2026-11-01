// Touch drag, keyboard and optional device tilt. Nothing requires a network or library.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function createInput(canvas, boostButton, tiltButton) {
  const keys = new Set();
  let pointerId = null, anchorX = 0, pointerSteer = 0;
  let tiltEnabled = false, tiltSteer = 0, boostPointer = false;
  let disposed = false;
  function down(e) {
    if (pointerId !== null || e.clientX > window.innerWidth * .55) return;
    pointerId = e.pointerId; anchorX = e.clientX; pointerSteer = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function move(e) {
    if (e.pointerId === pointerId) pointerSteer = clamp((e.clientX - anchorX) / 66, -1, 1);
  }
  function up(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null; pointerSteer = 0;
  }
  function keydown(e) {
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code)) e.preventDefault();
    keys.add(e.code);
  }
  function keyup(e) { keys.delete(e.code); }
  function orientation(e) {
    if (typeof e.gamma === "number") tiltSteer = clamp(e.gamma / 24, -1, 1);
  }
  async function setTilt(value) {
    if (value && typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      try { if (await DeviceOrientationEvent.requestPermission() !== "granted") value = false; }
      catch (_) { value = false; }
    }
    tiltEnabled = !!value;
    if (tiltButton) {
      tiltButton.textContent = "Tilt: " + (tiltEnabled ? "ON" : "OFF");
      tiltButton.setAttribute("aria-pressed", String(tiltEnabled));
    }
    return tiltEnabled;
  }
  function boostDown(e) { e.preventDefault(); boostPointer = true; }
  function boostUp(e) { e.preventDefault(); boostPointer = false; }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  window.addEventListener("keydown", keydown, {passive:false});
  window.addEventListener("keyup", keyup);
  window.addEventListener("deviceorientation", orientation);
  window.addEventListener("blur", () => { keys.clear(); pointerId = null; pointerSteer = 0; boostPointer = false; });
  if (boostButton) {
    boostButton.addEventListener("pointerdown", boostDown);
    boostButton.addEventListener("pointerup", boostUp);
    boostButton.addEventListener("pointercancel", boostUp);
    boostButton.addEventListener("pointerleave", boostUp);
  }
  if (tiltButton) tiltButton.addEventListener("click", () => { setTilt(!tiltEnabled); });
  return {
    read() {
      const keyboard = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
                       (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
      return {steer:clamp(keyboard || (pointerId !== null ? pointerSteer : tiltEnabled ? tiltSteer : 0), -1, 1),
              boost:keys.has("Space") || boostPointer};
    },
    setTilt, get tiltEnabled() { return tiltEnabled; },
    dispose() { disposed = true; void disposed; }
  };
}
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

// Single-character keys arrive uppercased while Shift is held; named keys ('F5',
// 'ArrowLeft') must be left alone.
function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

function isLocalhost() {
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' || host === '';
}

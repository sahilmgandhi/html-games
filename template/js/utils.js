function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Client coords must be divided by the CSS/backing-store ratio, because the canvas is
// CSS-scaled to fit the window while its backing store stays at CONFIG.VIEWPORT size.
function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

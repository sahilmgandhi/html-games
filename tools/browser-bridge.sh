#!/bin/bash
# browser-bridge.sh — trusted host-side bridge for decoupled agent dev.
# Runs Chrome CDP (:9222) + static server (:8081) + vite (:3001) on 127.0.0.1 only.
# Agents in `opencode-decoupled` (container, --network none) reach these via
# chrome-devtools MCP (host) and file reads — never by running servers inside
# the container. Run this OUTSIDE the sandbox, from a normal shell.
# Usage: bash tools/browser-bridge.sh [start|stop|status|logs|restart]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="$ROOT/.chrome-profile"
GAME_3D="$ROOT/age-of-war-3d"
CHROME_CANDIDATES=(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
)
CHROME_BIN=""
for c in "${CHROME_CANDIDATES[@]}"; do
  if [[ -x "$c" ]]; then CHROME_BIN="$c"; break; fi
done
if [[ -z "$CHROME_BIN" ]]; then CHROME_BIN="$(command -v google-chrome || command -v chromium || true)"; fi

CHROME_PID=/tmp/game-bridge-chrome.pid
SERVE_PID=/tmp/game-bridge-8081.pid
VITE_PID=/tmp/game-bridge-3001.pid

alive() { kill -0 "$1" 2>/dev/null; }
port_open() { curl -sf -o /dev/null --max-time 2 "$1" 2>/dev/null; }

chrome_up() { port_open http://127.0.0.1:9222/json/version; }
serve_up() { port_open http://127.0.0.1:8081/; }
vite_up() { port_open http://127.0.0.1:3001/; }

start_chrome() {
  if chrome_up; then echo "chrome :9222 already up"; return 0; fi
  if [[ -z "$CHROME_BIN" ]]; then echo "Error: no Chrome found" >&2; return 1; fi
  mkdir -p "$PROFILE"
  # shellcheck disable=SC2086
  nohup "$CHROME_BIN" \
    --headless=new --no-sandbox --disable-dev-shm-usage \
    --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 \
    --user-data-dir="$PROFILE" \
    --no-first-run --no-default-browser-check \
    --disable-extensions --disable-sync \
    about:blank > /tmp/game-bridge-chrome.log 2>&1 &
  echo $! > "$CHROME_PID"
  for _ in $(seq 1 30); do chrome_up && { echo "chrome :9222 up ($CHROME_BIN)"; return 0; }; sleep 0.5; done
  echo "Error: chrome did not come up, see /tmp/game-bridge-chrome.log" >&2; return 1
}

start_serve() {
  if serve_up; then echo "serve :8081 already up"; return 0; fi
  nohup python3 -m http.server 8081 --bind 127.0.0.1 --directory "$ROOT" \
    > /tmp/game-bridge-8081.log 2>&1 &
  echo $! > "$SERVE_PID"
  for _ in $(seq 1 20); do serve_up && { echo "serve :8081 up ($ROOT)"; return 0; }; sleep 0.5; done
  echo "Error: :8081 did not come up" >&2; return 1
}

start_vite() {
  if [[ ! -d "$GAME_3D" ]]; then echo "vite: no age-of-war-3d, skip"; return 0; fi
  if vite_up; then echo "vite :3001 already up"; return 0; fi
  nohup npm run dev --prefix "$GAME_3D" -- --host 127.0.0.1 --port 3001 --strictPort \
    > /tmp/game-bridge-3001.log 2>&1 &
  echo $! > "$VITE_PID"
  for _ in $(seq 1 40); do vite_up && { echo "vite :3001 up"; return 0; }; sleep 0.5; done
  echo "Error: :3001 did not come up, see /tmp/game-bridge-3001.log" >&2; return 1
}

stop_one() {
  local pidfile="$1" name="$2"
  if [[ -f "$pidfile" ]]; then
    local pid; pid="$(cat "$pidfile")"
    if alive "$pid"; then kill "$pid" 2>/dev/null || true; sleep 0.5; fi
    rm -f "$pidfile"; echo "stopped $name ($pid)"
  fi
}

cmd="${1:-status}"
case "$cmd" in
  start) start_chrome; start_serve; start_vite ;;
  stop) stop_one "$VITE_PID" vite; stop_one "$SERVE_PID" serve; stop_one "$CHROME_PID" chrome ;;
  restart) "$0" stop || true; "$0" start ;;
  logs) tail -n 50 /tmp/game-bridge-chrome.log /tmp/game-bridge-8081.log /tmp/game-bridge-3001.log 2>/dev/null || true ;;
  status|*)
    chrome_up && echo "chrome :9222 OK" || echo "chrome :9222 DOWN"
    serve_up && echo "serve  :8081 OK" || echo "serve  :8081 DOWN"
    vite_up && echo "vite   :3001 OK" || echo "vite   :3001 DOWN"
    ;;
esac

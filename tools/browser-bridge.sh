#!/bin/bash
# browser-bridge.sh — trusted host-side bridge for decoupled agent dev.
# Runs Chrome CDP (:9222) + static server (:8081) + vite (:3001) on 127.0.0.1 only.
# Agents in `opencode-decoupled` (container, --network none) reach these via
# chrome-devtools MCP (host) and file reads — never by running servers inside
# the container. Run this OUTSIDE the sandbox, from a normal shell.
# Usage: bash tools/browser-bridge.sh [start|stop|status|logs|restart|tabs|quiet [--yes]]
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

PIDDIR="${BRIDGE_PIDDIR:-/tmp}"
CHROME_PORT="${BRIDGE_CHROME_PORT:-9222}"
SERVE_PORT="${BRIDGE_SERVE_PORT:-8081}"
VITE_PORT="${BRIDGE_VITE_PORT:-3001}"

CHROME_PID=$PIDDIR/game-bridge-chrome.pid
SERVE_PID=$PIDDIR/game-bridge-8081.pid
VITE_PID=$PIDDIR/game-bridge-3001.pid
CHROME_LOG=$PIDDIR/game-bridge-chrome.log
SERVE_LOG=$PIDDIR/game-bridge-8081.log
VITE_LOG=$PIDDIR/game-bridge-3001.log

alive() { kill -0 "$1" 2>/dev/null; }
port_open() { curl -sf -o /dev/null --max-time 2 "$1" 2>/dev/null; }
# Listener PIDs for a TCP port (deduped). Empty when lsof is missing or none listen.
pids_on_port() {
  command -v lsof >/dev/null 2>&1 || return 0
  lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null | grep -E '^[0-9]+$' | sort -nu || true
}

chrome_up() { port_open http://127.0.0.1:"$CHROME_PORT"/json/version; }
serve_up() { port_open http://127.0.0.1:"$SERVE_PORT"/; }
vite_up() { port_open http://127.0.0.1:"$VITE_PORT"/; }

# Port is up but pidfile is gone/stale (reboot clears /tmp): adopt the
# listener into the pidfile so stop works again. Prints adopted PIDs.
adopt_pids() {
  local pidfile="$1" port="$2"
  local pids first rest
  pids="$(pids_on_port "$port")"
  if [[ -z "$pids" ]]; then echo "pid unknown"; return 0; fi
  mkdir -p "$PIDDIR"
  first="$(echo "$pids" | head -n 1)"
  echo "$first" > "$pidfile"
  rest="$(echo "$pids" | tail -n +2 | tr '\n' ' ')"
  if [[ -n "${rest// }" ]]; then echo "adopted $first (also listening: ${rest% })";
  else echo "adopted $first"; fi
}

start_chrome() {
  if chrome_up; then echo "chrome :$CHROME_PORT already up ($(adopt_pids "$CHROME_PID" "$CHROME_PORT"))"; return 0; fi
  if [[ -z "$CHROME_BIN" ]]; then echo "Error: no Chrome found" >&2; return 1; fi
  mkdir -p "$PROFILE" "$PIDDIR"
  # shellcheck disable=SC2086
  nohup "$CHROME_BIN" \
    --headless=new --no-sandbox --disable-dev-shm-usage \
    --remote-debugging-port="$CHROME_PORT" --remote-debugging-address=127.0.0.1 \
    --user-data-dir="$PROFILE" \
    --no-first-run --no-default-browser-check \
    --disable-extensions --disable-sync \
    about:blank > "$CHROME_LOG" 2>&1 &
  echo $! > "$CHROME_PID"
  for _ in $(seq 1 30); do chrome_up && { echo "chrome :$CHROME_PORT up ($CHROME_BIN)"; return 0; }; sleep 0.5; done
  echo "Error: chrome did not come up, see $CHROME_LOG" >&2; return 1
}

start_serve() {
  if serve_up; then echo "serve :$SERVE_PORT already up ($(adopt_pids "$SERVE_PID" "$SERVE_PORT"))"; return 0; fi
  mkdir -p "$PIDDIR"
  nohup python3 -m http.server "$SERVE_PORT" --bind 127.0.0.1 --directory "$ROOT" \
    > "$SERVE_LOG" 2>&1 &
  echo $! > "$SERVE_PID"
  for _ in $(seq 1 20); do serve_up && { echo "serve :$SERVE_PORT up ($ROOT)"; return 0; }; sleep 0.5; done
  echo "Error: :$SERVE_PORT did not come up" >&2; return 1
}

start_vite() {
  if [[ ! -d "$GAME_3D" ]]; then echo "vite: no age-of-war-3d, skip"; return 0; fi
  if vite_up; then echo "vite :$VITE_PORT already up ($(adopt_pids "$VITE_PID" "$VITE_PORT"))"; return 0; fi
  mkdir -p "$PIDDIR"
  nohup npm run dev --prefix "$GAME_3D" -- --host 127.0.0.1 --port "$VITE_PORT" --strictPort \
    > "$VITE_LOG" 2>&1 &
  echo $! > "$VITE_PID"
  for _ in $(seq 1 40); do vite_up && { echo "vite :$VITE_PORT up"; return 0; }; sleep 0.5; done
  echo "Error: :$VITE_PORT did not come up, see $VITE_LOG" >&2; return 1
}

stop_one() {
  local pidfile="$1" name="$2" port="$3"
  local pids="" pid
  if [[ -f "$pidfile" ]]; then
    pid="$(cat "$pidfile" 2>/dev/null || true)"
    if [[ "$pid" =~ ^[0-9]+$ ]] && [[ "$pid" != "$$" ]]; then pids="$pid"; fi
  fi
  for pid in $(pids_on_port "$port"); do
    if [[ ! "$pid" =~ ^[0-9]+$ ]] || [[ "$pid" == "$$" ]]; then continue; fi
    if [[ " $pids " != *" $pid "* ]]; then pids="$pids $pid"; fi
  done
  if [[ -z "${pids// }" ]]; then
    rm -f "$pidfile"; echo "$name :$port already free"; return 0
  fi
  for pid in $pids; do alive "$pid" && kill "$pid" 2>/dev/null || true; done
  sleep 1
  for pid in $pids; do alive "$pid" && kill -9 "$pid" 2>/dev/null || true; done
  sleep 0.5
  local dead="" left=""
  for pid in $pids; do alive "$pid" && left="$left $pid" || dead="$dead $pid"; done
  rm -f "$pidfile"
  if [[ -n "${left// }" ]]; then
    echo "stopped $name :$port (killed:${dead:- none}; still alive:${left})" >&2; return 1
  fi
  echo "stopped $name :$port (pids:$dead)"
}

stop_all() {
  local rc=0
  stop_one "$VITE_PID" vite "$VITE_PORT" || rc=1
  stop_one "$SERVE_PID" serve "$SERVE_PORT" || rc=1
  stop_one "$CHROME_PID" chrome "$CHROME_PORT" || rc=1
  return $rc
}

list_tabs() {
  if ! chrome_up; then echo "tabs: chrome :$CHROME_PORT DOWN (no tab list)"; return 0; fi
  curl -sf --max-time 2 http://127.0.0.1:"$CHROME_PORT"/json/list 2>/dev/null | python3 -c \
    'import json,sys
try: tabs = json.load(sys.stdin)
except Exception: sys.exit("tabs: could not parse tab list")
pages = [t for t in tabs if t.get("type") == "page"]
print("tabs: " + str(len(pages)) + " page(s)")
for t in pages: print("- " + str(t.get("title", "?")) + " :: " + str(t.get("url", "?")))'
}

cmd_status() {
  local pids
  pids="$(pids_on_port "$CHROME_PORT" | tr '\n' ' ')"
  chrome_up && echo "chrome :$CHROME_PORT OK${pids:+ (pids: ${pids% })}" || echo "chrome :$CHROME_PORT DOWN"
  pids="$(pids_on_port "$SERVE_PORT" | tr '\n' ' ')"
  serve_up && echo "serve  :$SERVE_PORT OK${pids:+ (pids: ${pids% })}" || echo "serve  :$SERVE_PORT DOWN"
  pids="$(pids_on_port "$VITE_PORT" | tr '\n' ' ')"
  vite_up && echo "vite   :$VITE_PORT OK${pids:+ (pids: ${pids% })}" || echo "vite   :$VITE_PORT DOWN"
}

cmd_quiet() {
  cmd_status
  list_tabs
  if [[ "${1:-}" != "--yes" && "${1:-}" != "-y" ]]; then
    read -r -p "Close bridge (chrome+serve+vite)? [y/N] " ans || ans=""
    [[ "$ans" == [Yy]* ]] || { echo "kept bridge up"; return 0; }
  fi
  stop_all
}

usage() {
  cat <<'EOF'
Usage: browser-bridge.sh [command] [options]

Commands:
  start          Start chrome, serve, and vite
  stop           Stop chrome, serve, and vite
  restart        Stop, then start
  status         Show whether each service is up
  logs           Show recent log output
  tabs           Show status plus open browser tabs
  quiet [--yes]  Show status and tabs, then stop (skip prompt with --yes)
  help           Show this help

Examples:
  browser-bridge.sh start
  browser-bridge.sh tabs
  browser-bridge.sh quiet --yes
EOF
}

cmd="${1:-help}"
case "$cmd" in
  start) start_chrome; start_serve; start_vite ;;
  stop) stop_all ;;
  restart)
    "$0" stop || true
    for _ in $(seq 1 20); do
      if ! chrome_up && ! serve_up && ! vite_up; then break; fi
      sleep 0.5
    done
    "$0" start ;;
  logs) tail -n 50 "$CHROME_LOG" "$SERVE_LOG" "$VITE_LOG" 2>/dev/null || true ;;
  tabs) cmd_status; list_tabs ;;
  quiet) shift; cmd_quiet "${1:-}" ;;
  status) cmd_status ;;
  help|--help|-h) usage ;;
  *) echo "Error: unknown command '$cmd'" >&2; usage >&2; exit 1 ;;
esac

#!/bin/bash
# bridge-orphan.test.sh — stop/restart must work when pidfiles are missing.
# Hermetic: BRIDGE_PIDDIR + fake curl/lsof on PATH + owned `sleep` victims.
# Never touches :9222/:8081/:3001 or /tmp pidfiles.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRIDGE="$ROOT/tools/browser-bridge.sh"
pass=0; fail=0
ok() { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL $1"; }

TMP="$(mktemp -d)"; trap 'kill "$V1" "$V2" 2>/dev/null || true; rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/pids"
CHROME_PORT=19222; SERVE_PORT=18081; VITE_PORT=13001

cat > "$TMP/bin/curl" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$TMP/bin/lsof" <<'EOF'
#!/bin/sh
port=""
for a in "$@"; do case "$a" in *tiTCP:*) port="${a##*tiTCP:}";; esac; done
if [ "$port" = "$FAKE_SERVE_PORT" ] && [ -n "${FAKE_VICTIM_PID:-}" ]; then
  echo "$FAKE_VICTIM_PID"; exit 0
fi
exit 1
EOF
chmod +x "$TMP/bin/curl" "$TMP/bin/lsof"

run_bridge() { # args...
  env BRIDGE_PIDDIR="$TMP/pids" BRIDGE_CHROME_PORT="$CHROME_PORT" \
    BRIDGE_SERVE_PORT="$SERVE_PORT" BRIDGE_VITE_PORT="$VITE_PORT" \
    PATH="$TMP/bin:$PATH" bash "$BRIDGE" "$@"
}

# Phase A: start must adopt orphan PID into PIDDIR instead of bare "already up".
sleep 300 & V1=$!
disown "$V1" 2>/dev/null || true
export FAKE_SERVE_PORT="$SERVE_PORT" FAKE_VICTIM_PID="$V1"
out="$(run_bridge start 2>&1)"
if [[ -f "$TMP/pids/game-bridge-8081.pid" ]] && [[ "$(cat "$TMP/pids/game-bridge-8081.pid")" == "$V1" ]]; then ok; else bad "start did not adopt orphan serve PID ($V1) into PIDDIR (out: $out)"; fi

# Phase B: stop with pidfiles missing must still kill listener by port.
rm -f "$TMP/pids"/*.pid
sleep 300 & V2=$!
disown "$V2" 2>/dev/null || true
export FAKE_VICTIM_PID="$V2"
out="$(run_bridge stop 2>&1)"
sleep 0.5
if kill -0 "$V2" 2>/dev/null; then bad "stop left orphan listener $V2 alive (out: $out)"; else ok; fi
if [[ -n "$out" ]]; then ok; else bad "stop printed nothing with missing pidfiles"; fi

echo "pass=$pass fail=$fail"
[[ "$fail" == 0 ]]

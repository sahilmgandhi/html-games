#!/bin/bash
# Verifies --help for tools/ scripts without starting any servers.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
pass=0; fail=0
check() { # name, expected_exit, command...
  local name="$1" want="$2"; shift 2
  local out; out="$("$@" 2>&1)"; local got="$?"
  if [[ "$got" == "$want" && "$out" == *"Usage:"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL $name (exit $got, want $want): $out" | head -5; fi
}
check "bridge bare" 0 bash "$ROOT/tools/browser-bridge.sh"
check "bridge --help" 0 bash "$ROOT/tools/browser-bridge.sh" --help
check "bridge -h" 0 bash "$ROOT/tools/browser-bridge.sh" -h
check "bridge help" 0 bash "$ROOT/tools/browser-bridge.sh" help
check "new-game --help" 0 node "$ROOT/tools/new-game.js" --help
out="$(bash "$ROOT/tools/browser-bridge.sh" bogus 2>&1)"; got="$?"
if [[ "$got" == 1 && "$out" == *"unknown command"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL bridge bogus (exit $got): $out" | head -5; fi
echo "pass=$pass fail=$fail"
[[ "$fail" == 0 ]]

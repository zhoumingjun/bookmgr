#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Environment → Docker Compose config
env_compose() {
  local env="$1"; shift
  local dir="$PROJECT_ROOT/ops/cd/$env"
  local project_name

  case "$env" in
    prod) project_name="bookmgr" ;;
    test) project_name="bookmgr-test" ;;
    *)    echo "Unknown environment: $env"; exit 1 ;;
  esac

  docker compose -f "$dir/docker-compose.yml" -p "$project_name" "$@"
}

# Wait for Kong health check (gateway ready = all services ready)
wait_healthy() {
  local env="$1"
  local port
  case "$env" in
    prod) port=8000 ;;
    test) port=9000 ;;
  esac

  echo "Waiting for $env environment (port $port) to become healthy..."
  local retries=60
  while [ $retries -gt 0 ]; do
    if curl -sf "http://localhost:$port/healthz" >/dev/null 2>&1; then
      echo "$env environment is healthy."
      return 0
    fi
    retries=$((retries - 1))
    sleep 2
  done
  echo "ERROR: $env environment did not become healthy in time."
  return 1
}

cmd_up() {
  local env="$1"
  echo "Starting $env environment..."
  env_compose "$env" up -d --build
  wait_healthy "$env"
}

cmd_down() {
  local env="$1"
  echo "Stopping $env environment..."
  if [ "$env" = "test" ]; then
    env_compose "$env" down -v
  else
    env_compose "$env" down
  fi
}

cmd_rebuild() {
  local env="$1"
  echo "Rebuilding $env environment..."
  cmd_down "$env" || true
  env_compose "$env" build --no-cache
  cmd_up "$env"
}

cmd_logs() {
  local env="$1"
  shift
  env_compose "$env" logs -f "$@"
}

cmd_run_api() {
  echo "Running API BDD tests..."
  cd "$PROJECT_ROOT/backend"
  go test -tags bdd -v ./test/bdd/... -count=1
}

cmd_run_e2e() {
  echo "Running E2E BDD tests..."
  cd "$PROJECT_ROOT/e2e"
  npx playwright test
}

cmd_run() {
  local env="$1"
  if [ "$env" != "test" ]; then
    echo "ERROR: 'run' command is only for test environment."
    exit 1
  fi

  cmd_up test

  local exit_code=0
  cmd_run_api  || exit_code=$?
  cmd_run_e2e  || exit_code=$?

  cmd_down test
  exit $exit_code
}

cmd_status() {
  echo "=== prod environment ==="
  env_compose prod ps 2>/dev/null || echo "(not running)"
  echo ""
  echo "=== test environment ==="
  env_compose test ps 2>/dev/null || echo "(not running)"
}

# --- Main ---
if [ $# -lt 1 ]; then
  echo "Usage: $0 <env> <command> [args...]"
  echo "  env:     prod | test"
  echo "  command: up | down | rebuild | logs | run | run-api | run-e2e | status"
  echo ""
  echo "  $0 status              — show both environments"
  echo "  $0 prod up             — start prod (port 8000)"
  echo "  $0 test up             — start test (port 9000, clean DB)"
  echo "  $0 test run            — up → API BDD + E2E BDD → down"
  echo "  $0 test run-api        — run API BDD only"
  echo "  $0 test run-e2e        — run E2E BDD only"
  exit 1
fi

# Handle 'status' as a special case (no env required)
if [ "$1" = "status" ]; then
  cmd_status
  exit 0
fi

ENV="$1"
CMD="${2:-up}"
shift 2 || true

case "$CMD" in
  up)       cmd_up "$ENV" ;;
  down)     cmd_down "$ENV" ;;
  rebuild)  cmd_rebuild "$ENV" ;;
  logs)     cmd_logs "$ENV" "$@" ;;
  run)      cmd_run "$ENV" ;;
  run-api)  cmd_run_api ;;
  run-e2e)  cmd_run_e2e ;;
  status)   cmd_status ;;
  *)        echo "Unknown command: $CMD"; exit 1 ;;
esac

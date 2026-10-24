#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' "Docker is required. Install Docker Desktop and try again." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' "Docker Compose is required. Install or enable the Compose plugin and try again." >&2
  exit 1
fi

if [ ! -f .env ]; then
  printf '%s\n' "Missing .env. Copy .env.docker.example to .env, set POSTGRES_PASSWORD, then run ./run.sh again." >&2
  exit 1
fi

docker compose up --build

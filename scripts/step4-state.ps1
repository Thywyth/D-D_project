#!/usr/bin/env pwsh
# Step 4: Frontend State Engine — Git Automation Script
# Run from the project root: .\scripts\step4-state.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 4: Frontend State Engine ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    # Services & Utils
    "frontend/src/services/api.ts",
    "frontend/src/services/socket.ts",
    "frontend/src/utils/crypto.ts",
    # Stores
    "frontend/src/stores/authStore.ts",
    "frontend/src/stores/sessionStore.ts",
    "frontend/src/stores/characterStore.ts",
    "frontend/src/stores/diceStore.ts",
    "frontend/src/stores/mapStore.ts",
    "frontend/src/stores/audioStore.ts",
    "frontend/src/stores/treeStore.ts",
    "frontend/src/stores/syncStore.ts",
    # Hooks
    "frontend/src/hooks/useSocket.ts",
    "frontend/src/hooks/useOnline.ts",
    "frontend/src/hooks/useRBAC.ts",
    "frontend/src/hooks/useSync.ts"
)

Write-Host "Verifying $($requiredFiles.Count) files..." -ForegroundColor Yellow
$missing = @()
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (-not (Test-Path $fullPath)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "ERROR: Missing files:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
Write-Host "All $($requiredFiles.Count) files present." -ForegroundColor Green

# TypeScript check
Write-Host ""
Write-Host "Type-checking frontend..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "frontend")
node ./node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend type-check failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Frontend compiles clean." -ForegroundColor Green

# Git add and commit
Write-Host ""
Write-Host "Staging files for git commit..." -ForegroundColor Yellow
git add -A
git status

Write-Host ""
Write-Host "Committing Step 4..." -ForegroundColor Yellow
git commit -m "feat: implement frontend state engine — Zustand + offline-first sync

Services (3):
- api.ts: Typed fetch wrapper with JWT auto-injection from localStorage
  - Offline detection, ApiRequestError class, typed GET/POST/PATCH/DELETE
- socket.ts: Socket.IO client singleton with typed events
  - Lazy init, WebSocket-first, auto-reconnect (10 attempts)
- crypto.ts: Dice signature validation, D&D modifier formatting

Zustand Stores (8):
- authStore: JWT persist (localStorage), register/login/logout/fetchMe
- sessionStore: Room CRUD, join/leave, time advance, player code gen
  - Caches rooms to IndexedDB on fetch
- characterStore: RBAC-aware offline-first with optimistic UI
  - Mutations: apply to Zustand immediately, send via Socket.IO or REST
  - Offline: queue to Dexie syncQueue with endpoint + payload
  - Fallback: serve from IndexedDB cache when API unreachable
- diceStore: Roll via socket (real-time) or REST, history (max 50)
- mapStore: Marker CRUD with optimistic updates, IndexedDB fallback
- audioStore: Ambient/SFX state (preset, volume, play/stop)
- treeStore: Tree/node CRUD, fog-of-war, notes, IndexedDB cache
- syncStore: Pending queue count, syncing state, error tracking

Custom Hooks (4):
- useSocket: Socket.IO lifecycle (connect/auth/reconnect)
  - Registers all domain event listeners, wires to Zustand stores
- useOnline: navigator.onLine reactive listener (SSR-safe)
- useRBAC: Client-side field validation using shared RBAC matrix
  - canEdit(), getCategory(), partitionFields(), fieldClass()
- useSync: FIFO sync queue processor
  - On reconnect: reads Dexie queue, replays mutations via REST
  - Periodic pending count refresh (10s interval)"

Write-Host ""
Write-Host "=== Step 4 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 5 — UI Phase 1 (Auth, Lobby, Layout, Dice)" -ForegroundColor Gray

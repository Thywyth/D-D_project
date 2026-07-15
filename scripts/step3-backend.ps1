#!/usr/bin/env pwsh
# Step 3: Backend Architecture — Git Automation Script
# Run from the project root: .\scripts\step3-backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 3: Backend Architecture ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    # Middleware
    "backend/src/middleware/auth.ts",
    "backend/src/middleware/rbac.ts",
    # Services
    "backend/src/services/conflictResolver.ts",
    "backend/src/services/codeGenerator.ts",
    "backend/src/services/ageCalculator.ts",
    "backend/src/services/rng.ts",
    # Utils
    "backend/src/utils/rbacMatrix.ts",
    "backend/src/utils/validators.ts",
    # Controllers
    "backend/src/controllers/authController.ts",
    "backend/src/controllers/roomController.ts",
    "backend/src/controllers/characterController.ts",
    "backend/src/controllers/mapController.ts",
    "backend/src/controllers/treeController.ts",
    "backend/src/controllers/diceController.ts",
    # Routes
    "backend/src/routes/auth.ts",
    "backend/src/routes/rooms.ts",
    "backend/src/routes/characters.ts",
    "backend/src/routes/maps.ts",
    "backend/src/routes/trees.ts",
    "backend/src/routes/dice.ts",
    # Socket Handlers
    "backend/src/sockets/index.ts",
    "backend/src/sockets/roomHandlers.ts",
    "backend/src/sockets/characterHandlers.ts",
    "backend/src/sockets/inventoryHandlers.ts",
    "backend/src/sockets/mapHandlers.ts",
    "backend/src/sockets/treeHandlers.ts",
    "backend/src/sockets/audioHandlers.ts",
    "backend/src/sockets/diceHandlers.ts"
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
Write-Host "Type-checking backend..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "backend")
node ./node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend type-check failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Backend compiles clean." -ForegroundColor Green

# Git add and commit
Write-Host ""
Write-Host "Staging files for git commit..." -ForegroundColor Yellow
git add -A
git status

Write-Host ""
Write-Host "Committing Step 3..." -ForegroundColor Yellow
git commit -m "feat: implement backend architecture — REST API + Socket.IO + services

Middleware:
- auth.ts: JWT auth for Express (Bearer) and Socket.IO (handshake)
  - Request augmentation, token generation (7d expiry)
- rbac.ts: Field-level RBAC guard using shared matrix
  - getUserRoleInRoom(), filterUpdateByRBAC(), requireRole() factory

Services:
- conflictResolver.ts: LWW with RBAC override (field + batch resolution)
- codeGenerator.ts: Crypto room codes (6ch) + player codes (8ch)
  - Collision retry, no confusing chars (0/O/1/I excluded)
- ageCalculator.ts: Auto-aging for characters + tree nodes on time advance
  - 360-day fantasy calendar, full-year threshold
- rng.ts: crypto.randomInt() dice roller + HMAC-SHA256 signatures
  - Standard dice d4-d20, percentile d100 (00-90 step 10)

Controllers (6):
- authController: register, login, getMe
- roomController: create, list, get, join, generate-code, advance-time
- characterController: create, get, list, update (RBAC-filtered), status
- mapController: add/list/update/delete markers, set map image
- treeController: create/list/get tree, add/update/delete/toggle nodes, notes
- diceController: server-verified crypto roll

Routes (6): /api/{auth,rooms,characters,maps,trees,dice}

Socket.IO Handlers (8):
- roomHandlers: join/leave (player count broadcast), time advance
- characterHandlers: RBAC-filtered real-time updates, sync request
- inventoryHandlers: Atomic transfers via MongoDB transactions
- mapHandlers: Real-time marker CRUD, map image broadcast
- treeHandlers: Node CRUD, visibility toggle, private player notes
- audioHandlers: DM-controlled ambient + SFX broadcast
- diceHandlers: Real-time crypto dice rolls broadcast to room

Bootstrap (updated):
- All 6 route modules wired
- Socket.IO event registry initialized
- 404 handler, global error handler
- Enhanced health check with route listing"

Write-Host ""
Write-Host "=== Step 3 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 4 — Frontend State Engine (Zustand stores, sync queue)" -ForegroundColor Gray

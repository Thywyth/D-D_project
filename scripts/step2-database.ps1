#!/usr/bin/env pwsh
# Step 2: Database Layer — Git Automation Script
# Run from the project root: .\scripts\step2-database.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 2: Database Layer ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    "shared/types/user.ts",
    "shared/types/room.ts",
    "shared/types/character.ts",
    "shared/types/map.ts",
    "shared/types/tree.ts",
    "shared/types/notebook.ts",
    "shared/types/dice.ts",
    "shared/types/rbac.ts",
    "shared/types/socket-events.ts",
    "shared/types/index.ts",
    "backend/src/config/db.ts",
    "backend/src/models/User.ts",
    "backend/src/models/Room.ts",
    "backend/src/models/Character.ts",
    "backend/src/models/MapMarker.ts",
    "backend/src/models/FamilyTree.ts",
    "backend/src/models/Notebook.ts",
    "frontend/src/db/dexie.ts"
)

Write-Host "Verifying files..." -ForegroundColor Yellow
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

# Run TypeScript type-check for shared package
Write-Host ""
Write-Host "Type-checking shared package..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "shared")
node ./node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Shared package type-check failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Shared types compile clean." -ForegroundColor Green

# Run TypeScript type-check for backend
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

# Run TypeScript type-check for frontend
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
Write-Host "Committing Step 2..." -ForegroundColor Yellow
git commit -m "feat: implement database layer — Mongoose schemas + Dexie.js + shared types

Shared Types (@dnd-vtt/shared):
- user.ts: IUser, IUserPublic, auth payloads, JWT structure
- room.ts: IRoom with player slots, game time, audio presets
- character.ts: Full D&D 5e sheet (ability scores, skills, saves, inventory)
- map.ts: IMapMarker with percentage coordinates (cross-device)
- tree.ts: IFamilyTree with nodes, hidden flag (fog-of-war), player notes
- notebook.ts: INotebook with Tiptap JSON document structure
- dice.ts: IDiceRoll, HMAC-signed results, value ranges (d100 percentile)
- rbac.ts: Canonical RBAC matrix + checkRBAC() enforcement function
- socket-events.ts: Full client/server event type definitions
- index.ts: Barrel export for all shared types

Backend Mongoose Models:
- User: bcrypt pre-save hashing, password comparison, select:false
- Room: Player slots, game time (Forgotten Realms), audio presets (UA names)
- Character: All RBAC-classified fields, sub-schemas, sensible D&D defaults
- MapMarker: Percentage coordinates (0-100), hex color, room-scoped index
- FamilyTree: Embedded nodes (NPC/PC), hidden flag, player notes
- Notebook: Tiptap JSON as Mixed, unique user/room/type compound index
- db.ts: MongoDB connection with retry logic (5 attempts, 5s delay)
- index.ts: Updated bootstrap with MongoDB connect + model registration

Frontend IndexedDB (Dexie.js):
- Offline mirror of all server schemas with _syncStatus tracking
- Sync queue table (FIFO) for background mutation replay
- Helper functions: enqueue, dequeue, upsert, room cleanup"

Write-Host ""
Write-Host "=== Step 2 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 3 — Backend Architecture (Routes, Controllers, Socket handlers)" -ForegroundColor Gray

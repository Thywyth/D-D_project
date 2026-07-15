#!/usr/bin/env pwsh
# Step 7: DM Features & Notebooks — Git Automation Script
# Run from the project root: .\scripts\step7-dm-features.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 7: DM Features & Notebooks ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    # DM Module
    "frontend/src/components/dm/PlayerCards.tsx",
    "frontend/src/components/dm/DMDashboard.tsx",
    "frontend/src/components/dm/AudioMixer.tsx",
    "frontend/src/components/dm/TimeController.tsx",
    "frontend/src/components/dm/DMNotebook.tsx",
    # Player Module
    "frontend/src/components/player/PlayerNotebook.tsx",
    # Updated Pages
    "frontend/src/pages/SessionPage.tsx"
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
Write-Host "Committing Step 7..." -ForegroundColor Yellow
git commit -m "feat: implement Step 7 — DM features and notebooks

DM Features (4 components):
- DMDashboard: Summary stats (character count, alive, avg HP), player cards,
  and player code management with regeneration.
- TimeController: In-game calendar display (day/month/year) with buttons
  to advance time (+1, +7, +30 days, custom) via API.
- AudioMixer: Two-channel audio control. Ambient channel with presets,
  volume slider, and custom URL input. SFX channel with one-shot sound buttons.
- PlayerCards: Reusable cards for player characters and invite code slots.

Notebooks (2 components):
- DMNotebook: Tiptap-based rich-text editor for DMs with Bold, Italic,
  Headers, Lists, and custom color-coded highlights (Lore, Loot, Combat).
- PlayerNotebook: Simpler Tiptap editor for private player notes.
- Both feature debounced auto-saving to the backend via Zustand.

Session Page Integration:
- Added a 'DM Панель' tab, exclusive to the DM, which houses the Dashboard,
  Time Controller, and Audio Mixer for a centralized control panel.
- Added a 'Нотатки' tab for both players and DMs to access their notebooks."

Write-Host ""
Write-Host "=== Step 7 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 8 — Final Polish & Deployment Prep" -ForegroundColor Gray
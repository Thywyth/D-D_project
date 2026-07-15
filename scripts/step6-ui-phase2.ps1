#!/usr/bin/env pwsh
# Step 6: UI Phase 2 — Git Automation Script
# Run from the project root: .\scripts\step6-ui-phase2.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 6: UI Phase 2 ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    # Character Module
    "frontend/src/components/character/CharacterHeader.tsx",
    "frontend/src/components/character/StatBlockGrid.tsx",
    "frontend/src/components/character/SkillsPanel.tsx",
    "frontend/src/components/character/InventoryPanel.tsx",
    "frontend/src/components/character/CharacterSheet.tsx",
    # Map Module
    "frontend/src/components/map/InteractiveMap.tsx",
    "frontend/src/components/map/MapMarker.tsx",
    "frontend/src/components/map/MarkerForm.tsx",
    # Tree Module
    "frontend/src/components/tree/TreeCanvas.tsx",
    "frontend/src/components/tree/TreeNodeCard.tsx",
    "frontend/src/components/tree/NodeDetail.tsx",
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
Write-Host "Committing Step 6..." -ForegroundColor Yellow
git commit -m "feat: implement UI Phase 2 — character sheet, map, family tree

Character Sheet Module (5 components):
- CharacterHeader: name/race/class/level, HP bar (color-coded gradient),
  quick stat blocks (AC, initiative, speed, proficiency, inspiration)
- StatBlockGrid: 6 ability scores (3-col mobile, 6-col desktop),
  Ukrainian labels, score/modifier, hover tooltip
- SkillsPanel: all 18 D&D skills with proficiency dot, ability tag,
  bonus value. Proficient skills highlighted amber
- InventoryPanel: coin row (PP/GP/EP/SP/CP with emojis), item list
  with quantity/weight, total weight, add modal, RBAC-aware editing
- CharacterSheet: full D&D 5e sheet with 4 tabs (Stats/Skills/Inventory/Traits),
  saving throws, death saves, hit dice, personality, features, languages

Interactive Map Module (3 components):
- InteractiveMap: pan (pointer events), zoom (wheel + buttons),
  double-click to place markers. DM-only editing. Zoom controls overlay
- MapMarker: positioned by xPercent/yPercent, colored pin with shadow,
  hover label, selected glow, remove button
- MarkerForm: modal with name, description, 8-color picker, position display

Family Tree Module (3 components):
- TreeCanvas: custom SVG renderer with pan/zoom, grid background,
  bezier curve edges, fog-of-war (hidden nodes DM-only, dashed edges)
- TreeNodeCard: SVG node with PC (amber) / NPC (arcane) badge,
  name truncation, age, selection glow, hidden indicator
- NodeDetail: info panel with type badge, age, description.
  DM toggle visibility button for fog-of-war control

Session Page:
- 3-tab layout (Character/Map/Tree)
- Auto-fetches characters, markers, and trees on mount
- Finds current user's character automatically
- DM detection for edit permissions and fog-of-war

All text hardcoded in Ukrainian. Dark Fantasy design system."

Write-Host ""
Write-Host "=== Step 6 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 7 — DM Features (Audio controls, Time management)" -ForegroundColor Gray

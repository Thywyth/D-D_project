#!/usr/bin/env pwsh
# Step 5: UI Phase 1 — Git Automation Script
# Run from the project root: .\scripts\step5-ui-phase1.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 5: UI Phase 1 ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Verify required files exist
$requiredFiles = @(
    # UI Primitives
    "frontend/src/components/ui/Button.tsx",
    "frontend/src/components/ui/Input.tsx",
    "frontend/src/components/ui/Modal.tsx",
    "frontend/src/components/ui/Tabs.tsx",
    "frontend/src/components/ui/Toast.tsx",
    "frontend/src/components/ui/FAB.tsx",
    # Layout Shell
    "frontend/src/components/layout/AppShell.tsx",
    "frontend/src/components/layout/Header.tsx",
    "frontend/src/components/layout/Sidebar.tsx",
    "frontend/src/components/layout/BottomNav.tsx",
    # Auth Module
    "frontend/src/components/auth/AuthScreen.tsx",
    "frontend/src/components/auth/LoginForm.tsx",
    "frontend/src/components/auth/RegisterForm.tsx",
    "frontend/src/pages/AuthPage.tsx",
    # Lobby Module
    "frontend/src/components/lobby/Dashboard.tsx",
    "frontend/src/components/lobby/SessionCard.tsx",
    "frontend/src/components/lobby/CreateSession.tsx",
    "frontend/src/components/lobby/JoinSession.tsx",
    "frontend/src/pages/LobbyPage.tsx",
    # Dice Module
    "frontend/src/components/dice/DiceOverlay.tsx",
    "frontend/src/components/dice/DieButton.tsx",
    "frontend/src/components/dice/DiceAnimation.tsx",
    # Pages
    "frontend/src/pages/SessionPage.tsx",
    "frontend/src/pages/NotFoundPage.tsx"
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
Write-Host "Committing Step 5..." -ForegroundColor Yellow
git commit -m "feat: implement UI Phase 1 — auth, lobby, dice, layout shell

UI Primitives (6):
- Button: primary/secondary/ghost/danger variants, loading state
- Input: dark surface, amber focus glow, label + icon + error
- Modal: glass-dark backdrop, wood border, bounce-in animation
- Tabs: horizontal scrollable, amber active indicator
- Toast: global imperative API (showToast), stacked notifications
- FAB: floating action button with float animation

Layout Shell (4):
- AppShell: auth guard, initializes useSocket + useSync hooks
- Header: sticky, room name, online/offline status dot with glow
- Sidebar: responsive drawer, user avatar, role-aware nav, DM filtering
- BottomNav: mobile-only, 4 quick-access items with amber indicator

Auth Module (4):
- AuthScreen: glassmorphism over dark bg, ambient glow particles
- LoginForm: email/password, wired to authStore.login()
- RegisterForm: validation (3+ chars, email pattern, password match)
- AuthPage: redirect if authenticated, renders AuthScreen + toasts

Lobby Module (5):
- Dashboard: time-based Ukrainian greeting, empty state dragon
- SessionCard: room name, code, player bar, game date, hover glow
- CreateSession: campaign name + player count modal
- JoinSession: room code + player code modal (monospace uppercase)
- LobbyPage: AppShell wrapper, room fetch, create/join modals

Dice Roller (3):
- DiceOverlay: full-screen, die selector grid, history log
- DieButton: d4-d100 with emojis, hover glow, press animation
- DiceAnimation: 3-phase (idle/rolling/reveal), CSS keyframe roll
  - Random number cycling during roll, particle burst on reveal

Pages (2):
- SessionPage: placeholder for Phase 2
- NotFoundPage: 404 with dragon, float animation

CSS Updates:
- Added particleBurst keyframe for dice reveal effect

Design: Dark Fantasy (charcoal/parchment/amber) with glassmorphism,
wood borders, and micro-animations. All text hardcoded in Ukrainian."

Write-Host ""
Write-Host "=== Step 5 Complete! ===" -ForegroundColor Green
Write-Host "Next: Step 6 — UI Phase 2 (Character Sheet, Map, Family Tree)" -ForegroundColor Gray

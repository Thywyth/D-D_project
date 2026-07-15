#!/usr/bin/env pwsh
# Step 1: Project Initialization — Git Automation Script
# Run from the project root: .\scripts\step1-init.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== DnD Mobile VTT — Step 1: Project Initialization ===" -ForegroundColor Cyan
Write-Host ""

# Determine project root (scripts/ is inside project root)
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Initialize git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "Git repository initialized." -ForegroundColor Green
} else {
    Write-Host "Git repository already exists." -ForegroundColor Gray
}

# Install dependencies for shared package
Write-Host ""
Write-Host "Installing shared package dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "shared")
npm install
Pop-Location
Write-Host "Shared dependencies installed." -ForegroundColor Green

# Install dependencies for frontend
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "frontend")
npm install
Pop-Location
Write-Host "Frontend dependencies installed." -ForegroundColor Green

# Install dependencies for backend
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $projectRoot "backend")
npm install
Pop-Location
Write-Host "Backend dependencies installed." -ForegroundColor Green

# Create .env from .env.example if it doesn't exist
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host ".env file created from .env.example" -ForegroundColor Yellow
    Write-Host "  >> Please update .env with your actual configuration values!" -ForegroundColor Red
}

# Git add and commit
Write-Host ""
Write-Host "Staging files for git commit..." -ForegroundColor Yellow
git add -A
git status

Write-Host ""
Write-Host "Committing Step 1..." -ForegroundColor Yellow
git commit -m "feat: initialize project scaffolding — Vite 8 + React 19 + Tailwind v4 + Express 5 + PWA

- Root: .gitignore, .env.example, README.md
- Shared: TypeScript types package with base type stubs
- Frontend: Vite 8 + React 19 + Tailwind CSS v4 + PWA (vite-plugin-pwa)
  - Dark Fantasy theme (charcoal/parchment/amber palette)
  - Cinzel + Inter typography via Google Fonts
  - CSS animations (dice roll, fade, slide, shimmer)
  - Component classes (wooden borders, glass, stat blocks, HP bars)
  - Mobile-first responsive drawer, FAB, toast notifications
  - PWA manifest with offline caching strategies
  - React Router v7 with lazy-loaded pages
- Backend: Express 5 + Socket.IO + Mongoose 9
  - Type-safe env config with validation
  - Minimal bootstrap server with health check
  - Graceful shutdown handling"

Write-Host ""
Write-Host "=== Step 1 Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To push to remote, run:" -ForegroundColor Gray
Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "To start development:" -ForegroundColor Gray
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "  Backend:  cd backend && npm run dev" -ForegroundColor White

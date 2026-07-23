@echo off
setlocal
if exist components\KPIGrid.tsx del components\KPIGrid.tsx
echo Removed unused duplicate components\KPIGrid.tsx
echo Run: npm run build
echo Run: git diff --check
echo Run: git status --short
endlocal

@echo off
echo Starting Git backup process...
echo.

cd /d "c:\Users\PT\timer"

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding all files...
git add .
echo.

echo [3/4] Committing changes...
git commit -m "Backup: Analytics dashboard improvements and session tracking - %date% %time%"
echo.

echo [4/4] Pushing to GitHub...
git push origin HEAD
echo.

echo Backup complete!
pause

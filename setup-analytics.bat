@echo off
REM Quick Setup Script for Session Analytics
REM This script applies all necessary patches and generates sample data

echo ================================================
echo   Session Analytics Setup
echo ================================================
echo.

echo Step 1: Installing Chart.js (if not already installed)...
call npm install chart.js
echo.

echo Step 2: Please manually apply these patches:
echo.
echo [1] Edit src\main\main.js
echo     - Open PATCH-main-js.txt
echo     - Copy the code
echo     - Paste after line 218 (after the get-analytics handler)
echo.
echo [2] Edit src\main\preload.js  
echo     - Open PATCH-preload-js.txt
echo     - Copy the code
echo     - Paste after line 26 (in the analytics section)
echo.
echo [3] Edit src\renderer\app.js
echo     - Open PATCH-app-js.txt 
echo     - Follow the 3 steps in that file
echo.

pause

echo.
echo Step 3: Starting the app...
start npm start

echo.
echo ================================================
echo  Setup Instructions Complete!
echo ================================================
echo.
echo After the app starts:
echo 1. Open Developer Tools (Ctrl+Shift+I)
echo 2. Go to Console tab
echo 3. Paste this command and press Enter:
echo.
echo    const script = document.createElement('script'); script.src = '../generate-sample-data.js'; document.body.append(script);
echo.
echo 4. Wait for "Sample data saved!" message
echo 5. Click the Stats button to view analytics!
echo.
pause

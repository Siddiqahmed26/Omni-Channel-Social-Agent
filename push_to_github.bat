@echo off
set REPO_URL=https://github.com/Siddiqahmed26/Omni-Channel-Social-Agent.git

echo Checking for Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please download and install it from: https://git-scm.com/
    pause
    exit /b
)

echo.
echo [1/4] Setting up Git identity...
:: Check if name is set
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    set /p GIT_NAME="Enter your GitHub Name: "
    git config --global user.name "%GIT_NAME%"
)

:: Check if email is set
git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    set /p GIT_EMAIL="Enter your GitHub Email: "
    git config --global user.email "%GIT_EMAIL%"
)

echo.
echo [2/4] Initializing repository...
if not exist .git (
    git init
    git remote add origin %REPO_URL%
) else (
    echo [INFO] Repository already initialized. Updating remote URL...
    git remote set-url origin %REPO_URL%
)

echo.
echo [3/4] Creating initial commit...
git add .
git commit -m "Initial commit: Omni-Channel Social Agent"

echo.
echo [4/4] Pushing to GitHub...
git branch -M main
echo [IMPORTANT] A browser window may open for you to sign in to GitHub.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Your code is now live at: %REPO_URL%
) else (
    echo.
    echo [ERROR] Push failed. 
    echo 1. Make sure you created the repository 'Omni-Channel-Social-Agent' on GitHub first.
    echo 2. Make sure the repository is EMPTY (no README or License initialized on GitHub).
    echo 3. Check your internet connection.
)
pause

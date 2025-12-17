@echo off
setlocal
REM Force UTF-8 for accents
chcp 65001 >NUL
TITLE Axora Launcher

REM ----------------------------------------------------
REM 0. RESILIENCE: FORCE CORRECT WORKING DIRECTORY
REM Fixes "System32" issue when running as Admin
REM ----------------------------------------------------
cd /d "%~dp0"

ECHO ==========================================
ECHO      AXORA PHARMACY - LAUNCHER
ECHO ==========================================
ECHO [INFO] Date      : %DATE% %TIME%
ECHO [INFO] User      : %USERNAME%
ECHO [INFO] Location  : "%~dp0"
ECHO ==========================================
ECHO.

REM 1. Check Node.js
ECHO [1/3] Verification de l'environnement (Node.js)...
call node -v >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERREUR CRITIQUE] Node.js n'est pas installe ou pas dans le PATH !
    ECHO Solution :
    ECHO 1. Allez sur https://nodejs.org
    ECHO 2. Telechargez et installez la version LTS
    ECHO 3. Relancez ce script.
    ECHO.
    PAUSE
    EXIT /B
) ELSE (
    ECHO [OK] Node.js detecte.
)

REM 2. Install/Update Agent
ECHO.
ECHO [2/3] Configuration Agent Lecteur...
IF NOT EXIST "scripts\card-reader-agent" (
    ECHO [ERREUR] Dossier 'scripts\card-reader-agent' introuvable !
    PAUSE
    EXIT /B
)

cd scripts\card-reader-agent
IF NOT EXIST "node_modules" (
    ECHO [INSTALL] Installation des dependances Agent...
    call npm install --no-audit --no-fund --loglevel=error
    IF %ERRORLEVEL% NEQ 0 (
        ECHO [ERREUR] Echec de l'installation npm pour l'agent.
        PAUSE
        EXIT /B
    )
)
cd /d "%~dp0"

REM 3. Install/Update Frontend
ECHO.
ECHO [3/3] Configuration Application Web...
IF NOT EXIST "node_modules" (
    ECHO [INSTALL] Installation des dependances Web...
    call npm install --no-audit --no-fund --loglevel=error
    IF %ERRORLEVEL% NEQ 0 (
        ECHO [ERREUR] Echec de l'installation npm pour le frontend.
        PAUSE
        EXIT /B
    )
)

REM 4. Launch Services
ECHO.
ECHO ------------------------------------------
ECHO         LANCEMENT DES SERVICES
ECHO ------------------------------------------

REM Start Agent in a new window using /D for robust path handling
ECHO [LANCEMENT] Agent Carte Vitale (Fenetre separee)...
start "Axora Card Agent" /D "%~dp0scripts\card-reader-agent" cmd /k "node server.js"

REM Start Frontend
ECHO [LANCEMENT] Application Web...
ECHO.
ECHO L'application va s'ouvrir dans votre navigateur...
ECHO Ne fermez pas cette fenetre tant que vous utilisez Axora.
ECHO.
call npm run dev

ECHO.
ECHO Applications fermees.
PAUSE

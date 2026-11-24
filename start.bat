::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFBZVWAyHAES0A5EO4f7+086IoVgQUewrd5zn17uAJfQH5QjgcIUmwnVKpOYDAh5Mah2XTx8klWhQuWqRMsmYjy7yWU2d9XcdFGtxk3ffzAc0Z9wmk8AMsw==
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSDk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFBZVWAyHAES0A5EO4f7+086IoVgQUewrd5zn17uAJfQH5QjgcIUmwnVKpOYDAh5Mah2XQwA6rHpWuSqAL8L8
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983

@echo off

:: Keep a visible console open after this batch exits, including on errors.
if defined MONETTO_KEEP_CONSOLE goto MAIN
set "MONETTO_KEEP_CONSOLE=1"
start "Monetto Launcher - Diagnostico" cmd.exe /k call "%~f0"
exit /b

:MAIN
setlocal EnableExtensions

title Monetto Launcher
cd /d "%~dp0"

echo ========================================
echo          MONETTO LAUNCHER
echo ========================================
echo.

:: ========================================
:: 1. CONFIGURATION
:: ========================================

set "CONTAINER=Monetto-MySQL"
set "DB_NAME=monetto"
set "DB_USER=root"
set "DB_PASSWORD=mlsolutions"
set "DB_PORT=3307"

set "MYSQL_PATH=%CD%\node-v24.19.0-win-x64"
set "NPM_CLI=%MYSQL_PATH%\node_modules\npm\bin\npm-cli.js"
set "DB_FILE=%CD%\database.sql"
set "INSERT_FILE=%CD%\test_inserts.sql"

:: ========================================
:: 2. CHECK REQUIRED FILES
:: ========================================

if not exist "%DB_FILE%" (
    echo ERROR: database.sql not found!
    goto ERROR
)

if not exist "%INSERT_FILE%" (
    echo ERROR: test_inserts.sql not found!
    goto ERROR
)

:: ========================================
:: 3. CONFIGURE NODE.JS
:: ========================================

if exist "%MYSQL_PATH%\node.exe" (
    set "PATH=%MYSQL_PATH%;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    goto ERROR
)

if not exist "%NPM_CLI%" (
    echo ERROR: Bundled npm was not found at:
    echo %NPM_CLI%
    goto ERROR
)

:: ========================================
:: 4. CHECK DOCKER
:: ========================================

echo [1/6] Checking Docker...

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH.
    goto ERROR
)

docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running.
    echo Please start Docker Desktop and try again.
    goto ERROR
)

echo Docker is running.
echo.

:: ========================================
:: 5. CREATE OR START MYSQL CONTAINER
:: ========================================

echo [2/6] Checking MySQL container...

docker container inspect "%CONTAINER%" >nul 2>&1

if errorlevel 1 (
    echo Container does not exist. Creating it...

    docker run --name "%CONTAINER%" ^
        -e MYSQL_ROOT_PASSWORD=%DB_PASSWORD% ^
        -p %DB_PORT%:3306 ^
        -v monetto_data:/var/lib/mysql ^
        --restart unless-stopped ^
        -d mysql:8.4

    if errorlevel 1 (
        echo ERROR: Could not create MySQL container.
        goto ERROR
    )

) else (
    echo Container already exists.

    docker start "%CONTAINER%" >nul 2>&1

    if errorlevel 1 (
        echo ERROR: Could not start MySQL container.
        goto ERROR
    )
)

echo.

:: ========================================
:: 6. WAIT FOR MYSQL
:: ========================================

echo [3/6] Waiting for MySQL to become ready...

set /a ATTEMPTS=0

:WAIT_MYSQL

docker exec "%CONTAINER%" mysqladmin ping ^
    -h 127.0.0.1 ^
    -u %DB_USER% ^
    -p%DB_PASSWORD% ^
    --silent >nul 2>&1

if not errorlevel 1 goto MYSQL_READY

set /a ATTEMPTS+=1

if %ATTEMPTS% GEQ 60 (
    echo ERROR: MySQL did not start within 60 seconds.
    goto ERROR
)

timeout /t 2 /nobreak >nul
goto WAIT_MYSQL

:MYSQL_READY

echo MySQL is ready!
echo.

:: ========================================
:: 7. CHECK / INITIALIZE DATABASE
:: ========================================

echo [4/6] Checking database...

node "%~dp0scripts\initialize-database.js"
if errorlevel 1 goto ERROR

echo.

:: ========================================
:: 8. INSTALL NODE DEPENDENCIES
:: ========================================

echo [5/6] Checking Node.js dependencies...

if not exist "%CD%\node_modules" (
    echo Installing project dependencies...
    call node "%NPM_CLI%" install

    if errorlevel 1 goto ERROR
)

if not exist "%CD%\node_modules\nodemailer" (
    echo Installing nodemailer...
    call node "%NPM_CLI%" install nodemailer
    if errorlevel 1 goto ERROR
)

if not exist "%CD%\node_modules\exceljs" (
    echo Installing exceljs...
    call node "%NPM_CLI%" install exceljs
    if errorlevel 1 goto ERROR
)

if not exist "%CD%\node_modules\@google\genai" (
    echo Installing Google GenAI...
    call node "%NPM_CLI%" install @google/genai
    if errorlevel 1 goto ERROR
)

if not exist "%CD%\node_modules\dotenv" (
    echo Installing dotenv...
    call node "%NPM_CLI%" install dotenv
    if errorlevel 1 goto ERROR
)

if not exist "%CD%\node_modules\electron-builder" (
    echo Installing electron-builder...
    call node "%NPM_CLI%" install --save-dev electron-builder
    if errorlevel 1 goto ERROR
)

echo Dependencies are ready!
echo.

:: ========================================
:: 9. START MONETTO
:: ========================================

echo [6/6] Starting Monetto...
echo ========================================
echo MySQL: localhost:%DB_PORT%
echo Database: %DB_NAME%
echo ========================================
echo.

call node "%NPM_CLI%" run start
if errorlevel 1 goto ERROR

goto END

:: ========================================
:: ERROR HANDLER
:: ========================================

:ERROR

echo.
echo ========================================
echo ERROR: MONETTO COULD NOT START
echo ========================================
echo.
pause
exit /b 1

:END
echo.
echo Monetto has been closed.
pause
exit /b 0

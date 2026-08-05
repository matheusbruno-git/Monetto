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
::eBoioBt6dFKZSTk=
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
title Monetto Launcher
cd /d "%~dp0"

echo ==============================
echo Starting Monetto...
echo ==============================

:: Add portable Node to PATH
set PATH=%CD%\node-v24.19.0-win-x64;%PATH%

:: Start MySQL
echo Starting MySQL...
start "" /min "C:\xampp\mysql_start.bat"

:: Wait for MySQL
timeout /t 5 /nobreak >nul

:: Create database if it doesn't exist
echo Checking database...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS monetto;"

:: Import SQL (safe if your SQL uses IF NOT EXISTS)
echo Importing database...
"C:\xampp\mysql\bin\mysql.exe" -u root monetto < database.sql

:: Launch Electron
echo Starting Monetto...
npm run start

pause
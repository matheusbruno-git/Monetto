::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFBZVWAyHAES0A5EO4f7+086IoVgQUewrd5zn17uAJfQH5QjgcIUmwnVKpOYDAh5Mah2XTx8klWhQuWqRMsmYjy7yWU2d9XcdFGtxk3ffzAc0Z9wmk8AMsw==
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSjk=
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


set PATH=%CD%\node-v24.19.0-win-x64;%PATH%


echo Starting MySQL...
start "" /min "C:\xampp\mysql_start.bat"


timeout /t 5 /nobreak >nul


echo Checking database...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS monetto;"


echo Importing database...
"C:\xampp\mysql\bin\mysql.exe" -u root monetto < database.sql


echo Starting Monetto...
npm run start

:: Install optional npm packages if they don't exist
if not exist "%CD%\node_modules\nodemailer" (
	echo Installing nodemailer...
	npm install nodemailer
) else (
	echo nodemailer already installed.
)

if not exist "%CD%\node_modules\exceljs" (
	echo Installing exceljs...
	npm install exceljs
) else (
	echo exceljs already installed.
)

if not exist "%CD%\node_modules\@google\genai" (
	echo Installing @google/genai and dotenv...
	npm install @google/genai dotenv
) else (
	echo @google/genai already installed. Checking dotenv...
	if not exist "%CD%\node_modules\dotenv" (
		echo Installing dotenv...
		npm install dotenv
	) else (
		echo dotenv already installed.
	)
)

pause
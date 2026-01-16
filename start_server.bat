@echo off
title Shofar Academy Server
chcp 65001 > nul

echo ========================================
echo   Shofar Academy 서버 시작
echo ========================================
echo.

cd /d "%~dp0"
echo 현재 위치: %CD%
echo.

echo Node.js 버전:
call node --version
echo.
echo npm 버전:
call npm --version
echo.

if not exist "package.json" (
    echo [에러] package.json 파일을 찾을 수 없습니다.
    goto :error
)

if not exist "node_modules" (
    echo [경고] node_modules 폴더가 없습니다.
    echo 의존성을 설치합니다...
    call npm install
    if errorlevel 1 goto :error
)

echo ========================================
echo 개발 서버를 시작합니다...
echo 서버 주소: http://localhost:5000
echo 종료하려면 Ctrl+C를 누르세요.
echo ========================================
echo.

call npm run dev:win
goto :end

:error
echo.
echo [에러] 문제가 발생했습니다.
echo.

:end
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause > nul

@echo off
chcp 65001 > nul
echo ========================================
echo Cloudflare Tunnel을 시작합니다...
echo ========================================
echo.

:: cloudflared가 설치되어 있는지 확인
where cloudflared >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [오류] cloudflared가 설치되어 있지 않습니다.
    echo winget install Cloudflare.cloudflared 로 설치하세요.
    pause
    exit /b 1
)

echo 서버가 http://localhost:3000 에서 실행 중이어야 합니다.
echo.
echo Cloudflare Tunnel 시작 중...
echo (Quick Tunnel: 무료, URL은 매번 변경됩니다)
echo.
cloudflared tunnel --url http://localhost:3000

pause

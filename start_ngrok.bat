@echo off
chcp 65001 > nul
echo ========================================
echo ngrok 터널을 시작합니다...
echo (무료 플랜: URL이 매번 변경됩니다)
echo ========================================
echo.

:: ngrok이 설치되어 있는지 확인
where ngrok >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [오류] ngrok이 설치되어 있지 않습니다.
    echo https://ngrok.com/download 에서 다운로드하세요.
    pause
    exit /b 1
)

echo 서버가 http://localhost:3000 에서 실행 중이어야 합니다.
echo.
echo ngrok 시작 후 표시되는 URL을 Supabase Redirect URLs에 추가하세요!
echo.
ngrok http 3000

pause





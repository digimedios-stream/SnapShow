@echo off
echo ========================================
echo    SERVIDOR HTTPS PARA PROYECCION
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado
    echo Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

REM Verificar si local-ssl-proxy está instalado
echo Verificando local-ssl-proxy...
npm list local-ssl-proxy >nul 2>nul
if %errorlevel% neq 0 (
    echo Instalando local-ssl-proxy...
    npm install -D local-ssl-proxy
    echo.
)

REM Obtener IP local
echo Obteniendo IP local...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    set "IP=%%i"
    goto :ipfound
)
:ipfound
set "IP=%IP:~1%"
echo IP Local: %IP%
echo.

REM Iniciar servidor HTTP principal (en segundo plano)
echo [1/2] Iniciando servidor HTTP en puerto 3000...
start "Servidor HTTP" cmd /c "node server.js"
timeout /t 3 /nobreak >nul

REM Iniciar proxy HTTPS
echo [2/2] Iniciando proxy HTTPS en puerto 3002...
echo ========================================
echo.
echo ✅ SERVIDOR INICIADO CORRECTAMENTE
echo.
echo 📡 PANEL DE ADMINISTRACION:
echo    HTTPS Local:  https://localhost:3002/admin
echo    HTTPS Red:    https://%IP%:3002/admin
echo.
echo 📺 PANTALLA DE PROYECCION:
echo    HTTPS Local:  https://localhost:3002/pantalla
echo    HTTPS Red:    https://%IP%:3002/pantalla
echo.
echo 🔌 WEBSOCKET:    wss://%IP%:3001
echo.
echo 💡 Para otros dispositivos en la misma red WiFi:
echo    Abre el navegador y visita:
echo    https://%IP%:3002/pantalla
echo.
echo ========================================
echo Presiona Ctrl+C en esta ventana para detener ambos servidores
echo.
npx local-ssl-proxy --source 3002 --target 3000
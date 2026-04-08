@echo off
title Generador de Instalador Portable
color 0E

echo ========================================
echo    GENERADOR DE INSTALADOR PORTABLE
echo ========================================
echo.
echo Este script creará un instalador portable
echo que puedes copiar a cualquier Windows
echo.

REM Crear estructura de carpetas
set "INSTALADOR=InstaladorPortable"
if exist "%INSTALADOR%" (
    echo Eliminando instalador anterior...
    rmdir /s /q "%INSTALADOR%"
)

mkdir "%INSTALADOR%"
mkdir "%INSTALADOR%\Sistema"
mkdir "%INSTALADOR%\Sistema\public"

echo [1/6] Copiando archivos del servidor...
copy "server.js" "%INSTALADOR%\Sistema\"
copy "package.json" "%INSTALADOR%\Sistema\"

echo [2/6] Copiando archivos HTML...
copy "public\admin.html" "%INSTALADOR%\Sistema\public\"
copy "public\pantalla.html" "%INSTALADOR%\Sistema\public\"

echo [3/6] Creando scripts de instalacion...

REM Crear Instalar.bat
(
echo @echo off
echo title Instalador del Sistema de Proyeccion
echo echo Iniciando instalacion...
echo echo.
echo echo [1/3] Verificando Node.js...
echo where node ^>nul 2^>nul
echo if ^%errorlevel^% neq 0 (
echo     echo Node.js no encontrado
echo     echo Por favor instala manualmente desde:
echo     echo https://nodejs.org/
echo     echo Luego ejecuta nuevamente este instalador
echo     pause
echo     exit /b 1
echo )
echo.
echo echo [2/3] Instalando dependencias...
echo cd /d "%%~dp0Sistema"
echo call npm install --silent
echo.
echo echo [3/3] Configurando...
echo echo ✅ Instalacion completada
echo echo.
echo echo Para ejecutar el sistema:
echo echo 1. Ejecuta "Ejecutar.bat"
echo echo 2. Abre http://localhost:3000/admin
echo echo.
echo pause
) > "%INSTALADOR%\Instalar.bat"

REM Crear Ejecutar.bat
(
echo @echo off
echo title Sistema de Proyeccion
echo cd /d "%%~dp0Sistema"
echo echo.
echo echo ========================================
echo echo    SISTEMA DE PROYECCION
echo echo ========================================
echo echo.
echo echo Iniciando servidor...
echo echo.
echo echo 📍 URLs disponibles:
echo echo - Panel Admin: http://localhost:3000/admin
echo echo - Pantalla:     http://localhost:3000/pantalla
echo echo.
echo echo Para otros dispositivos en la misma red:
echo echo Usa tu IP local en lugar de localhost
echo echo Ejemplo: http://192.168.1.100:3000/pantalla
echo echo.
echo echo ========================================
echo echo Presiona Ctrl+C para detener
echo echo ========================================
echo echo.
echo node server.js
echo pause
) > "%INSTALADOR%\Ejecutar.bat"

REM Crear Leeme.txt
(
echo SISTEMA DE PROYECCION PARA EVENTOS
echo ==================================
echo.
echo INSTRUCCIONES DE INSTALACION:
echo 1. Ejecutar "Instalar.bat" (solo primera vez)
echo    - Verificará que tengas Node.js instalado
echo    - Instalará las dependencias necesarias
echo.
echo 2. Ejecutar "Ejecutar.bat" (cada vez que uses el sistema)
echo    - Iniciará el servidor en puerto 3000
echo    - Mostrará las URLs de acceso
echo.
echo 3. Para usar en otros dispositivos:
echo    - Conecta todos a la misma red WiFi
echo    - En otros dispositivos, abre el navegador
echo    - Visita: http://[IP-DE-ESTA-PC]:3000/pantalla
echo.
echo REQUISITOS:
echo - Windows 10/11
echo - Node.js 14 o superior (se descarga automáticamente)
echo - Conexión a internet (solo para primera instalación)
echo.
echo CONTACTO:
echo Para soporte o preguntas, contacta al desarrollador.
) > "%INSTALADOR%\LEEME.txt"

echo [4/6] Creando archivos de soporte...
copy /Y NUL "%INSTALADOR%\package-lock.json" >nul

echo [5/6] Comprimiendo en ZIP...
REM Usar PowerShell para comprimir
powershell -Command "Compress-Archive -Path '%INSTALADOR%\*' -DestinationPath 'SistemaProyeccionPortable.zip' -Force"

echo [6/6] Limpiando...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ INSTALADOR CREADO EXITOSAMENTE
echo ========================================
echo.
echo Archivo generado: SistemaProyeccionPortable.zip
echo.
echo Para distribuir:
echo 1. Envia el archivo ZIP a otra computadora
echo 2. Extrae todo en una carpeta
echo 3. Ejecuta "Instalar.bat" (como administrador)
echo 4. Luego ejecuta "Ejecutar.bat"
echo.
echo El sistema estará disponible en:
echo - Esta PC: http://localhost:3000/admin
echo - Otras PCs: http://[IP]:3000/pantalla
echo.
pause
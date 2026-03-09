@echo off
echo.
echo === Consertando Cowork ===
echo Se aparecer uma janela pedindo permissao, clique SIM.
echo Aguarde...
echo.
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -WindowStyle Hidden -File \"%USERPROFILE%\scripts\fix-cowork.ps1\"' -Wait"
echo.
echo Pronto! Feche o Claude Desktop completamente e reabra.
echo.
pause

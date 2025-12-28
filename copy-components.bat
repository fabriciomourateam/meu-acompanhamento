@echo off
echo ========================================
echo Copiando componentes do projeto atual
echo ========================================
echo.

REM Caminho do projeto atual (ajustar se necessário)
set SOURCE=..\controle-de-pacientes
set DEST=.\src

echo [1/8] Criando estrutura de pastas...
if not exist "%DEST%\components\ui" mkdir "%DEST%\components\ui"
if not exist "%DEST%\components\patient-portal" mkdir "%DEST%\components\patient-portal"
if not exist "%DEST%\components\evolution" mkdir "%DEST%\components\evolution"
if not exist "%DEST%\lib" mkdir "%DEST%\lib"
if not exist "%DEST%\hooks" mkdir "%DEST%\hooks"
if not exist "%DEST%\utils" mkdir "%DEST%\utils"
if not exist "%DEST%\integrations\supabase" mkdir "%DEST%\integrations\supabase"

echo [2/10] Copiando componentes UI...
xcopy /E /I /Y "%SOURCE%\src\components\ui\*" "%DEST%\components\ui\"

echo [3/10] Copiando componentes do portal...
xcopy /E /I /Y "%SOURCE%\src\components\patient-portal\*" "%DEST%\components\patient-portal\"
xcopy /E /I /Y "%SOURCE%\src\components\evolution\*" "%DEST%\components\evolution\"
copy /Y "%SOURCE%\src\components\InstallPWAButton.tsx" "%DEST%\components\"

echo [4/10] Copiando componentes de dieta...
if not exist "%DEST%\components\diets" mkdir "%DEST%\components\diets"
xcopy /E /I /Y "%SOURCE%\src\components\diets\*" "%DEST%\components\diets\"

echo [5/10] Copiando componentes de exames...
if not exist "%DEST%\components\exams" mkdir "%DEST%\components\exams"
xcopy /E /I /Y "%SOURCE%\src\components\exams\*" "%DEST%\components\exams\"

echo [6/10] Copiando services...
copy /Y "%SOURCE%\src\lib\checkin-service.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\diet-service.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\patient-portal-service.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\achievement-system.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\trends-analysis.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\utils.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\diet-consumption-service.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\weight-tracking-service.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\ai-analysis-service.ts" "%DEST%\lib\"

echo [7/10] Copiando utils...
copy /Y "%SOURCE%\src\utils\diet-calculations.ts" "%DEST%\utils\"
copy /Y "%SOURCE%\src\lib\measurement-utils.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\google-drive-utils.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\weight-utils.ts" "%DEST%\lib\"
copy /Y "%SOURCE%\src\lib\media-utils.ts" "%DEST%\lib\"

echo [8/10] Copiando hooks...
copy /Y "%SOURCE%\src\hooks\use-toast.ts" "%DEST%\hooks\"
copy /Y "%SOURCE%\src\hooks\use-checkin-feedback.ts" "%DEST%\hooks\"
copy /Y "%SOURCE%\src\hooks\use-feedback-templates.ts" "%DEST%\hooks\"
copy /Y "%SOURCE%\src\hooks\use-global-search.ts" "%DEST%\hooks\"
copy /Y "%SOURCE%\src\hooks\use-notifications.ts" "%DEST%\hooks\"

echo [9/10] Criando hook use-mobile (simplificado)...
echo import { useState, useEffect } from 'react'; > "%DEST%\hooks\use-mobile.ts"
echo export function useMobile() { >> "%DEST%\hooks\use-mobile.ts"
echo   const [isMobile, setIsMobile] = useState(false); >> "%DEST%\hooks\use-mobile.ts"
echo   useEffect(() => { >> "%DEST%\hooks\use-mobile.ts"
echo     const checkMobile = () => setIsMobile(window.innerWidth ^< 768); >> "%DEST%\hooks\use-mobile.ts"
echo     checkMobile(); >> "%DEST%\hooks\use-mobile.ts"
echo     window.addEventListener('resize', checkMobile); >> "%DEST%\hooks\use-mobile.ts"
echo     return () => window.removeEventListener('resize', checkMobile); >> "%DEST%\hooks\use-mobile.ts"
echo   }, []); >> "%DEST%\hooks\use-mobile.ts"
echo   return isMobile; >> "%DEST%\hooks\use-mobile.ts"
echo } >> "%DEST%\hooks\use-mobile.ts"

echo [10/10] Copiando integração Supabase...
copy /Y "%SOURCE%\src\integrations\supabase\types.ts" "%DEST%\integrations\supabase\"

echo.
echo ========================================
echo Concluído!
echo ========================================
echo.
echo ========================================
echo Componentes copiados com sucesso!
echo ========================================
pause


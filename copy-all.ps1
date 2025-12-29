$source = "..\controle-de-pacientes\src"
$dest = ".\src"

Write-Host "Copiando componentes UI..."
if (-not (Test-Path "$dest\components\ui")) { New-Item -ItemType Directory -Path "$dest\components\ui" -Force | Out-Null }
Copy-Item -Path "$source\components\ui\*" -Destination "$dest\components\ui\" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Copiando componentes patient-portal, evolution, diets, exams..."
@("patient-portal", "evolution", "diets", "exams") | ForEach-Object {
    $dir = "$dest\components\$_"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -Path "$source\components\$_\*" -Destination $dir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  - $_"
}

Write-Host "Copiando services..."
@("checkin-service.ts", "diet-service.ts", "patient-portal-service.ts", "achievement-system.ts", "trends-analysis.ts", "utils.ts", "diet-consumption-service.ts", "weight-tracking-service.ts", "ai-analysis-service.ts", "body-calculations.ts", "checkin-feedback-ai.ts", "certificate-generator.ts", "share-generator.ts", "diet-pdf-generator.ts", "diet-pdf-premium-generator.ts", "measurement-utils.ts", "google-drive-utils.ts", "weight-utils.ts", "media-utils.ts", "config-service.ts") | ForEach-Object {
    if (Test-Path "$source\lib\$_") {
        Copy-Item -Path "$source\lib\$_" -Destination "$dest\lib\$_" -Force
        Write-Host "  - $_"
    }
}

Write-Host "Copiando hooks..."
@("use-toast.ts", "use-checkin-feedback.ts", "use-feedback-templates.ts", "use-global-search.ts", "use-notifications.ts") | ForEach-Object {
    if (Test-Path "$source\hooks\$_") {
        Copy-Item -Path "$source\hooks\$_" -Destination "$dest\hooks\$_" -Force
        Write-Host "  - $_"
    }
}

Write-Host "Criando use-mobile.ts..."
$useMobileContent = @"
import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
"@
$useMobileContent | Out-File -FilePath "$dest\hooks\use-mobile.ts" -Encoding UTF8

Write-Host "Copiando utils e types..."
if (Test-Path "$source\utils\diet-calculations.ts") {
    Copy-Item -Path "$source\utils\diet-calculations.ts" -Destination "$dest\utils\diet-calculations.ts" -Force
    Write-Host "  - diet-calculations.ts"
}

if (Test-Path "$source\integrations\supabase\types.ts") {
    Copy-Item -Path "$source\integrations\supabase\types.ts" -Destination "$dest\integrations\supabase\types.ts" -Force
    Write-Host "  - types.ts"
}

if (Test-Path "$source\components\InstallPWAButton.tsx") {
    Copy-Item -Path "$source\components\InstallPWAButton.tsx" -Destination "$dest\components\InstallPWAButton.tsx" -Force
    Write-Host "  - InstallPWAButton.tsx"
}

Write-Host "`nConcluído!"





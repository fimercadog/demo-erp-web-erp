# deploy-hostinger.ps1
# Empaqueta el backend Laravel para subir a Hostinger via FTP/ZIP.
# Uso: pwsh ./deploy-hostinger.ps1
#
# Qué hace:
#   1. Instala dependencias sin dev
#   2. Genera un .zip listo para subir (excluye node_modules, .git, tests, etc.)
#   3. Imprime el checklist post-subida

param(
    [string]$OutDir = "$PSScriptRoot\..\dist"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# ── 1. Encontrar PHP 8.4 ──────────────────────────────────────────────────────
function Get-Php84 {
    $candidates = @()
    $cmd = Get-Command php -ErrorAction SilentlyContinue
    if ($cmd) { $candidates += $cmd.Source }
    $candidates += Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.*\php.exe" -ErrorAction SilentlyContinue | ForEach-Object FullName
    foreach ($p in $candidates | Select-Object -Unique) {
        if ($p -and (Test-Path $p)) {
            $v = & $p -r "echo PHP_VERSION_ID;" 2>$null
            if ($v -and [int]$v -ge 80400) { return $p }
        }
    }
    return $null
}

$php = Get-Php84
if (-not $php) { Write-Error "PHP >= 8.4 no encontrado."; exit 1 }
Write-Host "PHP: $php" -ForegroundColor Green

# ── 2. Instalar dependencias sin dev ─────────────────────────────────────────
Write-Host "`nInstalando dependencias (--no-dev --optimize-autoloader)..." -ForegroundColor Cyan
& $php (Get-Command composer -ErrorAction Stop).Source install --no-dev --optimize-autoloader --no-interaction

# ── 3. Crear directorio de salida ─────────────────────────────────────────────
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$zipPath = Join-Path $OutDir "backend-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"

# ── 4. Archivos a excluir ─────────────────────────────────────────────────────
$exclude = @(
    ".git", ".gitignore", "node_modules", "tests", "storage/logs/*.log",
    "storage/framework/cache/*", "storage/framework/sessions/*",
    "storage/framework/views/*", ".env", ".env.*", "deploy-hostinger.ps1",
    "serve.ps1", "*.sqlite", "database/database.sqlite"
)

Write-Host "`nCreando ZIP en $zipPath ..." -ForegroundColor Cyan

# Usar 7zip si está disponible, sino Compress-Archive
$7z = Get-Command "7z" -ErrorAction SilentlyContinue
if ($7z) {
    $excludeArgs = $exclude | ForEach-Object { "-xr!$_" }
    & 7z a -tzip $zipPath . @excludeArgs -mx=5
} else {
    # Compress-Archive es lento pero funciona sin 7zip
    $tmp = Join-Path $env:TEMP "laravel-deploy-$(Get-Random)"
    Copy-Item -Path $PSScriptRoot -Destination $tmp -Recurse -Force
    foreach ($ex in $exclude) {
        Get-ChildItem -Path $tmp -Filter ($ex -split '/' | Select-Object -Last 1) -Recurse -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    Remove-Item "$tmp\.env*" -Force -ErrorAction SilentlyContinue
    Compress-Archive -Path "$tmp\*" -DestinationPath $zipPath -Force
    Remove-Item $tmp -Recurse -Force
}

Write-Host "`n✔ ZIP listo: $zipPath" -ForegroundColor Green

# ── 5. Checklist post-subida ──────────────────────────────────────────────────
Write-Host @"

═══════════════════════════════════════════════════════
  CHECKLIST POST-SUBIDA EN HOSTINGER
═══════════════════════════════════════════════════════

  Subdominio:  demo-erp-web-veterinaria-api.fidelmercadotech.com
  Doc root:    /home/u[cuenta]/demo-erp-web-veterinaria-api.fidelmercadotech.com/public

  1. Subir el ZIP via hPanel → File Manager → Extract
     (destino: /home/u[cuenta]/demo-erp-web-veterinaria-api.fidelmercadotech.com/)

  2. Crear /home/.../  .env  a partir de .env.production.example
     (File Manager → New File, pegar contenido con datos reales)

  3. En hPanel → Terminal SSH (o File Manager):
       php artisan key:generate
       php artisan migrate --force
       php artisan db:seed --force          # si quieres datos demo
       php artisan config:cache
       php artisan route:cache
       php artisan view:cache
       php artisan storage:link
       chmod -R 775 storage bootstrap/cache

  4. PHP version: asegurar PHP 8.4 en hPanel → PHP Configuration

  5. Verificar CORS: FRONTEND_URL y SANCTUM_STATEFUL_DOMAINS apuntan al frontend real

  6. Test rápido:
       curl https://demo-erp-web-veterinaria-api.fidelmercadotech.com/api/health
       # debe devolver {"status":"ok"} o 200

═══════════════════════════════════════════════════════
"@ -ForegroundColor Yellow

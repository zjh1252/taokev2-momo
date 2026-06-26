# 修复 Flyway checksum 不一致（开发库 v3test）
# 场景：V111/V112 等脚本已在库中执行，但本地文件后续被修改，导致启动报：
#   Migration checksum mismatch for migration version 111/112
#
# 用法（在 backend/taoke-app 目录）：
#   .\..\scripts\flyway-repair-dev.ps1
#
# 修复后重新启动 TaokeApplication 或：
#   mvn spring-boot:run

$ErrorActionPreference = "Stop"
$AppDir = Join-Path $PSScriptRoot "..\taoke-app"
Push-Location $AppDir
try {
    Write-Host "Running flyway:repair against 10.0.14.20:3306/v3test ..."
    mvn -q flyway:repair
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "OK. 请重新启动后端 (TaokeApplication / mvn spring-boot:run)"
} finally {
    Pop-Location
}

#!/usr/bin/env pwsh
# 本地开发启动：优先使用各模块 target/classes（覆盖 Maven 仓库旧 JAR）
$argfile = (Get-ChildItem "$env:LOCALAPPDATA\Temp\spring-boot-*.argfile" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
if (-not $argfile) { Write-Error "未找到 spring-boot argfile，请先在 IDE 运行一次 TaokeApplication"; exit 1 }

$prepend = @(
  "D:\taokev2-mono\backend\taoke-user\target\classes",
  "D:\taokev2-mono\backend\taoke-course\target\classes",
  "D:\taokev2-mono\backend\taoke-admin\target\classes",
  "D:\taokev2-mono\backend\taoke-common\target\classes"
) -join ';'

$cp = (Get-Content $argfile -Raw).Trim('"')
$cp = "$prepend;$cp"

Set-Location "D:\taokev2-mono\backend\taoke-app"
Write-Host "Starting TaokeApplication with local target/classes..."
& "E:\JAVA\JDK\bin\java.exe" -XX:TieredStopAtLevel=1 -cp $cp com.taoke.app.TaokeApplication

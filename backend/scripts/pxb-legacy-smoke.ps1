# 培训宝 legacy API 联调入口（Windows PowerShell）
# 用法:
#   .\pxb-legacy-smoke.ps1 suite
#   .\pxb-legacy-smoke.ps1 call -Opt getCourseTopic -Uid 123456
#   $env:PXB_LEGACY_BASE_URL = "http://127.0.0.1:8080"
#   $env:PXB_LEGACY_UID = "123456"

param(
    [Parameter(Position = 0)]
    [string]$Command = "suite",

    [string]$Base = $env:PXB_LEGACY_BASE_URL,
    [string]$AppId = $env:PXB_LEGACY_APPID,
    [string]$Secret = $env:PXB_LEGACY_SECRET,
    [int]$Uid = $(if ($env:PXB_LEGACY_UID) { [int]$env:PXB_LEGACY_UID } else { 0 }),
    [int]$RootId = $(if ($env:PXB_LEGACY_ROOT_ID) { [int]$env:PXB_LEGACY_ROOT_ID } else { 0 }),
    [string]$Opt = "",
    [int]$VideoId = 0,
    [int]$Cdbid = 0,
    [string[]]$Param = @()
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PyScript = Join-Path $ScriptDir "pxb-legacy-smoke.py"

if (-not (Test-Path $PyScript)) {
    Write-Error "找不到 $PyScript"
    exit 1
}

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    $py = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $py) {
    Write-Error "未找到 python / py，请先安装 Python 3"
    exit 1
}

$argsList = @($PyScript, $Command)

if ($Base) { $argsList += @("--base", $Base) }
if ($AppId) { $argsList += @("--appid", $AppId) }
if ($Secret) { $argsList += @("--secret", $Secret) }
if ($Uid -gt 0) { $argsList += @("--uid", $Uid) }
if ($RootId -gt 0) { $argsList += @("--root-id", $RootId) }

switch ($Command) {
    "call" {
        if (-not $Opt) {
            Write-Error "call 需要 -Opt 参数，例如 -Opt getCourseTopic"
            exit 1
        }
        $argsList += @("--opt", $Opt)
        foreach ($p in $Param) { $argsList += @("--param", $p) }
    }
    "player" {
        if ($VideoId -le 0) {
            Write-Error "player 需要 -VideoId"
            exit 1
        }
        $cdb = if ($Cdbid -gt 0) { $Cdbid } else { $Uid }
        $argsList += @("--video-id", $VideoId, "--cdbid", $cdb)
    }
    "sign" {
        if ($Opt) { $argsList += @("--opt", $Opt) }
    }
}

& $py.Source @argsList
exit $LASTEXITCODE

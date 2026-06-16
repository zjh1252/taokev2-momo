<#
  生成 tabBar 图标 PNG（仅在需要更换图标时运行一次）
  - 直接用 WPF + Material Icons SVG path 渲染到 96×96 透明底 PNG
  - 输出 8 个文件：{home,expert,course,user}{,-active}.png
  - 默认 #888888，激活态 #E62117

  运行（在 taoke-uniapp/ 根下）：
    powershell -ExecutionPolicy Bypass -File static/tabbar/generate-tabbar-icons.ps1

  来源：Material Icons (Apache 2.0)
    home    = action/home
    badge   = social/badge   （替代设计稿的 psychology，表达专家胸卡 / 资质感）
    school  = social/school
    person  = social/person
#>

param(
  [string]$OutDir = (Join-Path $PSScriptRoot ''),
  [int]$Size = 96
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase | Out-Null

$icons = [ordered]@{
  'home'   = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'
  'expert' = 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z'
  'course' = 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z'
  'user'   = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
}

function Render-Icon {
  param([string]$PathData, [string]$ColorHex, [string]$OutFile, [int]$S)
  $color = [System.Windows.Media.ColorConverter]::ConvertFromString($ColorHex)
  $brush = New-Object System.Windows.Media.SolidColorBrush($color)
  $brush.Freeze()
  $geometry = [System.Windows.Media.Geometry]::Parse($PathData)
  $geometry.Freeze()

  $visual = New-Object System.Windows.Media.DrawingVisual
  $dc = $visual.RenderOpen()
  $scale = $S / 24.0
  $transform = New-Object System.Windows.Media.ScaleTransform($scale, $scale)
  $dc.PushTransform($transform)
  $dc.DrawGeometry($brush, $null, $geometry)
  $dc.Pop()
  $dc.Close()

  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($S, $S, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($visual)

  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $frame = [System.Windows.Media.Imaging.BitmapFrame]::Create($rtb)
  $encoder.Frames.Add($frame)
  $stream = New-Object System.IO.FileStream($OutFile, [System.IO.FileMode]::Create)
  try {
    $encoder.Save($stream)
  } finally {
    $stream.Close()
  }
}

if (!(Test-Path $OutDir)) {
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
}

foreach ($name in $icons.Keys) {
  $defaultPath = Join-Path $OutDir "$name.png"
  $activePath  = Join-Path $OutDir "$name-active.png"
  Render-Icon -PathData $icons[$name] -ColorHex '#888888' -OutFile $defaultPath -S $Size
  Render-Icon -PathData $icons[$name] -ColorHex '#E62117' -OutFile $activePath  -S $Size
  Write-Host ("OK  {0,-7}  {1,5} bytes / {2,5} bytes (active)" -f $name, (Get-Item $defaultPath).Length, (Get-Item $activePath).Length)
}

Write-Host ""
Write-Host "Done. Output: $OutDir"

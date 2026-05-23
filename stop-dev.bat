@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================
echo  淘课网 v2 - 停止开发环境
echo  Backend  : 8080 (taoke-backend)
echo  Frontend : 3000 (taoke-frontend)
echo  Admin    : 3001 (taoke-admin)
echo ================================================

rem 1) 按窗口标题关闭 start-dev.bat 启动的三个 cmd 窗口（连同其中的进程树）
for %%T in (taoke-backend taoke-frontend taoke-admin) do (
    taskkill /FI "WINDOWTITLE eq %%T*" /T /F >nul 2>&1 && (
        echo 已关闭窗口 %%T
    ) || (
        echo 未找到窗口 %%T，跳过。
    )
)

rem 2) 按端口兜底清理残留的监听进程
for %%P in (8080 3000 3001) do (
    set "FOUND="
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        set "FOUND=1"
        echo 端口 %%P 仍被 PID %%I 占用，正在结束...
        taskkill /PID %%I /T /F >nul 2>&1
    )
    if not defined FOUND echo 端口 %%P 已释放。
)

echo.
echo 清理完成，窗口将自动关闭。
endlocal

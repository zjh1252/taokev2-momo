@echo off
chcp 65001 >nul
setlocal

rem 项目根目录（%~dp0 自带结尾反斜杠，与具体盘符/路径无关）
set "ROOT=%~dp0"

echo ================================================
echo  淘课网 v2 - 一键启动开发环境
echo  Backend  : mvn clean install + spring-boot:run (taoke-app)
echo  Frontend : http://localhost:3000  (pnpm)
echo  Admin    : http://localhost:3001  (bun)
echo ================================================

echo [1/3] 启动 Backend...
start "taoke-backend" cmd /k "chcp 65001 >nul && cd /d "%ROOT%backend" && mvn clean install -DskipTests && mvn spring-boot:run -pl taoke-app"
rem 无法启动时，在本地 dev 库上执行 repair，把 flyway_schema_history 里的 checksum 更新为当前文件值（不重新执行 SQL）：
rem cd backend/taoke-app
rem mvn flyway:repair
rem mvn flyway:migrate

echo [2/3] 启动 Frontend (C 端, 端口 3000)...
start "taoke-frontend" cmd /k "chcp 65001 >nul && cd /d "%ROOT%frontend" && pnpm dev -p 3000"

echo [3/3] 启动 Admin Frontend (后台, 端口 3001)...
start "taoke-admin" cmd /k "chcp 65001 >nul && cd /d "%ROOT%admin-frontend" && bun dev -p 3001"

echo.
echo 三个服务已在各自窗口启动，关闭对应窗口即可停止该服务。
endlocal

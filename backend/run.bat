@echo off
chcp 65001 >nul
cd /d F:\taoke\repos\taokev2-mono\backend

echo [1/2] 编译安装所有模块...
call mvn clean install -DskipTests
if %errorlevel% neq 0 (
    echo 编译失败，请检查错误信息
    pause
    exit /b 1
)

echo [2/2] 启动应用...
call mvn spring-boot:run -pl taoke-app

pause
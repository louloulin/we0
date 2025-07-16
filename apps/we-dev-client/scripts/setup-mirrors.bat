@echo off
echo 正在配置Electron国内镜像...

REM 设置Electron镜像环境变量
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_CUSTOM_DIR={{ version }}
set ELECTRON_CACHE=%TEMP%\.electron

REM 设置其他常用镜像
set SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass/
set PHANTOMJS_CDNURL=https://npmmirror.com/mirrors/phantomjs/
set CHROMEDRIVER_CDNURL=https://npmmirror.com/mirrors/chromedriver/
set SQLITE3_BINARY_HOST_MIRROR=https://npmmirror.com/mirrors/
set NODE_SQLITE3_BINARY_HOST_MIRROR=https://npmmirror.com/mirrors/

REM 设置npm镜像
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

echo ✅ Electron镜像配置完成！
echo 📦 Electron镜像: %ELECTRON_MIRROR%
echo 🔧 其他镜像已配置
pause

# Yachiyo

第三方音乐播放器，聚合网易云音乐与 QQ 音乐，基于 Electron + React + Vite + TypeScript 构建。

## 功能

- **双音源**：网易云音乐、QQ 音乐，扫码登录、歌单同步、搜索
- **播放**：Howler 音频引擎，播放队列、进度控制、音量调节
- **歌词**：逐行歌词、翻译、桌面悬浮歌词窗、全屏歌词
- **每日推荐**：基于收听行为画像的推荐引擎
- **桌面集成**：系统托盘、全局快捷键、Windows 缩略图工具栏、开机自启、单实例锁
- **其他**：深色/浅色主题、播放历史、歌单导入

## 技术栈

- Electron 33 + electron-vite 3
- React 18 + TypeScript 5
- Zustand 状态管理
- Howler 音频引擎
- Framer Motion 动画
- Lucide 图标

## 目录结构

```text
src/
  main/        Electron 主进程（IPC、账号、流媒体、歌词、托盘、快捷键）
  preload/     预加载脚本与 API 类型定义
  renderer/    React 渲染进程（页面、组件、状态、样式）
  shared/      主进程与渲染进程共享的类型
build/         electron-builder 构建资源（installer.nsh、图标）
resources/     应用图标
```

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

Windows 安装器由 [Inno Setup 6](https://jrsoftware.org/isdl.php) 打包:`build:win` 先用 electron-builder 产出免安装目录,再自动调用 Inno Setup 编译 `build/yachiyo.iss` 生成 `dist/installer/Yachiyo-<版本>-setup.exe`(脚本按标准路径自动定位 ISCC.exe,也可用环境变量 `INNO_SETUP_PATH` 指定)。

## 代码规范

```bash
npm run lint          # ESLint 检查
npm run lint:fix      # ESLint 自动修复
npm run format        # Prettier 格式化
npm run typecheck     # TypeScript 类型检查
```

## 许可

MIT
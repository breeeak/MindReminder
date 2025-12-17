# 应用品牌和安装配置说明

## 已完成的配置

### 1. 应用标题修改 ✅

**修改内容：**
- `src/renderer/index.html`: 标题从 "Electron" 改为 "MindReminder - 智能复习助手"
- `src/main/index.ts`: BrowserWindow 添加 `title` 属性
- `package.json`: 添加 `productName: "MindReminder"`

**效果：**
- 窗口标题栏现在显示 "MindReminder - 智能复习助手"
- 任务栏显示 "MindReminder"

### 2. 应用图标 ✅

**当前图标位置：**
- `build/icon.ico` - Windows 图标
- `build/icon.icns` - macOS 图标
- `build/icon.png` - 通用图标（原子设计）

**图标说明：**
- 已有的原子图标设计很符合"智能学习"的主题
- 青蓝色的原子轨道象征知识的流转和记忆的强化
- 深色背景现代且专业

**如需更换图标：**
1. 准备一张 512x512 或更大的 PNG 图标
2. 使用在线工具或软件生成：
   - Windows: `.ico` 格式（推荐包含多个尺寸：16, 32, 48, 64, 128, 256）
   - macOS: `.icns` 格式
3. 替换 `build/` 目录下的对应文件

### 3. 安装包配置 ✅

**electron-builder.yml 新增功能：**

#### Windows 安装程序 (NSIS)
```yaml
nsis:
  oneClick: false                              # 非一键安装，显示安装向导
  allowToChangeInstallationDirectory: true     # 允许用户选择安装位置
  allowElevation: true                         # 允许提升权限
  createDesktopShortcut: always                # 始终创建桌面快捷方式
  createStartMenuShortcut: true                # 创建开始菜单快捷方式
  perMachine: false                            # 为当前用户安装（而非所有用户）
```

**安装过程：**
1. 用户双击 `MindReminder-1.0.0-Setup.exe`
2. 显示安装向导
3. 用户可以选择安装位置（默认：`%LOCALAPPDATA%\Programs\MindReminder`）
4. 用户可以选择是否创建桌面快捷方式
5. 完成安装

#### 便携版
配置中还添加了便携版构建目标：
```yaml
win:
  target:
    - target: nsis      # 安装程序版
    - target: portable  # 便携版（无需安装）
```

运行 `npm run build:win` 后会生成两个文件：
- `MindReminder-1.0.0-Setup.exe` - 安装程序
- `MindReminder-1.0.0.exe` - 便携版（双击直接运行）

### 4. 产品信息更新 ✅

**更新内容：**
- AppId: `com.mindreminder.app`
- Product Name: `MindReminder`
- Executable Name: `MindReminder`
- Shortcut Name: `MindReminder`

## 构建安装包

### 开发测试
```bash
# 开发模式运行（查看标题变化）
npm run dev
```

### 构建 Windows 安装包
```bash
# 完整构建（包含类型检查）
npm run build:win

# 仅打包（跳过类型检查，快速测试）
npm run build:unpack
```

### 构建产物位置
```
dist/
├── MindReminder-1.0.0-Setup.exe    # 安装程序
├── MindReminder-1.0.0.exe          # 便携版
└── win-unpacked/                    # 未打包的文件（用于测试）
```

## 安装程序功能特性

### 用户可配置选项
- ✅ 自定义安装路径
- ✅ 是否创建桌面快捷方式
- ✅ 是否创建开始菜单快捷方式
- ✅ 安装位置验证（磁盘空间检查）

### 安装程序特性
- 现代化安装界面
- 支持进度显示
- 支持卸载程序
- 自动创建卸载注册表项
- 支持版本升级（覆盖安装）

## 进阶配置

### 添加许可协议
如需添加许可协议，在 `electron-builder.yml` 中：
```yaml
nsis:
  license: LICENSE.txt  # 指向许可协议文件
```

### 多语言支持
```yaml
nsis:
  language: "2052"  # 简体中文
  # 或使用多语言
  installerLanguages:
    - zh_CN
    - en_US
```

### 修改安装程序外观
```yaml
nsis:
  installerSidebar: build/installer-sidebar.bmp  # 164x314
  installerHeader: build/installer-header.bmp     # 150x57
```

## 测试清单

### 标题显示测试
- [ ] 运行 `npm run dev`
- [ ] 确认窗口标题显示 "MindReminder - 智能复习助手"
- [ ] 确认任务栏显示 "MindReminder"
- [ ] 确认托盘图标正常显示

### 安装包测试
- [ ] 构建安装包 `npm run build:win`
- [ ] 运行安装程序
- [ ] 确认可以选择安装位置
- [ ] 确认桌面快捷方式创建成功
- [ ] 确认开始菜单快捷方式创建成功
- [ ] 运行安装后的应用
- [ ] 测试卸载功能

### 图标测试
- [ ] 安装程序图标正确显示
- [ ] 桌面快捷方式图标正确显示
- [ ] 任务栏图标正确显示
- [ ] 托盘图标正确显示
- [ ] 开始菜单图标正确显示

## 常见问题

### Q: 安装包太大？
A: 检查 `electron-builder.yml` 中的 `files` 配置，确保排除了不必要的文件。

### Q: 想要更改默认安装路径？
A: 在 `electron-builder.yml` 的 `nsis` 配置中添加：
```yaml
nsis:
  installerPath: "C:\\Program Files\\YourCompany"
```

### Q: 如何添加安装完成后自动启动？
A: 添加配置：
```yaml
nsis:
  runAfterFinish: true
```

### Q: 如何生成自定义图标？
A: 推荐使用以下工具：
- 在线工具: https://converticon.com/
- 桌面工具: IcoFX, GIMP
- macOS: 使用 Iconutil 命令行工具

## 相关文件

- `electron-builder.yml` - 打包配置
- `package.json` - 项目元信息
- `src/main/index.ts` - 主进程配置
- `src/renderer/index.html` - 渲染进程 HTML
- `build/icon.*` - 应用图标文件

---

**配置完成时间：** 2025-12-15
**配置版本：** v1.0.0



# 应用更新系统说明文档

## 概述

本文档说明了应用的自动更新机制，包括 `releaseInfo` 数据来源、更新流程以及如何自定义更新服务器。

## 一、releaseInfo 数据来源

### 1.1 数据源头

`releaseInfo` 的原始数据来自**更新服务器**（GitHub Releases 或自定义服务器），包含以下信息：

```typescript
interface UpdateInfo {
  version: string           // 版本号
  releaseDate: string       // 发布日期
  releaseNotes: string      // 更新说明
  path: string              // 安装包路径
  sha512: string            // 文件哈希
}
```

### 1.2 完整数据流程

```
更新服务器 (GitHub/GitCode/自建)
    ↓
    ↓ 提供元数据文件 (latest.yml)
    ↓
electron-updater 库
    ↓ checkForUpdates()
    ↓ 下载元数据 + 安装包
    ↓ 触发事件
    ↓
主进程 (AppUpdater.ts)
    ↓ 监听 update-available / update-downloaded
    ↓ processReleaseInfo() 处理多语言
    ↓ 通过 IPC 发送
    ↓
渲染进程 (UpdateDialogPopup.tsx)
    ↓ 接收 releaseInfo
    ↓ 显示更新弹窗
    └→ 用户操作：安装 / 稍后 / 忽略
```

## 二、关键代码位置

### 2.1 主进程监听（src/main/services/AppUpdater.ts）

```typescript
// 第84-88行：检测到可用更新
autoUpdater.on('update-available', (releaseInfo: UpdateInfo) => {
  const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
  windowService.getMainWindow()?.webContents.send(
    IpcChannel.UpdateAvailable, 
    processedReleaseInfo
  )
})

// 第101-105行：更新下载完成
autoUpdater.on('update-downloaded', (releaseInfo: UpdateInfo) => {
  const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
  windowService.getMainWindow()?.webContents.send(
    IpcChannel.UpdateDownloaded, 
    processedReleaseInfo
  )
})
```

### 2.2 releaseNotes 处理（第390-402行）

```typescript
private processReleaseInfo(releaseInfo: UpdateInfo): UpdateInfo {
  const processedInfo = { ...releaseInfo }
  
  // 处理多语言发布说明
  if (releaseInfo.releaseNotes && typeof releaseInfo.releaseNotes === 'string') {
    if (this.hasMultiLanguageMarkers(releaseInfo.releaseNotes)) {
      processedInfo.releaseNotes = this.parseMultiLangReleaseNotes(
        releaseInfo.releaseNotes
      )
    }
  }
  
  return processedInfo
}
```

### 2.3 渲染进程显示（src/renderer/src/components/Popups/UpdateDialogPopup.tsx）

```typescript
const PopupContainer: React.FC<Props> = ({ releaseInfo, resolve }) => {
  const releaseNotes = releaseInfo?.releaseNotes
  
  return (
    <Modal title={t('update.title')} ...>
      <Markdown>
        {typeof releaseNotes === 'string'
          ? releaseNotes
          : Array.isArray(releaseNotes)
            ? releaseNotes.map(note => note.note).join('\n\n')
            : t('update.noReleaseNotes')}
      </Markdown>
    </Modal>
  )
}
```

## 三、如果不走 GitHub 发布

### 3.1 已支持的更新源

代码已内置多种更新源支持（packages/shared/config/constant.ts）：

```typescript
// 可用的更新服务器
export enum FeedUrl {
  PRODUCTION = 'https://aionly.com',  // 自建服务器
  GITHUB_LATEST = 'https://gitee.com/myme/aionly-studio/releases/latest/download'
}

// 支持的镜像源
export enum UpdateMirror {
  GITHUB = 'github',   // GitHub（国外）
  GITCODE = 'gitcode'  // GitCode（国内镜像）
}

// 更新配置文件地址
export enum UpdateConfigUrl {
  GITHUB = 'https://gitee.com/myme/aionly-studio/.../app-upgrade-config.json',
  GITCODE = 'https://raw.gitee.com/myme/aionly-studio/.../app-upgrade-config.json'
}
```

### 3.2 自动镜像切换

代码已实现根据用户 IP 地址自动选择镜像（AppUpdater.ts 第250-251行）：

```typescript
const ipCountry = await getIpCountry()
const mirror = ipCountry.toLowerCase() === 'cn' ? UpdateMirror.GITCODE : UpdateMirror.GITHUB
```

国内用户自动使用 GitCode 镜像，无需手动配置。

## 四、搭建自定义更新服务器

### 4.1 服务器文件结构

```
https://your-server.com/
├── latest.yml              # Windows 元数据
├── latest-mac.yml          # macOS 元数据
├── latest-linux.yml        # Linux 元数据
├── app-1.0.0.exe           # Windows 安装包
├── app-1.0.0.dmg           # macOS 安装包
└── app-1.0.0.AppImage      # Linux 安装包
```

### 4.2 元数据文件格式（latest.yml）

```yaml
version: 1.0.0
releaseDate: '2024-01-01T00:00:00.000Z'
path: app-1.0.0.exe
sha512: <sha512-hash-of-installer>
releaseNotes: |
  ## 版本 1.0.0 更新内容
  
  ### 新增功能
  - 功能1说明
  - 功能2说明
  
  ### 优化改进
  - 改进1
  - 改进2
  
  ### 问题修复
  - 修复1
  - 修复2
```

### 4.3 多语言 releaseNotes 格式

```yaml
releaseNotes: |
  <!--LANG:en-->
  ## Version 1.0.0
  
  ### New Features
  - Feature 1
  - Feature 2
  
  <!--LANG:zh-CN-->
  ## 版本 1.0.0
  
  ### 新增功能
  - 功能1
  - 功能2
  
  <!--LANG:END-->
```

客户端会根据用户语言自动提取对应语言的内容。

### 4.4 修改代码配置

#### 方法一：修改常量（推荐）

修改 `packages/shared/config/constant.ts`：

```typescript
export enum FeedUrl {
  PRODUCTION = 'https://your-server.com',  // 改为你的服务器地址
  GITHUB_LATEST = 'https://github.com/...'
}
```

#### 方法二：通过配置文件

修改 `app-upgrade-config.json` 中的 `feedUrls`：

```json
{
  "versions": {
    ">=1.0.0": {
      "channels": {
        "latest": {
          "version": "1.0.0",
          "feedUrls": {
            "github": "https://github.com/...",
            "gitcode": "https://gitcode.com/...",
            "custom": "https://your-server.com"  // 添加自定义源
          }
        }
      }
    }
  }
}
```

### 4.5 生成 SHA512 哈希

使用以下命令生成安装包的 SHA512 哈希：

```bash
# macOS/Linux
shasum -a 512 app-1.0.0.exe | awk '{print $1}' | base64

# Windows (PowerShell)
certUtil -hashfile app-1.0.0.exe SHA512
```

## 五、测试更新功能

### 5.1 本地测试

1. 修改 `package.json` 中的版本号为较低版本
2. 启动应用：`pnpm dev`
3. 在设置中点击"检查更新"
4. 观察控制台日志和更新弹窗

### 5.2 查看日志

更新相关日志位于：
- Windows: `%APPDATA%/AiOnly/logs/`
- macOS: `~/Library/Logs/AiOnly/`
- Linux: `~/.config/AiOnly/logs/`

搜索关键词：`AppUpdater`、`update available`、`update downloaded`

## 六、常见问题

### 6.1 更新检查失败

**可能原因**：
- 网络连接问题
- 服务器地址错误
- 元数据文件格式错误

**排查方法**：
```typescript
// 查看 AppUpdater.ts 第78-82行的错误日志
autoUpdater.on('error', (error) => {
  logger.error('update error', error)
})
```

### 6.2 releaseNotes 不显示

**可能原因**：
- 元数据文件中缺少 `releaseNotes` 字段
- 多语言标记格式错误

**解决方法**：
- 确保 `latest.yml` 包含 `releaseNotes` 字段
- 检查多语言标记格式是否正确

### 6.3 下载卡住不动

**可能原因**：
- 安装包文件过大
- 网络速度慢
- 服务器带宽限制

**解决方法**：
- 使用 CDN 加速
- 分块下载（需要服务器支持 Range 请求）
- 提供断点续传功能

## 七、安全建议

1. **使用 HTTPS**：所有更新 URL 必须使用 HTTPS 协议
2. **验证签名**：electron-updater 会自动验证 SHA512 哈希
3. **代码签名**：安装包应使用代码签名证书签名
4. **版本控制**：严格控制版本号，避免降级攻击

## 八、参考资源

- [electron-updater 官方文档](https://www.electron.build/auto-update)
- [更新配置示例](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)
- 项目代码：
  - 主进程更新服务：`src/main/services/AppUpdater.ts`
  - 更新弹窗组件：`src/renderer/src/components/Popups/UpdateDialogPopup.tsx`
  - 配置常量：`packages/shared/config/constant.ts`

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-09  
**维护者**: AI Assistant
